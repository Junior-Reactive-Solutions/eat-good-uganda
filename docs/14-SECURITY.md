# 14 — Security

## Threat model (MVP)

We defend against:
- Cross-tenant data leaks (the primary concern — see `docs/03-MULTI_TENANCY.md`)
- Account takeover via credential stuffing, phishing, session hijacking
- Payment manipulation (tampering with amounts, replaying webhooks)
- Injection (SQL, XSS, CSRF, SSRF, XXE)
- Data exfiltration via scrapers and BOLA/IDOR
- DoS by low-effort attackers (rate-limited)
- Insider misuse by super-admins (audit logging)

We do not, at MVP, actively defend against:
- Nation-state-level attackers
- Sophisticated supply-chain attacks beyond pnpm lockfile discipline
- Zero-days in dependencies (we patch within 48 hours of disclosure)

## Key defensive choices (by layer)

### Network
- TLS 1.2+ everywhere. Cloudflare in front.
- HSTS with `preload` (after we are confident).
- Super-admin host optionally IP-allowlisted.

### HTTP
- Security headers on every response (see `docs/13-DEPLOYMENT.md`).
- Strict CORS: exact origin allowlist, no wildcards, credentials allowed only on known origins.
- CSP on customer and bakery-admin pages: `default-src 'self'`; permits Cloudinary and Resend asset hosts; blocks inline script (except hashed inline script for Vite's runtime).

### Auth
- JWT signed with HMAC-SHA256; three separate secrets, never cross-used.
- Passwords hashed with argon2id (t=3, m=65536, p=1).
- TOTP 2FA mandatory for super-admins.
- Refresh token rotation on every refresh; hash stored, raw only in cookie.
- Rate limits on auth endpoints (see `docs/04-AUTH_AND_ROLES.md`).

### Input
- Every body validated with a Zod schema. No raw `req.body.*` access in controllers.
- Query parameters: also validated.
- File uploads: Cloudinary signed upload presets; server never receives raw file bytes beyond a small thumbnail validation step for bank proof images.
- URL parameters that carry IDs are UUID-validated before hitting the DB.

### Database
- Parameterised queries only. No string concatenation into SQL under any circumstance.
- RLS as defence in depth (see `docs/02-DATABASE_SCHEMA.md`).
- Minimum-privilege DB user: `INSERT/UPDATE/SELECT/DELETE` on application tables; no `DROP`, `ALTER`, `CREATE`. Migrations use a separate DB user.
- Encrypted at rest (Neon-managed); encrypted in transit (`sslmode=require`).

### Secrets
- `.env` never committed; `.env.example` is the documented contract.
- On boot, the API validates every required secret is present and well-formed via Zod. Missing secret → refuse to start.
- Payment credentials encrypted at the field level (AES-256-GCM) in addition to at-rest encryption. See `docs/07-PAYMENTS.md`.
- Logs redact anything matching secret-like keys.

### Uploads
- Customer and bakery uploads go directly to Cloudinary via signed upload presets.
- Server issues a time-limited signature; Cloudinary enforces size and MIME type.
- Bank transfer proof uploads are also through Cloudinary; the URL is stored on the payment row. The customer's upload action is tied to their order so they cannot attach proofs to random orders.

### Payments
- Webhooks HMAC-verified (for internal webhooks); telco webhooks cross-verified by re-calling the provider status API.
- Amount always re-checked against the order; we never trust the amount returned by a webhook.
- Idempotency keys on every payment initiation to prevent double charges on client retry.

### Admin
- Every super-admin action audit-logged.
- 2FA mandatory.
- Optional IP allowlist at the edge.
- `/admin` on the customer host returns a hard 403 at the edge (see `docs/11-ADMIN_403.md`).

## Dependency hygiene

- pnpm with a committed `pnpm-lock.yaml`.
- Dependabot enabled on the repository for weekly updates.
- `pnpm audit` in CI; high-severity findings block merge.
- No `npm install` in docs or scripts; pnpm only.
- Pin major versions for security-critical dependencies (argon2, jsonwebtoken, express).

## Incident response

See `workflows/incident-response.md`. Summary:
1. Declare in `#eatgood-incidents` Slack channel.
2. Identify severity (P0–P3).
3. Decide on containment (rollback, disable feature flag, block IP, rotate secret).
4. Communicate to affected users within the severity's SLA.
5. Post-mortem within 72 hours for P0/P1.

## Data retention

- `orders`: retained indefinitely (required for bakery records and tax).
- `audit_log`: 1 year online, then archive.
- `email_log`: 90 days.
- `refresh_tokens` (revoked): 30 days, then deleted.
- `password_reset_tokens` (used/expired): 30 days, then deleted.
- `customer` soft-deleted accounts: 30 days, then hard-deleted (except orders, which are retained with `customer_id` set to NULL).

## What a security review should always check

A short, reviewable list to run through before any release:
1. New tables have `bakery_id` and RLS policies.
2. New endpoints have tenant-isolation tests.
3. No new `console.log` with payloads containing secrets, tokens, or PII.
4. No new `eval`, `new Function`, or `dangerouslySetInnerHTML`.
5. No new external HTTP call without timeout and retry bounds.
6. No new query built by string concatenation.
7. No new cookie without `HttpOnly` + `Secure` + `SameSite`.
8. No new file upload path that bypasses Cloudinary's signed presets.
