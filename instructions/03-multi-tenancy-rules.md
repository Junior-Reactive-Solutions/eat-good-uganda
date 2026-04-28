# 03 — Multi-Tenancy Rules (Non-Negotiable)

Read `docs/03-MULTI_TENANCY.md` for the architectural explanation. This file is the enforceable checklist.

## Before writing any query against a tenant-scoped table

Tenant-scoped tables (full list kept in `docs/02-DATABASE_SCHEMA.md`):
- `bakeries`
- `bakery_users`
- `product_categories`
- `products`
- `product_variants`
- `orders`
- `order_items`
- `payments`
- `bakery_payment_credentials`
- `order_messages`

**Rule 1.** Every SELECT, UPDATE, DELETE statement against any of the above includes `WHERE bakery_id = $1` (or an equivalent JOIN + filter). Explicitly. Not assumed from RLS.

**Rule 2.** Every INSERT against any of the above sets `bakery_id` to a value derived from the authenticated session's token, not from the request body.

**Rule 3.** The `bakery_id` the query uses comes from:
- `req.auth.bakery_id` on bakery_user-authenticated routes, **OR**
- A server-side lookup from the URL slug on public routes (e.g. `/v1/public/bakeries/:slug/...`), **OR**
- An explicit cross-tenant helper in `packages/db/src/queries/admin/` on super-admin-authenticated routes.

**Never** from `req.body.bakery_id` or `req.query.bakery_id` on bakery or customer routes.

## Endpoint authoring checklist

For every new endpoint touching a tenant-scoped table, you must:

- [ ] Mount it under the correct namespace router (`/v1/bakery/*`, `/v1/admin/*`, etc.).
- [ ] Confirm the middleware chain includes `authenticateToken` + the role-appropriate `requireXContext`.
- [ ] Derive `bakery_id` from the token, not the client input.
- [ ] Use a typed query helper that takes `bakery_id` as a required parameter.
- [ ] Return `404 Not Found` (not `403`) if the resource's `bakery_id` does not match.
- [ ] Write at least one cross-tenant isolation test (see `docs/12-TESTING.md`).
- [ ] Confirm the response does not include any field that belongs to a different tenant (e.g. a JOIN that leaks data).

## Query helper signatures

Every helper in `packages/db/src/queries/` that touches a tenant-scoped table must take `bakery_id` as a **required non-nullable** parameter, early in the argument list:

```ts
// ✅ Correct
export async function listOrdersForBakery(
  db: Database,
  bakeryId: string,
  filters: { status?: OrderStatus; from?: Date; to?: Date } = {}
): Promise<Order[]>

// ❌ Wrong
export async function listOrdersForBakery(
  db: Database,
  filters: { status?: OrderStatus; bakery_id?: string }     // nullable tenant
): Promise<Order[]>

// ❌ Wrong
export async function listOrders(
  db: Database,                                             // no tenant at all
  filters: { status?: OrderStatus }
): Promise<Order[]>
```

## Cross-tenant helpers — rare and explicit

Some super-admin views legitimately need cross-tenant data (e.g. "all pending approvals"). These live in `packages/db/src/queries/admin/` and:
- Are named with the prefix `adminListAll` or `adminGetAny` (e.g. `adminListAllPendingBakeries`)
- Take a `reason: string` parameter that is audit-logged
- Are importable ONLY from files matching `apps/api/src/routes/admin/**` and `apps/super-admin/**` (enforced by `no-restricted-imports`)

If you find yourself wanting to call `adminListAllBakeries` from a customer or bakery controller, you are doing something wrong. Step back and rethink.

## Frontend rules

On the bakery admin frontend:
- Never read `bakery_id` from URL parameters and pass it to the API — it is established by the session on the server side.
- Never display data from more than one bakery on the same screen.
- Route-level error boundaries catch any 404 or 403 and show a generic message — never expose IDs or slugs from other bakeries in error text.

On the customer frontend:
- The bakery context is established by the URL slug.
- Orders list view joins across bakeries but always identifies each order's bakery clearly.
- The cart is scoped to **one bakery at a time**. Switching to a different bakery empties the cart (with confirmation).

## Database constraints as defence in depth

All tenant-scoped tables have:
- `bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT`
- An index on `bakery_id` (usually composite with status/created_at)
- RLS policy enforcing `bakery_id::text = current_setting('app.bakery_id', true)` for `bakery_user` role
- RLS policy permitting public read only when a narrow predicate is met (e.g. `is_published=true AND bakery.status='active'`)

If you propose a schema change that removes any of these, justify it in `docs/17-DECISIONS_LOG.md`.

## Tests that must exist

For every tenant-scoped endpoint:

```ts
describe('<METHOD> <PATH> — tenant isolation', () => {
  it('returns 404 when the resource belongs to another bakery', async () => {
    /* ... */
  })
})
```

These tests are not optional. A PR that adds a tenant-scoped endpoint without one is rejected by review.

## What gets you fired (metaphorically)

- Writing `WHERE id = $1` on a tenant-scoped table in production code.
- Trusting `req.body.bakery_id` to authorise a write.
- Adding `?bakery_id=<uuid>` to a URL parameter and relying on it.
- Disabling RLS on a tenant-scoped table "to debug".
- Importing an `admin*` cross-tenant helper from a non-admin file.
- Shipping a tenant-scoped endpoint without a cross-tenant isolation test.
