# 04 — Security Rules (Non-Negotiable)

## Secrets

- **Never** commit a real secret. `.env` is gitignored; `.env.example` documents the contract.
- **Never** log a secret, token, password hash, payment credential, or TOTP code.
- **Never** return a secret or credential to the frontend. Payment credentials are decrypted server-side for the duration of the provider call and discarded.
- **Validate** every required env var on boot via a Zod schema. Refuse to start if anything is missing or malformed.
- **Rotate** every secret at least annually, and immediately on any suspicion of compromise.

## Authentication

- Passwords hashed with **argon2id** (`t=3`, `m=65536`, `p=1`). Never bcrypt for new code.
- Access tokens are JWTs signed with HMAC-SHA256, TTL 15 minutes.
- Refresh tokens are **opaque random 256-bit values**, never JWTs. Hashed with SHA-256 before storage.
- Three separate signing secrets for customer / bakery_user / super_admin tokens. Never cross-used.
- Cookies: `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path` scoped, no `Domain` unless necessary.
- **Never** store tokens in localStorage or sessionStorage. Cookies only.
- CSRF: double-submit cookie pattern on state-changing endpoints. `GET`/`HEAD` exempt.

## Authorisation

- Role comes from the token, not the request.
- Tenant comes from the token (for bakery_user), not the request.
- Return `404` on cross-tenant lookups, not `403`. See `instructions/03-multi-tenancy-rules.md`.
- Super-admin actions audit-logged with reason.
- Sensitive actions (password change, email change, role change, payment-credential update) require a fresh password re-auth within the last 10 minutes.

## Input validation

- Every request body validated against a Zod schema defined in `packages/shared`.
- Every query parameter and URL parameter validated (ID is a UUID, string length bounded, enum values confirmed).
- Never use `req.body.*` directly in business logic — use the parsed, typed schema result.

## SQL

- **Parameterised queries only.** Always. No exceptions. `db.query(sql\`WHERE email = ${email}\`)` uses a tagged template that safely parameterises — that is fine. String concatenation into SQL is never fine.
- Least-privilege DB user: the application runs as a user with `SELECT/INSERT/UPDATE/DELETE` on application tables; it cannot `DROP`, `TRUNCATE`, `ALTER`, or `CREATE`. Migrations use a separate privileged user.

## XSS

- React escapes by default — use it.
- **Never** `dangerouslySetInnerHTML` for user input. The only legitimate use is for admin-authored rich text that has been sanitised via `DOMPurify`, and even then, scrutinised.
- Customer-entered names, messages, and notes are treated as untrusted everywhere they are displayed (bakery admin, emails, super-admin) — escape in emails too.

## CSRF

- Double-submit cookie on authenticated state-changing endpoints.
- Non-authenticated POST endpoints (contact form) use a CAPTCHA or a honeypot field.
- `SameSite=Lax` on auth cookies blocks cross-origin CSRF by default.

## File uploads

- Uploads go **directly to Cloudinary** via signed upload presets. The API never handles file bytes in the hot path.
- Upload preset configuration limits file size (≤ 5 MB), allowed formats (JPEG, PNG, WebP, PDF for bank proofs), and folder scope.
- Uploaded URL is stored on the relevant row (product image, bank proof). Validate the URL matches our Cloudinary account pattern before storing.

## Rate limiting

- Implemented globally via `express-rate-limit`.
- Stricter limits on `/auth/*` and `/webhooks/*` endpoints.
- See `docs/04-AUTH_AND_ROLES.md` for the numbers.

## CORS

- Exact origin allowlist. No `*`.
- `Access-Control-Allow-Credentials: true` only on explicitly-matched origins.
- No exposing headers that leak server information (`X-Powered-By` disabled).

## Webhooks

- Inbound telco webhooks: resolve the payment row by reference, then re-call the provider's status API to confirm. Never trust the webhook body alone.
- Respond 200 quickly (within 3 seconds) regardless of internal processing success. Failed processing is logged and retried via a reconciliation job.

## Payments

- Amount verified against the order total server-side. Never trust the amount from a webhook.
- Idempotency keys required on initiation.
- Currency always verified against `UGX` at MVP.

## Logging

- `pino` logger.
- Structured, JSON to stdout.
- Redaction list: `password`, `passwordHash`, `token`, `refreshToken`, `secret`, `key`, `apiKey`, `subscriptionKey`, `clientSecret`, `authorization`.
- PII (email, phone) logged at `debug` level only, never `info` or higher.
- **Never** log full request bodies on auth or payment endpoints.

## Response headers

Global defaults set on every response:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()`

## CSP

On customer and bakery-admin pages (set via Vercel headers):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'strict-dynamic' 'nonce-<nonce>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://res.cloudinary.com;
  font-src 'self';
  connect-src 'self' https://eatgood-api.onrender.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
```

## Dependencies

- `pnpm audit` runs in CI. High-severity findings block merge.
- Dependabot PRs reviewed weekly.
- No dependency added to a root `package.json` without justification.
- Pin major versions for `argon2`, `jsonwebtoken`, `express`, `pg`, and anything else security-critical.

## Incident response

See `workflows/incident-response.md`. If you discover a security issue during development:
1. Do not open a public issue.
2. Notify the repo owner directly.
3. If you can mitigate with a private patch, do so on a private branch.
4. Coordinate disclosure after a fix ships.

## Red flags that must be escalated immediately

- You find data from Bakery A in a response for Bakery B.
- You find an unredacted secret in production logs.
- You find a `WHERE` clause missing `bakery_id` in shipped code.
- You find a webhook handler that trusts the body without re-verifying.
- You find a session cookie without `HttpOnly`.

Stop what you're doing, file it, and fix immediately. These are P0 incidents.
