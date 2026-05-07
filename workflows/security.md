# Security Workflow

> Security practices, scanning, and incident handling at Eat Good Uganda.

## Security Principles

1. **Multi-tenant data isolation is non-negotiable** — cross-tenant leaks are P0 incidents
2. **Defense in depth** — multiple layers of protection
3. **Least privilege** — minimal permissions at every layer
4. **Fail closed** — deny by default

---

## Multi-Tenant Protection Rules

### The Golden Rule

> Every database query touching a tenant-scoped table MUST filter by `bakery_id`.

```sql
-- ✅ Correct: filter by bakery_id
SELECT * FROM orders WHERE bakery_id = $1 AND id = $2

-- ❌ Wrong: missing bakery_id filter
SELECT * FROM orders WHERE id = $1
```

### Implementation Rules

| Rule              | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| Tenant from token | `bakery_id` comes from the authenticated session, never from request     |
| 404, not 403      | Return `404` when cross-tenant access attempted (doesn't leak existence) |
| RLS enabled       | Row-Level Security policies on all tenant-scoped tables                  |
| Test isolation    | Every tenant-scoped endpoint has a cross-tenant isolation test           |

### Cross-Tenant Prevention Checklist

- [ ] New table has `bakery_id` column (if tenant-scoped)
- [ ] New query includes `bakery_id` filter
- [ ] New endpoint verified via tenant isolation test
- [ ] API returns `404` not `403` on cross-tenant access

---

## JWT Handling Rules

### Token Architecture

| Namespace     | Secret                  | Cookie                    | Purpose                 |
| ------------- | ----------------------- | ------------------------- | ----------------------- |
| `customer`    | `JWT_CUSTOMER_SECRET`   | `customer_access_token`   | Customer authentication |
| `bakery_user` | `JWT_BAKERY_SECRET`     | `bakery_access_token`     | Bakery staff            |
| `super_admin` | `JWT_SUPERADMIN_SECRET` | `superadmin_access_token` | Platform admin          |

### Token Rules

- **Access tokens:** JWT, HMAC-SHA256, 15-minute TTL
- **Refresh tokens:** Opaque 256-bit random, SHA-256 hashed in DB
- **Three separate secrets** — never cross-use

### Cookie Security

```
Set-Cookie: customer_access_token=...;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Path=/
```

| Attribute      | Value           | Why                      |
| -------------- | --------------- | ------------------------ |
| `HttpOnly`     | Required        | Prevents XSS token theft |
| `Secure`       | Production only | HTTPS-only               |
| `SameSite=Lax` | Required        | CSRF protection          |
| `Path`         | Scoped          | Least privilege          |

---

## Admin Route Protection (403)

### The `/admin` Edge Rule

The customer app (`eatgooduganda.com`) must return a **real HTTP 403** for all `/admin` routes — not a React route, not a 200 error page.

```ts
// apps/customer/vercel.json
{
  "rewrites": [
    { "source": "/admin", "destination": "/api/edge-admin-403" },
    { "source": "/admin/(.*)", "destination": "/api/edge-admin-403" }
  ]
}
```

The edge function returns:

```
HTTP/1.1 403 Forbidden
Content-Type: text/plain

Forbidden
```

### Why Real 403 Matters

- Prevents scan-based discovery of admin paths
- Reduces attack surface visibility
- Fast edge response, no React hydration

### Verification

| Check                            | Command                                                |
| -------------------------------- | ------------------------------------------------------ |
| Customer app blocks `/admin`     | `curl -I eatgooduganda.com/admin` returns 403          |
| Customer app blocks `/admin/...` | `curl -I eatgooduganda.com/admin/settings` returns 403 |
| Bakery admin accessible          | `curl -I bakery.eatgooduganda.com` returns 200         |
| Super admin accessible           | `curl -I admin.eatgooduganda.com` returns 200          |

---

## Security Scanning

### Dependency Scanning

```bash
# Run in CI
pnpm audit
```

| Severity | Action                      |
| -------- | --------------------------- |
| Critical | Block merge immediately     |
| High     | Block merge, fix in same PR |
| Medium   | Track in issue              |
| Low      | Accept                      |

### Secret Scanning

- GitHub Advanced Security enabled on repo
- Commits with secrets flagged
- `.git hooks/pre-commit` scans for patterns:
  - `AKIA[0-9A-Z]{16}` (AWS keys)
  - `sk-[0-9a-zA-Z]{48}` (OpenAI keys)
  - `eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*` (JWT)
  - `pgp|apikey|secret|token|password` in file names

---

## Handling Security Findings

### During Development

1. **Do not commit** code with known vulnerabilities
2. **Fix before PR** — update dependency or add exception with justification
3. **Log exceptions** — document why a vulnerability is acceptable

### In Production

1. **Assess severity** — P0/P1/P2/P3 (see `workflows/incident-response.md`)
2. **Contain** — rotate secrets, deploy fix, disable feature
3. **Communicate** — notify affected users per SLA
4. **Post-mortem** — document and prevent recurrence

---

## Security Code Review Checklist

Before every merge, verify:

- [ ] No `WHERE` clause missing `bakery_id`
- [ ] No `dangerouslySetInnerHTML` with user input
- [ ] No string concatenation in SQL
- [ ] Cookies have `HttpOnly`, `Secure`, `SameSite`
- [ ] No secrets in logs
- [ ] Webhooks re-verify with provider API
- [ ] Input validated via Zod schema
- [ ] `/admin` returns 403 on customer host

---

## Reporting Security Issues

| Channel                            | Response Time |
| ---------------------------------- | ------------- |
| GitHub Security Advisory           | 24 hours      |
| Email (security@eatgooduganda.com) | 24 hours      |

**Do not open public issues for security vulnerabilities.**

---

## Related Documents

- `instructions/04-security-rules.md` — Full security rules
- `instructions/03-multi-tenancy-rules.md` — Multi-tenancy specifics
- `docs/14-SECURITY.md` — Threat model and defense layers
- `workflows/incident-response.md` — Incident handling process
