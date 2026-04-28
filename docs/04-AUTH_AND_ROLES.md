# 04 — Authentication & Roles

## The role tree

```
super_admin                    (platform operators — us)
├── owner                      (bakery owner, one per bakery at signup; can promote others)
├── manager                    (bakery manager, can manage staff + products + orders)
└── staff                      (bakery staff, can manage orders only)

customer                       (everyone else)
guest                          (no account; can browse; can place orders with email+phone)
```

Three token namespaces, three secrets. A token signed for one namespace is unusable in another — this is not a convention, it is enforced by the signing key.

## Token strategy

### Access tokens
- **Format:** JWT (HS256)
- **TTL:** 15 minutes
- **Storage:** HTTP-only cookie, `SameSite=Lax`, `Secure` in production, `Path=/`
- **Claims:** `kind`, `sub`, role-specific fields, `iat`, `exp`
- **Secret:** one of `JWT_CUSTOMER_SECRET`, `JWT_BAKERY_SECRET`, `JWT_SUPERADMIN_SECRET` depending on `kind`

### Refresh tokens
- **Format:** 256-bit random string (not a JWT — opaque)
- **TTL:** 30 days
- **Storage:** HTTP-only cookie, same flags as access token, `Path=/v1/*/auth/refresh`
- **Server-side:** SHA-256 hash stored in `refresh_tokens` table; raw value never stored
- **Rotation:** every refresh issues a new refresh token and revokes the previous one

### Signing keys
```
JWT_CUSTOMER_SECRET     → customer tokens
JWT_BAKERY_SECRET       → bakery_user tokens (owner, manager, staff)
JWT_SUPERADMIN_SECRET   → super_admin tokens
JWT_REFRESH_SECRET      → (not used to sign refresh tokens; those are random; this is reserved for a future use like signing one-time-use recovery tokens)
```

Secrets are 64-character hex (256 bits). Generate with `openssl rand -hex 32`.

Rotating a secret invalidates every token signed with it — which is the point. On rotation, all users of that class are logged out.

## Authentication flows

### Customer signup

```
POST /v1/customer/auth/signup
Body: { email, password, full_name?, phone?, marketing_opt_in? }

1. Validate with Zod schema (email format, password >= 10 chars with complexity, phone in Ugandan format if supplied).
2. Hash password with argon2id (t=3, m=65536, p=1).
3. Insert into customers table with email_verified_at = NULL.
4. Generate email verification token (32 random bytes, store hash in email_verification_tokens, 24-hour TTL).
5. Send email via Resend.
6. Return 201 with no session — user must verify email before logging in.

Rate limit: 5/hour per IP.
```

### Customer login

```
POST /v1/customer/auth/login
Body: { email, password }

1. Look up customer by email.
2. Verify password with argon2.
3. If email_verified_at IS NULL, return 403 with code 'email_not_verified' (safe to disclose —
   attacker already knows the email from the attempted login).
4. Mint access token (15 min, JWT_CUSTOMER_SECRET).
5. Mint refresh token (30 day, store SHA-256 in refresh_tokens).
6. Set cookies. Return 200 with { customer: { id, email, full_name, favourite_bakery_id, ... } }.
7. Write audit_log row.

Rate limit: 10/hour per email address; 30/hour per IP. Exponential backoff on failure.
```

### Bakery signup (owner self-serve)

```
POST /v1/bakery/auth/signup
Body: {
  bakery: { legal_name, display_name, slug, phone, email, address_line1, city, latitude, longitude, ... },
  owner: { email, password, full_name, phone }
}

1. Validate both bakery and owner fields.
2. Check slug availability.
3. Start transaction:
     - INSERT INTO bakeries (..., status = 'pending_approval')
     - INSERT INTO bakery_users (..., bakery_id = new.id, role = 'owner', email_verified_at = NULL)
4. Commit.
5. Send email to owner (verify email).
6. Send email to super-admin team (new bakery pending approval).
7. Return 201, no session. Owner must verify email AND super-admin must approve before login works.

Rate limit: 2/hour per IP.
```

### Bakery login

Same as customer but with the bakery_users table and JWT_BAKERY_SECRET. Additional gate: if the bakery itself is `suspended` or `archived`, login is rejected with a helpful message. If `pending_approval`, the owner can log in *only* to see a "your application is under review" page (controlled by a special `limited_access` claim in the token).

### Super-admin login

- Email/password gated at the network layer too (optional IP allowlist via `SUPERADMIN_IP_ALLOWLIST`).
- **2FA mandatory.** TOTP via authenticator app. Secret stored in `super_admin_users.totp_secret`.
- Post-password verification, a second form takes the 6-digit TOTP code.
- No public signup endpoint. Super-admins are provisioned by an existing super-admin via an invite email that contains a one-time token.

```
POST /v1/admin/auth/login
Body: { email, password, totp_code }
```

## Middleware chains

```
Customer routes:
  authenticateToken (JWT_CUSTOMER_SECRET)
    → requireCustomerContext
      → setDbTenantContext (no bakery_id; RLS role = 'customer')
        → controller

Public routes (no auth required but may have session):
  authenticateTokenOptional (tries customer secret)
    → controller  (can inspect req.auth if present)

Bakery routes:
  authenticateToken (JWT_BAKERY_SECRET)
    → requireBakeryContext
      → requireBakeryRole('owner' | 'manager' | 'staff')
        → setDbTenantContext (bakery_id from token; RLS role = 'bakery_user')
          → controller

Super-admin routes:
  ipAllowlist (optional)
    → authenticateToken (JWT_SUPERADMIN_SECRET)
      → requireSuperAdminContext
        → setDbTenantContext (RLS role = 'super_admin')
          → auditActionStart
            → controller
              → auditActionEnd
```

`auditActionStart` / `auditActionEnd` wrap the controller so every super-admin action is logged with start timestamp, end timestamp, and HTTP status. A panicking controller is still audited.

## Password rules

- Minimum 10 characters
- Must contain at least one letter and one digit
- Common-password check against a 10k list bundled with the API
- Not the same as the user's email
- Not reused from last 3 passwords (via hash comparison on change)

We do not enforce "must contain a special character" — NIST explicitly warns against this in SP 800-63B as it encourages predictable substitutions.

## Email verification

All three user classes require email verification before full access.
- Token format: 32 random bytes, base64url
- Stored as SHA-256 hash in `email_verification_tokens`
- Single use, 24-hour TTL
- Verification URL: `https://eatgooduganda.com/verify-email?token=...` (customer), `https://bakery.eatgooduganda.com/verify-email?token=...` (bakery user)
- Super-admins receive a different flow via invitation

## Password reset

```
POST /v1/<namespace>/auth/forgot-password
Body: { email }

Always returns 200 regardless of whether the email exists. Enumeration defence.

If the email exists:
  - Generate 32-byte token
  - Hash and store in password_reset_tokens (TTL 30 min)
  - Send email with reset URL

POST /v1/<namespace>/auth/reset-password
Body: { token, new_password }

- Look up token by hash
- Verify not expired, not used
- Update password_hash
- Revoke all active refresh tokens for this user
- Mark reset token used
- Return 200

Rate limit: 3/hour per email, 10/hour per IP.
```

## Session revocation

- **Logout:** revoke the current refresh token; client clears cookies.
- **Logout everywhere:** revoke all refresh tokens for the user. New logins required.
- **Admin-forced logout:** super-admin can revoke any bakery user's or customer's tokens.
- **Email change:** forces a logout everywhere.
- **Password change:** forces a logout everywhere except the current session.
- **Bakery suspension:** all tokens for that bakery's users are revoked immediately by a trigger-invoked job.

## CSRF strategy

We use the **double-submit cookie pattern**:
- On any authenticated request, the client reads a `X-CSRF-Token` value from a readable cookie and sends it as a header.
- The server issues this token at login and on every response in a non-HttpOnly cookie.
- `SameSite=Lax` on all auth cookies also prevents cross-origin form submissions from carrying credentials.
- State-changing endpoints (`POST`, `PATCH`, `DELETE`, `PUT`) require the CSRF header to match the cookie.
- `GET`/`HEAD` are exempt.

## Rate limiting

Implemented with `express-rate-limit` backed by an in-process LRU (Neon has no Redis, and Redis is overkill at MVP). Specific limits:

| Endpoint class | Window | Limit |
|---|---|---|
| Login | 1 hour | 10/email, 30/IP |
| Signup | 1 hour | 5/IP |
| Password reset request | 1 hour | 3/email, 10/IP |
| Everything else authenticated | 15 minutes | 300/session |
| Public reads | 15 minutes | 300/IP |
| Webhooks | 1 minute | 200/provider |

On limit exceed: `429 Too Many Requests` with `Retry-After` header.

## Secrets handling in code

- Secrets come from `process.env`, validated on boot via a Zod schema. If any required secret is missing or malformed, the server **refuses to start** with a clear error.
- Secrets are never logged. The logger has a deny-list that redacts keys matching `/secret|password|token|key|auth/i` in structured log payloads.
- Payment credentials stored per-bakery are AES-256-GCM encrypted with `CREDENTIALS_ENCRYPTION_KEY` (see `docs/07-PAYMENTS.md`).

## What we explicitly reject

- **LocalStorage for tokens.** HTTP-only cookies only. XSS-resistant by design.
- **Refresh-with-access-token in the same request.** The refresh endpoint requires only the refresh cookie, and uses a separate path so it is not carried on every request.
- **Role-based shortcuts via claims alone for tenant access.** A `role=manager` claim does not unlock another bakery — the `bakery_id` claim is what grants access, and the role modifies what the user can do *within* that bakery.
- **Shared admin credentials.** Each super-admin has their own account, their own TOTP, their own audit trail.
