# 03 — Multi-Tenancy

> This is the most important document in the repository. Every query, every endpoint, every test, every line of the frontend that displays bakery data is governed by the rules here. Internalise them before writing code.

## The one-line summary

**A session authenticated for Bakery A must never, under any circumstance, be able to read or write data belonging to Bakery B.** That is it. Everything in this document is machinery for holding that line.

## The threat model

Multi-tenant data leakage is the failure mode that kills the platform. It is usually caused by one of these bugs:

1. A query that omits `WHERE bakery_id = $1` because the developer was thinking in single-tenant terms.
2. A route that accepts a `bakery_id` from the URL or body and trusts it without checking whether the session owns it.
3. An `ORM.findById(id)` call where `id` alone is enough to fetch any row in the table, across tenants.
4. A cache key that does not include the tenant, so responses for Bakery A get served to Bakery B.
5. A background job that processes a queue in bulk without re-checking tenancy on each message.
6. An admin helper query written in a hurry that was meant to be single-use but ended up imported into a controller.

We defend against all six, at multiple layers. Even if one layer fails, the next catches it.

## The layers of defence

### Layer 1: the type system

All JWTs, session objects, and authenticated request contexts carry tenant discriminators in types that cannot be casually conflated.

```ts
// packages/shared/src/auth.ts
export type CustomerToken = {
  kind: 'customer'
  sub: string // customers.id
  iat: number
  exp: number
}

export type BakeryToken = {
  kind: 'bakery_user'
  sub: string // bakery_users.id
  bakery_id: string // authoritative tenant
  role: 'owner' | 'manager' | 'staff'
  iat: number
  exp: number
}

export type SuperAdminToken = {
  kind: 'super_admin'
  sub: string // super_admin_users.id
  iat: number
  exp: number
}

export type AnyToken = CustomerToken | BakeryToken | SuperAdminToken
```

A function that takes a `BakeryToken` cannot be passed a `CustomerToken` without explicit casting. This is deliberate. The TypeScript compiler is our first tripwire.

### Layer 2: middleware

Every `/v1/bakery/*` route goes through `requireBakeryContext`:

```ts
// apps/api/src/middleware/requireBakeryContext.ts
export const requireBakeryContext: RequestHandler = (req, res, next) => {
  const token = req.auth // populated by upstream authentication middleware
  if (!token || token.kind !== 'bakery_user') {
    return res.status(401).json({ error: 'bakery_session_required' })
  }
  req.bakeryId = token.bakery_id
  req.bakeryRole = token.role
  next()
}
```

Every `/v1/customer/*` route goes through `requireCustomerContext`. Every `/v1/admin/*` route goes through `requireSuperAdminContext`. The middleware stacks are wired once in `apps/api/src/app.ts` and cannot be bypassed.

Routes must not do `req.body.bakery_id` or `req.query.bakery_id` for bakery-scoped operations. The tenant comes from the token, full stop.

### Layer 3: the query helper

Every tenant-scoped query goes through a helper that takes `bakery_id` as a required parameter:

```ts
// packages/db/src/queries/products.ts
import { sql, Database } from '../client'

export async function listProductsForBakery(
  db: Database,
  bakeryId: string, // REQUIRED. Not optional. Not string | undefined.
  opts: { publishedOnly?: boolean } = {},
) {
  return db.query(sql`
    SELECT id, slug, name, base_price_minor, image_urls, is_available
    FROM products
    WHERE bakery_id = ${bakeryId}
      AND deleted_at IS NULL
      ${opts.publishedOnly ? sql`AND is_published = true` : sql``}
    ORDER BY sort_order, name
  `)
}
```

The signature forces the caller to supply a tenant. There is no `listAllProducts()` function for bakery-scoped data. Super-admin code that legitimately reads across tenants uses a separately named helper — `listProductsAcrossAllBakeries()` — that lives in `packages/db/src/queries/admin/` and is only importable from super-admin controllers (enforced by ESLint `no-restricted-imports`).

### Layer 4: Postgres Row-Level Security

Every tenant-scoped table has RLS enabled and a policy that checks a per-request session variable:

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  USING (
    bakery_id::text = current_setting('app.bakery_id', true)
    OR current_setting('app.role', true) = 'super_admin'
  );
```

The `app.bakery_id` setting is set at the start of every authenticated request transaction:

```ts
// apps/api/src/middleware/setDbTenantContext.ts
export const setDbTenantContext: RequestHandler = async (req, res, next) => {
  if (req.auth?.kind === 'bakery_user') {
    await pool.query(
      `SELECT set_config('app.bakery_id', $1, true),
              set_config('app.role', $2, true)`,
      [req.auth.bakery_id, 'bakery_user'],
    )
  } else if (req.auth?.kind === 'super_admin') {
    await pool.query(`SELECT set_config('app.role', $1, true)`, ['super_admin'])
  }
  next()
}
```

If a controller then executes a query that happens to miss a `WHERE bakery_id = $1` clause, the database still returns only the tenant's rows. Four layers down, the leak is still contained.

### Layer 5: tests that try to leak

Every data endpoint has a dedicated "cross-tenant isolation" test:

```ts
// apps/api/src/routes/bakery/orders.test.ts
it('rejects a Bakery A session attempting to read a Bakery B order', async () => {
  const bakeryA = await seedBakery({ slug: 'a' })
  const bakeryB = await seedBakery({ slug: 'b' })
  const orderB = await seedOrder({ bakery_id: bakeryB.id })
  const sessionA = await loginAsBakeryOwner(bakeryA)

  const res = await request(app)
    .get(`/v1/bakery/orders/${orderB.id}`)
    .set('Cookie', sessionA.cookie)

  expect(res.status).toBe(404) // 404, not 403 — do not leak existence
})
```

These tests run in CI on every PR. They are the canary.

## Rules — the non-negotiables

**1. Every tenant-scoped table has `bakery_id NOT NULL` with a FK.**

No exceptions. If you are adding a table and unsure whether it is tenant-scoped, assume yes.

**2. Every query against a tenant-scoped table filters on `bakery_id`.**

Written explicitly in SQL. Not relied on from RLS alone. RLS is backup, not primary.

**3. Every API route that reads or writes tenant data takes `bakery_id` from the token, never from the client.**

If the client supplies a `bakery_id` in the body or URL, the route either ignores it or validates that it matches the token. For public endpoints (e.g. `/v1/public/bakeries/:slug/products`) the bakery is resolved server-side from the slug and the response is scoped accordingly.

**4. 404 before 403.**

If a session asks for a resource it is not authorised to see, return `404 Not Found`, not `403 Forbidden`. Returning 403 confirms the resource exists at another tenant — an information leak. `404` is consistent with "the resource does not exist _for you_".

Exception: the `/admin` path on the customer host returns a real 403 by design, because that is a non-resource route and its presence is publicly known. See `docs/11-ADMIN_403.md`.

**5. No tenant-scoped data in shared caches without tenant keys.**

If we cache a bakery's menu in-process, the cache key is `menu:{bakery_id}`. Never `menu:current` or anything that could be reused across requests.

**6. Logs never contain another tenant's data.**

When logging an error in a Bakery A request, do not dump the full query results if those results came back cross-tenant as a result of a bug. Log identifiers and counts; never raw rows.

**7. Background jobs assert tenancy on every message.**

A queue worker processing order-confirmation emails reads the order, verifies `order.bakery_id` matches the email-send payload's `bakery_id`, and only then sends. It does not trust the payload.

**8. Admin actions are always logged.**

Every time super-admin code executes a cross-tenant query, an `audit_log` row is written with the admin's user id, the action, and the reason (passed as a parameter to the admin query helper).

## Patterns we use

### Resolving a tenant from a public URL

Public customer pages have URLs like `/b/sweet-cravings/products/chocolate-cake`. The server resolves the bakery from the slug at the start of the request and passes the `bakery_id` downstream:

```ts
// apps/api/src/routes/public/bakeries.ts
router.get('/:slug/products/:productSlug', async (req, res) => {
  const bakery = await getBakeryBySlug(db, req.params.slug)
  if (!bakery || bakery.status !== 'active') {
    return res.status(404).json({ error: 'not_found' })
  }
  const product = await getPublishedProductBySlug(db, bakery.id, req.params.productSlug)
  if (!product) return res.status(404).json({ error: 'not_found' })
  res.json(product)
})
```

The bakery lookup happens first. If it fails, nothing else executes. Product lookup takes the `bakery.id`, not `req.params.slug`.

### Customer orders across bakeries

A customer belongs to the platform, not to a bakery. Their orders list is queried by `customer_id`, and every returned order carries a `bakery_id`:

```ts
export async function listOrdersForCustomer(db: Database, customerId: string) {
  return db.query(sql`
    SELECT o.*, b.slug AS bakery_slug, b.display_name AS bakery_name, b.logo_url AS bakery_logo
    FROM orders o
    JOIN bakeries b ON b.id = o.bakery_id
    WHERE o.customer_id = ${customerId}
    ORDER BY o.created_at DESC
    LIMIT 50
  `)
}
```

The customer context provides `customer_id`, not `bakery_id`. This is a read pattern, and it is the _one_ read pattern where a query joins across tenants — because the customer owns the orders across tenants. The policy on the `orders` table permits this when `app.role = 'customer'` and a matching `customer_id` is set.

### Bakery-staff messaging to a customer

When a staff member replies to a customer on an order:

```ts
router.post('/orders/:orderId/messages', requireBakeryContext, async (req, res) => {
  const { orderId } = req.params
  const order = await getOrderById(db, orderId, req.bakeryId!)
  //                                              ^^^^^^^^^^^^^^
  //                              tenant guard PASSED here, not reliance on RLS
  if (!order) return res.status(404).json({ error: 'not_found' })
  // ... insert message with bakery_id = req.bakeryId
})
```

The `getOrderById` helper takes `bakery_id` as a required parameter and filters with it. If omitted, the function signature rejects the call at compile time.

## Patterns we forbid

### Forbidden: findById without tenant

```ts
// ❌ NO
const order = await db.query(sql`SELECT * FROM orders WHERE id = ${id}`)
```

### Forbidden: tenant in body

```ts
// ❌ NO
router.post('/orders', async (req, res) => {
  const { bakery_id, ...rest } = req.body // trusting client tenant
  await insertOrder({ bakery_id, ...rest })
})
```

### Forbidden: boolean flag "is admin"

```ts
// ❌ NO
if (user.isAdmin) {
  return await listAllOrders() // skips tenant filter
}
return await listOrdersForBakery(user.bakery_id)
```

Super-admin access goes through a separate controller tree, separate helpers, separate audit logging. It is not a branch inside a bakery controller.

## Review checklist for any PR touching data

Before merging, answer all of these:

- [ ] Every new table has `bakery_id NOT NULL` (or is deliberately a platform-wide table with justification in the migration comment).
- [ ] Every new query against a tenant-scoped table has `WHERE bakery_id = $1`.
- [ ] Every new endpoint reads `bakery_id` from the authenticated token, not from the request.
- [ ] Cross-tenant isolation test added for every new endpoint.
- [ ] No `findById`/`findOne`/`getById` without a tenant parameter.
- [ ] No tenant id in response URLs, logs, or error messages that might be displayed cross-tenant.

One missed box is one potential incident. Do not hand-wave.
