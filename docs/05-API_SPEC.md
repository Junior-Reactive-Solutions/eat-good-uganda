# 05 — API Specification

## Versioning

All routes are prefixed with `/v1/`. A breaking change to a response shape, parameter name, status semantics, or authentication requirement is a new version. Non-breaking additions (new optional fields, new endpoints) do not bump the version.

When v2 exists, v1 continues to serve for at least 90 days with a `Deprecation:` header and a `Sunset:` date.

## Route namespaces

```
/v1/public/*       — anonymous, no session required
/v1/customer/*     — requires customer session
/v1/bakery/*       — requires bakery_user session (tenant comes from token)
/v1/admin/*        — requires super_admin session
/v1/webhooks/*     — external callers (telcos), HMAC-verified
/v1/internal/*     — internal use (keep-alive, migrations), guarded by shared secret
```

## Response conventions

### Success

```http
200 OK
Content-Type: application/json

{ "data": { ... } }
```

For collections:

```http
200 OK
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 143,
    "total_pages": 8
  }
}
```

Never return a bare array. Always wrap in an object so we can add fields without breaking clients.

### Errors

```http
4xx | 5xx
{
  "error": "short_snake_case_code",
  "message": "Human-readable message, safe to display to user.",
  "details": { ... }        // optional, for validation errors
}
```

Error codes are stable. New codes can be added; existing codes cannot change meaning.

Common codes:

- `unauthenticated` — 401, no/invalid session
- `forbidden` — 403, session valid but not permitted (rare — most of these are 404 under our policy)
- `not_found` — 404
- `validation_failed` — 422 with details array: `[{ field, code, message }]`
- `conflict` — 409 (e.g. duplicate slug, re-registering an email)
- `rate_limited` — 429, with `Retry-After`
- `internal_error` — 500 (never includes stack or DB details in the response)
- `payment_provider_error` — 502, for upstream MoMo/Airtel failures

### Pagination

- Query params: `?page=1&page_size=20`
- Default `page_size=20`, max `100`.
- Cursor pagination is used for audit log and order streams where offset pagination becomes expensive at scale: `?cursor=<opaque>&limit=50`.

## Swagger / OpenAPI

The API exposes an OpenAPI 3.1 spec built at runtime from:

- **Zod schemas** in `packages/shared` for request/response bodies
- **Route registration** metadata (method, path, auth requirement, tags)

We use `@asteasolutions/zod-to-openapi` to generate the spec. Swagger UI is served at `/api-docs` in all environments. In production, Swagger UI is behind HTTP Basic Auth (credentials in env) to discourage casual scraping — the spec itself is authoritative, not secret, but we do not hand it to scrapers.

```
Swagger UI:     GET /api-docs
Raw spec:       GET /api-docs/openapi.json
```

Routes are tagged by namespace for easy navigation:

- `Public`, `Customer`, `Bakery`, `Admin`, `Webhooks`

Every route has:

- Summary (one line)
- Description (paragraph)
- Parameter descriptions with examples
- Request body schema linked to a `packages/shared` Zod type
- All possible response codes with their body schemas
- Security requirements (which session kind, which CSRF policy)

## Authentication on the spec

OpenAPI security schemes:

- `customerSession` — cookie-based, references the customer access token cookie
- `bakerySession` — cookie-based, references the bakery access token cookie
- `superAdminSession` — cookie-based, references the super-admin access token cookie
- `webhookHmac` — header-based, references `X-Signature` for inbound webhooks

## Public routes (selected)

```
GET    /v1/public/bakeries
       Query: ?lat&lng&category&page&page_size
       Returns: list of active bakeries, sorted by distance if lat/lng supplied,
                otherwise by display_name.

GET    /v1/public/bakeries/:slug
       Returns: single bakery profile including theme tokens.

GET    /v1/public/bakeries/:slug/products
       Query: ?category&page
       Returns: published available products for this bakery.

GET    /v1/public/bakeries/:slug/products/:productSlug
       Returns: full product detail including variants.

GET    /v1/public/bakeries/:slug/categories
       Returns: category list for menu navigation.

POST   /v1/public/contact
       Platform contact form (landing page).
```

## Customer routes (selected)

```
POST   /v1/customer/auth/signup
POST   /v1/customer/auth/login
POST   /v1/customer/auth/logout
POST   /v1/customer/auth/refresh
POST   /v1/customer/auth/forgot-password
POST   /v1/customer/auth/reset-password
POST   /v1/customer/auth/verify-email

GET    /v1/customer/me
PATCH  /v1/customer/me
DELETE /v1/customer/me                          (soft delete)

POST   /v1/customer/favourite-bakery            { bakery_id }
DELETE /v1/customer/favourite-bakery

POST   /v1/customer/orders                      Create an order (no payment yet)
GET    /v1/customer/orders                      List own orders across bakeries
GET    /v1/customer/orders/:id
POST   /v1/customer/orders/:id/cancel

POST   /v1/customer/orders/:id/pay              Initiate payment
GET    /v1/customer/orders/:id/payment-status   Poll for payment completion

GET    /v1/customer/orders/:id/messages
POST   /v1/customer/orders/:id/messages         Customer writes to bakery
```

Guest checkout: `POST /v1/public/orders` with email+phone+name inline, followed by a claim token emailed to the customer for viewing the order.

## Bakery routes (selected)

```
POST   /v1/bakery/auth/signup                   (platform approval required before login works)
POST   /v1/bakery/auth/login
POST   /v1/bakery/auth/logout
POST   /v1/bakery/auth/refresh

GET    /v1/bakery/me                            Current user + bakery summary
PATCH  /v1/bakery/me/password

GET    /v1/bakery/profile                       Bakery profile (the bakery itself)
PATCH  /v1/bakery/profile                       Update name, logo, colours, hours, etc.

GET    /v1/bakery/staff                         List bakery users
POST   /v1/bakery/staff                         Invite a new staff member (owner/manager)
PATCH  /v1/bakery/staff/:id
DELETE /v1/bakery/staff/:id

GET    /v1/bakery/categories
POST   /v1/bakery/categories
PATCH  /v1/bakery/categories/:id
DELETE /v1/bakery/categories/:id

GET    /v1/bakery/products
POST   /v1/bakery/products
GET    /v1/bakery/products/:id
PATCH  /v1/bakery/products/:id
DELETE /v1/bakery/products/:id                  (soft delete, only if no active orders reference it)

POST   /v1/bakery/products/:id/variants
PATCH  /v1/bakery/products/:id/variants/:variantId
DELETE /v1/bakery/products/:id/variants/:variantId

POST   /v1/bakery/products/:id/images           Cloudinary upload signed URL
DELETE /v1/bakery/products/:id/images/:idx

GET    /v1/bakery/orders                        Query: ?status&from&to&page
GET    /v1/bakery/orders/:id
PATCH  /v1/bakery/orders/:id                    Update status, add internal notes
POST   /v1/bakery/orders/:id/messages           Staff replies to customer

GET    /v1/bakery/metrics/today
GET    /v1/bakery/metrics/range                 Query: ?from&to
GET    /v1/bakery/metrics/top-products          Query: ?from&to&limit

GET    /v1/bakery/customers                     Customers who have ordered FROM this bakery
GET    /v1/bakery/customers/:id                 Their orders + spend with THIS bakery

GET    /v1/bakery/payment-methods
PUT    /v1/bakery/payment-methods/mtn-momo
PUT    /v1/bakery/payment-methods/airtel-money
PUT    /v1/bakery/payment-methods/bank-transfer
PUT    /v1/bakery/payment-methods/cash-on-delivery
```

## Super-admin routes (selected)

```
POST   /v1/admin/auth/login                     (2FA required)
POST   /v1/admin/auth/logout

GET    /v1/admin/bakeries                       All, any status
GET    /v1/admin/bakeries/:id
POST   /v1/admin/bakeries/:id/approve
POST   /v1/admin/bakeries/:id/suspend           Reason required
POST   /v1/admin/bakeries/:id/unsuspend
POST   /v1/admin/bakeries/:id/archive

GET    /v1/admin/customers
GET    /v1/admin/customers/:id
POST   /v1/admin/customers/:id/disable

GET    /v1/admin/orders                         Cross-bakery
GET    /v1/admin/orders/:id

GET    /v1/admin/metrics/platform               Platform-wide stats
GET    /v1/admin/metrics/by-bakery              Per-bakery breakdown

GET    /v1/admin/audit-log                      Searchable, filterable

POST   /v1/admin/superadmins                    Invite another super-admin
GET    /v1/admin/superadmins
```

## Webhooks

Inbound webhooks are idempotent and HMAC-verified. Each telco has its own verification scheme.

```
POST /v1/webhooks/mtn-momo
POST /v1/webhooks/airtel-money

Headers:
  X-Reference-Id              (MoMo)
  X-Signature                 (our HMAC over the body for internal webhooks, if any)

Response: always 200 within 3 seconds, even on failure.
          Failures are queued for manual reconciliation, not surfaced to the caller.
```

## Internal routes

```
GET /v1/internal/health
    Public. Returns { status: 'ok', uptime, version }. Used by Render's health check
    and by the GitHub Actions keepalive.

GET /v1/internal/ready
    Checks DB connectivity. Returns 200 if DB responds within 500ms, 503 otherwise.

POST /v1/internal/seed
    Guarded by INTERNAL_SHARED_SECRET header. Development/staging only.
    Refuses to run in production.
```

## Rate limits summary

Documented in `docs/04-AUTH_AND_ROLES.md`. Swagger UI renders these as descriptions on the relevant endpoints.

## What we do NOT expose

- Raw database IDs of unrelated tenants (always 404).
- Stack traces, DB error codes, or internal error messages in 500 responses.
- Password hashes, payment credentials, TOTP secrets, audit log entries about other bakeries.
- A debug endpoint of any kind in production.
