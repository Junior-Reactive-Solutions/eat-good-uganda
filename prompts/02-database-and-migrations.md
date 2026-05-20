# Prompt 02 — Database and Migrations

## Context

The monorepo is scaffolded (prompt 01). `packages/db` has `client.ts`, `sql.ts`, `tx.ts` stubs and an empty `migrations/` folder. Now we create the full schema, RLS policies, and the tagged-template query helper.

Read before starting:
- `docs/02-DATABASE_SCHEMA.md` (the authoritative schema)
- `docs/03-MULTI_TENANCY.md`
- `instructions/06-database-rules.md`

## Goal

Write all migrations, the `sql` tagged template, the `pg` pool client, the transaction helper, and query helper stubs organised by table. Seed a development database with 3 bakeries, 20 products, 5 customers, 10 orders for local development.

## Deliverables

### Migrations in `packages/db/migrations/`

Create each of these as a separate SQL file, numbered as shown:

- `0001_init_extensions.sql` — `CREATE EXTENSION IF NOT EXISTS pgcrypto, citext, cube, earthdistance;`
- `0002_super_admins.sql` — `super_admin_users` table
- `0003_bakeries.sql` — `bakeries` table with geo index (this must come before `bakery_users` because of the FK from `bakery_users.bakery_id`)
- `0004_bakery_users.sql`
- `0005_customers.sql`
- `0006_product_categories.sql`
- `0007_products_and_variants.sql`
- `0008_orders_and_items.sql`
- `0009_payments.sql`
- `0010_payment_credentials.sql`
- `0011_messages.sql` — `order_messages`
- `0012_audit_log.sql`
- `0013_tokens.sql` — `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens`
- `0014_email_log.sql`
- `0015_webhook_deliveries.sql`
- `0016_platform_settings.sql`
- `0017_triggers_updated_at.sql` — `set_updated_at()` function + triggers on every `updated_at`-bearing table
- `0018_rls_enable.sql` — enable RLS on every tenant-scoped table, create tenant-isolation + public-read policies
- `0019_seed_development.sql` — dev-only seed (wrap in a `DO` block that no-ops if `NODE_ENV` indicates non-dev via a settings table or a magic placeholder row)

Each migration has an "up" and a "down". Down migrations may be destructive; they are only for dev iteration.

Each migration file starts with a comment block:
```sql
-- 0003_bakeries
-- Purpose: create the core tenant table
-- Safe to re-run: no (uses CREATE TABLE)
```

Every tenant-scoped table includes:
- `bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT`
- Index on `bakery_id`
- RLS enabled + tenant isolation policy

### `packages/db/src/sql.ts`

Tagged template that returns an object `{ text, values }` suitable for `pool.query`. Handles nested `sql\`\`` fragments.

```ts
export type SqlFragment = { text: string; values: unknown[] }
export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlFragment
```

### `packages/db/src/client.ts`

Wraps `pg.Pool`, exports `Database` type that is either the pool or a client (so helpers work inside or outside transactions).

### `packages/db/src/tx.ts`

```ts
export async function withTransaction<T>(
  pool: Pool,
  fn: (tx: PoolClient) => Promise<T>
): Promise<T>
```

### `packages/db/src/queries/`

One file per table, each with stub function signatures using the required tenant-id-first pattern from `instructions/03-multi-tenancy-rules.md`. Even if the function body throws "not implemented", the signatures are correct.

At minimum:
- `bakeries.ts` — `getBakeryBySlug`, `getBakeryById`, `listActiveBakeries`, `createBakery`, `updateBakery`
- `products.ts` — `listProductsForBakery`, `getProductById`, `getPublishedProductBySlug`, `createProduct`, `updateProduct`
- `orders.ts` — `listOrdersForBakery`, `listOrdersForCustomer`, `getOrderById`, `createOrder`, `updateOrderStatus`
- `payments.ts` — `createPayment`, `getPaymentById`, `updatePaymentStatus`
- `admin/bakeries.ts` — `adminListAllBakeries`, `adminListPendingBakeries`, `adminApproveBakery` (restricted import per ESLint rule set up below)

### `packages/db/src/fixtures.ts`

`seedBakery(overrides)`, `seedBakeryUser`, `seedCustomer`, `seedProduct`, `seedOrder`. Returns full typed rows. Used by both migration `0019_seed_development.sql` (via SQL equivalent) and tests.

### ESLint restriction

Add to `eslint.config.js`:

```js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['**/queries/admin/**'],
      message: 'Cross-tenant admin query helpers can only be imported from apps/api/src/routes/admin/** or apps/super-admin/**.'
    }]
  }]
}
```

With per-file overrides that allow those paths.

### Scripts

`pnpm --filter @eatgood/db migrate` runs pending migrations against `DATABASE_URL_DIRECT`. `migrate:down` rolls back one. `migrate:create <name>` scaffolds a new migration file with the comment header.

## Constraints

- Every tenant-scoped query helper takes `bakeryId: string` as a required non-nullable parameter.
- Every RLS policy references `current_setting('app.bakery_id', true)` — no hard-coded tenant ids.
- No `SELECT *` in helper implementations.
- Money columns are integers + `currency_code` char(3).
- UUID primary keys throughout.

## Acceptance checklist

- [ ] `pnpm --filter @eatgood/db migrate` runs cleanly against a fresh Neon branch.
- [ ] Every table from `docs/02-DATABASE_SCHEMA.md` exists with the described columns.
- [ ] RLS is enabled on every tenant-scoped table (`SELECT relrowsecurity FROM pg_class WHERE relname = ...`).
- [ ] Seed creates 3 bakeries, 20 products across them, 5 customers, 10 orders — all with correct `bakery_id`s.
- [ ] `pnpm -w typecheck` passes.
- [ ] Query helper signatures reject calls missing `bakeryId` at compile time.
- [ ] A smoke test (`packages/db/src/queries/products.test.ts`) seeds a bakery, inserts a product, retrieves it via the helper, and asserts the row matches.
