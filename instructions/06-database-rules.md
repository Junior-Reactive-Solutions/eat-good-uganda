# 06 — Database Rules

See `docs/02-DATABASE_SCHEMA.md` for the schema itself. This file is the checklist for any DB change.

## Migrations

- **Tool:** `node-pg-migrate`. Located in `packages/db/migrations/`.
- **Filename format:** `0001_snake_case_description.sql`. Always four digits. Always forward-only.
- **Never edit a committed migration.** If you need to fix a mistake, write a new migration.
- **Always include a down migration** for development convenience. Production rollbacks go through PITR.
- **Migrations run in a transaction** where possible. If you need concurrent operations (e.g. `CREATE INDEX CONCURRENTLY`), commit before and split into a separate migration.
- **Run locally against a disposable Neon branch** before opening the PR.

## New tables

When adding a new table, answer every one:
- [ ] Is it tenant-scoped? If yes, it has `bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT`.
- [ ] Primary key is `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`. Not serial. Not bigserial.
- [ ] `created_at timestamptz NOT NULL DEFAULT now()`.
- [ ] `updated_at timestamptz NOT NULL DEFAULT now()` with the `set_updated_at()` trigger attached.
- [ ] Soft delete applicable? Add `deleted_at timestamptz`. Mention in `docs/02-DATABASE_SCHEMA.md`.
- [ ] Index on `bakery_id` (usually composite with status / created_at as the workload dictates).
- [ ] RLS enabled + tenant-isolation policy + any public-read policy.
- [ ] Documented in `docs/02-DATABASE_SCHEMA.md` with a `CREATE TABLE` block and rationale.

## New columns

- If nullable, justify it. A preferred default value is better than a nullable column in almost all cases.
- If adding a `NOT NULL` to an existing table, provide a default or backfill in the same migration.
- For booleans, default is almost always `false`. Named `is_*`.
- For enums with a small stable set: Postgres `CREATE TYPE ... AS ENUM`. With a small but growing set: `text` with a `CHECK` constraint (easier to extend).

## Indexes

- Every foreign key gets an index (Postgres does not create one automatically).
- Composite indexes: leftmost column is the one queried alone or with the next column. Order matters.
- Partial indexes for filtered queries (`WHERE is_published = true`) when the filter is stable.
- Avoid indexes on nullable boolean `=true` conditions — prefer partial indexes.
- Review `EXPLAIN ANALYZE` on any query expected to hit production-sized data.

## Queries

- Written in `packages/db/src/queries/**/*.ts`.
- Organised by table: `queries/orders.ts`, `queries/products.ts`, etc.
- Admin cross-tenant helpers in `queries/admin/*.ts` (import-restricted to admin code).
- Use the tagged template `sql` from `packages/db/src/sql.ts` for all SQL. It parameterises. Never concatenate.
- Return typed results — helpers have explicit return types, not `any`.
- Helpers accept a `Database` handle so they can be called inside or outside a transaction.

## Transactions

- Use `packages/db/src/tx.ts`:
  ```ts
  await withTransaction(pool, async (tx) => {
    await insertOrder(tx, ...)
    await insertOrderItems(tx, ...)
    await createPayment(tx, ...)
  })
  ```
- Anything that touches > 1 table in a way that must be consistent is a transaction.
- Set serialisation level only when needed (default `READ COMMITTED` is almost always fine).

## RLS

- Enable RLS on every new tenant-scoped table in the same migration that creates the table.
- Default policy: tenant isolation via `current_setting('app.bakery_id', true)`.
- Optional additional policies for public read (narrow predicate) and super-admin override (`current_setting('app.role', true) = 'super_admin'`).
- `BYPASSRLS` is NOT granted to the application DB user. Only to a separate migration user.

## Connection management

- Use the pooled Neon URL for the application.
- Single pool per process, configured in `apps/api/src/db/client.ts`.
- Default pool size: 10. Tuneable via env.
- Migrations use the direct (non-pooled) URL because `node-pg-migrate` needs to issue commands that require session-level connections.

## Denormalisation

- Only when there's a concrete query reason.
- Current deliberate denormalisations:
  - `product_variants.bakery_id` (defence in depth; kept in sync via trigger or application layer)
  - `order_items.product_name`, `order_items.variant_name`, `order_items.unit_price_minor` (snapshotted for order integrity)
- Anything else: justify in the migration comment, record in `docs/17-DECISIONS_LOG.md`.

## JSON / JSONB

- Use `jsonb` (not `json`) for all flexible payloads.
- Used for: `orders.delivery_address`, `audit_log.payload`, `webhook_deliveries.raw_body`, `payments.webhook_payload`.
- Do not reach into JSONB for filtering in hot paths — denormalise or split the column.
- GIN index only when we actively query into the JSONB. Expensive to maintain.

## Audit logging

- `audit_log.record({ actor_type, actor_id, bakery_id, action, target_type, target_id, payload })` for all sensitive actions.
- Don't log full payloads with sensitive fields — strip secrets, passwords, payment credentials.
- Admin actions always audit-logged.

## Data migrations (backfills)

- Write in a separate migration from schema changes where possible.
- Chunk writes (`WHERE ... LIMIT 1000`) on large tables.
- Test locally against a realistic dataset before running in staging.

## Common mistakes to avoid

- **"Quick debug query" that sidesteps the helper.** Write the helper, add it to the queries folder, test it.
- **Using `ORDER BY RANDOM()`.** Fine for dev data, terrible for production. Use deterministic sorting.
- **`SELECT *` in production code.** Name the columns.
- **`LIMIT` without `ORDER BY`.** Results are nondeterministic; will cause flaky tests and bugs.
- **`DROP COLUMN` in a migration with no backfill consideration.** If anything is still reading that column, it breaks.

## Changing a column type

Rarely safe. The recipe:
1. Add a new column with the desired type.
2. Backfill from the old column.
3. Update application code to write to both.
4. Update reads to use the new column.
5. Stop writing to the old column.
6. Drop the old column.

Each step is its own migration. Don't try to do all five in one PR.

## Extensions we rely on

- `pgcrypto` — `gen_random_uuid()`
- `citext` — case-insensitive text (emails, slugs)
- `cube` + `earthdistance` — geo distance
- Enabled in migration `0001_init_extensions.sql`.
