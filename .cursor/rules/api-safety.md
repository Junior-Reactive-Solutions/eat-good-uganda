# API Safety Rules

> Rules for writing safe, secure API endpoints.

## Input Validation

- **Every request body** validated against Zod schema in `packages/shared`
- **Every URL parameter** validated (UUID format, enum bounds)
- **Never use** `req.body.*` directly in business logic

```ts
// ✅ Correct
const validated = CustomerOrderSchema.parse(req.body)
await createOrder(validated)

// ❌ Wrong - unvalidated input
await createOrder(req.body)
```

## Route Namespaces

| Namespace        | Auth Required       | Purpose               |
| ---------------- | ------------------- | --------------------- |
| `/v1/public/*`   | None                | Public bakery listing |
| `/v1/customer/*` | Customer session    | Customer account      |
| `/v1/bakery/*`   | Bakery session      | Bakery operations     |
| `/v1/admin/*`    | Super-admin session | Platform admin        |
| `/v1/webhooks/*` | HMAC signature      | Payment callbacks     |
| `/v1/internal/*` | Shared secret       | Health, seed          |

## Response Format

```ts
// Success
res.status(200).json({ data: { ... } })

// Collection
res.status(200).json({
  data: [...],
  pagination: { page: 1, page_size: 20, total: 100 }
})

// Error
res.status(400).json({
  error: 'validation_failed',
  message: 'Human readable',
  details: [{ field: 'email', code: 'invalid_format' }]
})
```

## Security Requirements

| Rule          | Implementation                                         |
| ------------- | ------------------------------------------------------ |
| SQL Injection | Parameterized queries only                             |
| XSS           | React escapes by default; no `dangerouslySetInnerHTML` |
| CSRF          | Double-submit cookie on state-changing endpoints       |
| Rate limiting | `express-rate-limit` on `/auth/*`                      |
| CORS          | Exact origin allowlist, no wildcards                   |

## Logging

Never log:

- Passwords, password hashes
- JWT access tokens
- Refresh tokens
- Payment credentials
- Full request bodies on auth endpoints

See: `docs/05-API_SPEC.md`, `instructions/04-security-rules.md`
