# Prompt 03 — Auth System

## Context

Schema exists (prompt 02). Now build the three-namespace auth system: customer, bakery_user, super_admin.

Read before starting:
- `docs/04-AUTH_AND_ROLES.md`
- `instructions/04-security-rules.md`
- `instructions/03-multi-tenancy-rules.md`

## Goal

Implement end-to-end auth for customers and bakery users: signup, login, refresh, logout, password reset, email verification. Super-admin auth scaffold (password + TOTP) but no signup endpoint (super-admins are invited — that flow is prompt 10).

## Deliverables

### `packages/shared/src/auth.ts`

- `CustomerToken`, `BakeryToken`, `SuperAdminToken`, `AnyToken` types per `docs/03-MULTI_TENANCY.md`.
- Zod schemas for each.

### `packages/shared/src/schemas/auth.ts`

- Signup, login, refresh, forgot-password, reset-password, verify-email body schemas for each namespace.
- Uganda phone number regex that accepts `+256...`, `256...`, `0...` and normalises to `+256`.
- Password policy per `docs/04-AUTH_AND_ROLES.md`.

### `apps/api/src/lib/password.ts`

- `hashPassword(plaintext)` → argon2id.
- `verifyPassword(plaintext, hash)`.
- Never log plaintext or hash.

### `apps/api/src/lib/tokens.ts`

- `signAccessToken(kind, payload)` → JWT.
- `verifyAccessToken(kind, token)` → typed token or throws.
- `createRefreshToken(subjectType, subjectId, bakeryId?)` → `{ raw, row }` where raw is the cookie value and row is what to insert.
- `rotateRefreshToken(raw)` — validate, revoke, issue new.
- Three secrets consumed via env.

### `apps/api/src/lib/cookies.ts`

- `setAuthCookies(res, { accessToken, refreshToken, csrfToken, namespace })`.
- `clearAuthCookies(res, namespace)`.
- Handles `SameSite`, `Secure` (production), `HttpOnly`, `Path`.

### `apps/api/src/middleware/authenticateToken.ts`

- Reads access token cookie by namespace (`eg_customer_at`, `eg_bakery_at`, `eg_admin_at`).
- Verifies with the corresponding secret.
- Populates `req.auth` with a discriminated union.
- On failure, does not throw — sets `req.auth = null`. Let the requireXContext middleware produce 401.

### `apps/api/src/middleware/requireCustomerContext.ts` / `requireBakeryContext.ts` / `requireSuperAdminContext.ts`

- Each asserts `req.auth.kind` matches.
- `requireBakeryContext` populates `req.bakeryId` from the token.
- `requireBakeryRole('owner' | 'manager' | 'staff')` factory for role-gated endpoints.

### `apps/api/src/middleware/csrf.ts`

- Double-submit cookie verifier for state-changing methods.
- Exempts `/v1/webhooks/*` and `/v1/internal/*`.

### `apps/api/src/middleware/setDbTenantContext.ts`

Per `docs/03-MULTI_TENANCY.md`: wraps every authenticated request in a transaction-scoped session that runs `SELECT set_config('app.bakery_id', ..., true), set_config('app.role', ..., true)`.

Implementation detail: this middleware attaches a `req.dbClient` that subsequent handlers use. Or use AsyncLocalStorage. Pick one pattern and apply consistently.

### `apps/api/src/middleware/rateLimit.ts`

- `authRateLimit` — strict limits for `/auth/*`.
- `generalRateLimit` — defaults.
- `webhookRateLimit`.
- In-process LRU backend.

### Routes

- `apps/api/src/routes/customer/auth.ts`:
  - `POST /v1/customer/auth/signup`
  - `POST /v1/customer/auth/login`
  - `POST /v1/customer/auth/logout`
  - `POST /v1/customer/auth/refresh`
  - `POST /v1/customer/auth/forgot-password`
  - `POST /v1/customer/auth/reset-password`
  - `POST /v1/customer/auth/verify-email`
  - `GET  /v1/customer/me`

- `apps/api/src/routes/bakery/auth.ts`:
  - `POST /v1/bakery/auth/signup` — creates a bakery in `status='pending_approval'` + an owner user. Does NOT issue a session.
  - `POST /v1/bakery/auth/login` — honours `pending_approval` with limited-access session.
  - `POST /v1/bakery/auth/logout`
  - `POST /v1/bakery/auth/refresh`
  - `POST /v1/bakery/auth/forgot-password`
  - `POST /v1/bakery/auth/reset-password`
  - `POST /v1/bakery/auth/verify-email`
  - `GET  /v1/bakery/me`

- `apps/api/src/routes/admin/auth.ts`:
  - `POST /v1/admin/auth/login` — password + TOTP required.
  - `POST /v1/admin/auth/logout`
  - `POST /v1/admin/auth/refresh`
  - `GET  /v1/admin/me`

### Services

- `services/auth/customer.ts` — signup, login, verify, reset.
- `services/auth/bakery.ts` — same.
- `services/auth/admin.ts` — login with TOTP verification (`speakeasy` or `otplib`).
- `services/email/verification.ts` — sends verification email. Uses a stubbed email service for now (prompt 16 wires Resend).

### Tests

For each namespace:
- Happy path signup → verify → login → me.
- Login with wrong password → 401.
- Signup with existing email → 409.
- Login with unverified email → 403 `email_not_verified`.
- Cross-namespace token rejection: a customer token does not authenticate a bakery endpoint.
- Rate limit exceeded → 429.
- CSRF missing on POST → 403.

Cross-tenant test for bakery-only routes: a bakery_user A token cannot hit `/v1/bakery/me` and see bakery B's data (verified by mock vs seeded fixtures).

## Constraints

- No plaintext password logged or stored anywhere.
- No token (access or refresh) logged.
- Refresh token rotation: each refresh revokes the previous token.
- TOTP secrets for super-admins stored only after verification; never returned to the frontend.
- Signup responses never include a session for bakery users (they must verify email AND be approved).

## Acceptance checklist

- [ ] All routes above implemented.
- [ ] All tests green.
- [ ] `pnpm -w typecheck` passes.
- [ ] Rate limits enforced.
- [ ] CSRF enforced on all state-changing endpoints.
- [ ] `setDbTenantContext` sets `app.bakery_id` correctly for bakery sessions.
- [ ] Email verification tokens single-use, 24h TTL.
- [ ] Password reset tokens single-use, 30min TTL.
