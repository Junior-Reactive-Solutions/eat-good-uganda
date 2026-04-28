# 02 — Database Schema

## Philosophy

One Postgres database (Neon), one schema (`public`). No per-tenant schemas, no per-tenant databases. Every tenant-scoped table carries a `bakery_id` FK to the `bakeries` table. Isolation is enforced at the application layer (mandatory middleware) and at the database layer (Postgres Row-Level Security policies) as defence in depth.

We use **raw SQL migrations** via `node-pg-migrate`, not Prisma. Reasons:
- Multi-tenant SQL deserves inspection. Prisma obscures the actual queries and makes it hard to reason about index hits.
- We want full control over PL/pgSQL functions, RLS policies, check constraints, and composite indexes.
- Query helpers in `packages/db` give us TypeScript-typed access without the Prisma overhead.

## Conventions

- Table names: **plural, snake_case** (`bakeries`, `order_items`).
- Column names: **snake_case**.
- Primary keys: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`. Never auto-increment integers — they leak tenant ordering across a shared table.
- Timestamps: `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()` with a trigger to bump `updated_at`.
- Soft deletes: `deleted_at timestamptz NULL` (for `bakeries`, `bakery_users`, `customers`, `products`). Hard deletes elsewhere.
- Money: `amount_minor integer NOT NULL` + `currency_code char(3) NOT NULL DEFAULT 'UGX'`. UGX minor unit = UGX (no sub-unit in circulation), so 40000 means UGX 40,000. For currencies with cents, multiply by 100 at write time.
- Enums: use Postgres `CREATE TYPE ... AS ENUM` where the set is small and stable; use `check` constraints with string columns where the set might grow.
- Foreign keys: always `ON DELETE RESTRICT` unless the relationship is genuinely cascade (e.g. `order_items` to `orders`).

## Core tables

### `bakeries`
The tenant table. Everything else hangs off this.

```sql
CREATE TABLE bakeries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            citext UNIQUE NOT NULL,            -- URL segment, e.g. 'sweet-cravings'
  legal_name      text NOT NULL,
  display_name    text NOT NULL,
  tagline         text,
  description     text,
  logo_url        text,                              -- Cloudinary URL
  hero_image_url  text,                              -- Cloudinary URL
  primary_color   text NOT NULL DEFAULT '#8B4513',   -- hex, used for theming
  accent_color    text,                              -- hex, optional
  phone           text NOT NULL,
  whatsapp        text,
  email           citext NOT NULL,
  address_line1   text NOT NULL,
  address_line2   text,
  city            text NOT NULL DEFAULT 'Kampala',
  country_code    char(2) NOT NULL DEFAULT 'UG',
  latitude        numeric(9,6) NOT NULL,             -- for distance sorting
  longitude       numeric(9,6) NOT NULL,
  timezone        text NOT NULL DEFAULT 'Africa/Kampala',
  status          text NOT NULL DEFAULT 'pending_approval'
                  CHECK (status IN ('pending_approval','active','suspended','archived')),
  accepts_pickup       boolean NOT NULL DEFAULT true,
  accepts_delivery     boolean NOT NULL DEFAULT false,
  delivery_fee_minor   integer,                      -- flat fee if configured
  delivery_radius_km   numeric(5,2),
  min_order_minor      integer,
  custom_domain        text UNIQUE,                  -- reserved for future
  subdomain            text UNIQUE,                  -- reserved for future
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES super_admin_users(id)
);

CREATE INDEX idx_bakeries_status ON bakeries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bakeries_geo ON bakeries USING gist (
  ll_to_earth(latitude::float8, longitude::float8)
) WHERE status = 'active' AND deleted_at IS NULL;
```

Notes:
- `slug` is `citext` so `/b/Sweet-Cravings` and `/b/sweet-cravings` resolve to the same bakery.
- `primary_color` is required; theming cannot work without it.
- `ll_to_earth` gist index supports fast radius/nearest queries (requires `CREATE EXTENSION earthdistance; CREATE EXTENSION cube;`).

### `bakery_users`
Staff accounts. A user belongs to exactly one bakery. Role governs what they can do inside it.

```sql
CREATE TABLE bakery_users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id         uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  email             citext NOT NULL,
  password_hash     text NOT NULL,                     -- argon2id
  full_name         text NOT NULL,
  phone             text,
  role              text NOT NULL
                    CHECK (role IN ('owner','manager','staff')),
  is_active         boolean NOT NULL DEFAULT true,
  email_verified_at timestamptz,
  last_login_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (bakery_id, email)
);

CREATE INDEX idx_bakery_users_bakery ON bakery_users(bakery_id) WHERE deleted_at IS NULL;
```

The same email address can exist at multiple bakeries (a baker who contracts with two). We do not collapse them.

### `customers`
Platform-wide customer accounts. One customer, many orders across many bakeries.

```sql
CREATE TABLE customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext UNIQUE NOT NULL,
  password_hash      text,                             -- nullable: guest checkout allowed
  full_name          text,
  phone              text,
  email_verified_at  timestamptz,
  marketing_opt_in   boolean NOT NULL DEFAULT false,
  last_known_lat     numeric(9,6),                     -- for nearest-bakery sort
  last_known_lng     numeric(9,6),
  favourite_bakery_id uuid REFERENCES bakeries(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  last_login_at      timestamptz
);

CREATE INDEX idx_customers_favourite ON customers(favourite_bakery_id)
  WHERE favourite_bakery_id IS NOT NULL;
```

### `super_admin_users`
Platform operators. Small table, rarely written.

```sql
CREATE TABLE super_admin_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext UNIQUE NOT NULL,
  password_hash  text NOT NULL,
  full_name      text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  totp_secret    text,                                 -- 2FA mandatory for admins
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

### `product_categories`
Per-bakery category list (not platform-wide — each bakery organises differently).

```sql
CREATE TABLE product_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id   uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  name        text NOT NULL,
  slug        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bakery_id, slug)
);

CREATE INDEX idx_product_categories_bakery ON product_categories(bakery_id);
```

### `products`
Menu items.

```sql
CREATE TABLE products (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id          uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  category_id        uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  slug               text NOT NULL,
  name               text NOT NULL,
  description        text,
  base_price_minor   integer NOT NULL,                    -- starting price; variants override
  currency_code      char(3) NOT NULL DEFAULT 'UGX',
  image_urls         text[] NOT NULL DEFAULT '{}',        -- Cloudinary URLs
  is_published       boolean NOT NULL DEFAULT false,
  is_available       boolean NOT NULL DEFAULT true,       -- bakery can toggle out-of-stock
  requires_advance_notice_hours integer,                  -- e.g. 24 for custom cakes
  sort_order         integer NOT NULL DEFAULT 0,
  tags               text[] NOT NULL DEFAULT '{}',        -- 'gluten-free','vegan', etc.
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  UNIQUE (bakery_id, slug)
);

CREATE INDEX idx_products_bakery_published ON products(bakery_id, is_published, sort_order)
  WHERE deleted_at IS NULL;
```

### `product_variants`
Size/flavour variants. A product with no variants is a single SKU — the base price applies directly.

```sql
CREATE TABLE product_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bakery_id     uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,  -- denormalised for safety
  name          text NOT NULL,                     -- e.g. "500g", "Vanilla"
  price_minor   integer NOT NULL,
  sku           text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_available  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_bakery ON product_variants(bakery_id);
```

**Why `bakery_id` is duplicated on `product_variants`:** defence in depth. If a future query joins variants without going through products, the bakery guard still applies. A trigger ensures it stays consistent with `products.bakery_id`.

### `orders`

```sql
CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id             uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  customer_id           uuid REFERENCES customers(id) ON DELETE SET NULL,  -- nullable for guest
  guest_email           citext,                    -- used if customer_id NULL
  guest_phone           text,
  guest_name            text,
  order_number          text NOT NULL UNIQUE,      -- e.g. EGU-20260420-A7X3
  status                text NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN (
                          'pending_payment',
                          'confirmed',
                          'preparing',
                          'ready',
                          'out_for_delivery',
                          'delivered',
                          'cancelled',
                          'refunded'
                        )),
  fulfilment_mode       text NOT NULL
                        CHECK (fulfilment_mode IN ('pickup','delivery')),
  scheduled_for         timestamptz,               -- NULL means ASAP
  delivery_address      jsonb,                     -- { line1, line2?, city, lat, lng, notes? }
  subtotal_minor        integer NOT NULL,
  delivery_fee_minor    integer NOT NULL DEFAULT 0,
  total_minor           integer NOT NULL,
  currency_code         char(3) NOT NULL DEFAULT 'UGX',
  customer_notes        text,
  internal_notes        text,                      -- visible to bakery only
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  delivered_at          timestamptz,
  cancelled_at          timestamptz,
  cancelled_reason      text,
  CHECK (customer_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE INDEX idx_orders_bakery_status ON orders(bakery_id, status, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_scheduled ON orders(bakery_id, scheduled_for) WHERE scheduled_for IS NOT NULL;
```

Status machine:
```
pending_payment → confirmed → preparing → ready → [out_for_delivery →] delivered
pending_payment → cancelled
confirmed → cancelled (triggers refund flow if paid)
delivered → refunded (manual, admin-initiated)
```

### `order_items`

```sql
CREATE TABLE order_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bakery_id          uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  product_id         uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id         uuid REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name       text NOT NULL,            -- snapshot at order time
  variant_name       text,
  unit_price_minor   integer NOT NULL,         -- snapshot
  quantity           integer NOT NULL CHECK (quantity > 0),
  line_total_minor   integer NOT NULL,
  item_notes         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_bakery ON order_items(bakery_id);
```

Prices are snapshotted onto the order item at order creation. A bakery changing a menu price two days later must not retroactively alter a past order's total.

### `payments`

```sql
CREATE TABLE payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  bakery_id            uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  method               text NOT NULL
                       CHECK (method IN ('mtn_momo','airtel_money','bank_transfer','cash_on_delivery')),
  amount_minor         integer NOT NULL,
  currency_code        char(3) NOT NULL DEFAULT 'UGX',
  status               text NOT NULL DEFAULT 'initiated'
                       CHECK (status IN ('initiated','pending','paid','failed','cancelled','refunded','awaiting_proof','awaiting_confirmation')),
  provider_reference   text,                   -- MoMo X-Reference-Id / Airtel transaction_id
  external_reference   text,                   -- our order_number passed as externalId
  payer_phone          text,
  bank_proof_url       text,                   -- Cloudinary, uploaded by customer
  failure_reason       text,
  webhook_payload      jsonb,                  -- raw last webhook for forensics
  initiated_at         timestamptz NOT NULL DEFAULT now(),
  paid_at              timestamptz,
  failed_at            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_bakery_status ON payments(bakery_id, status);
CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(method, provider_reference)
  WHERE provider_reference IS NOT NULL;
```

### `bakery_payment_credentials`
Per-bakery, encrypted credentials for their own MoMo/Airtel merchant accounts.

```sql
CREATE TABLE bakery_payment_credentials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id         uuid NOT NULL REFERENCES bakeries(id) ON DELETE CASCADE,
  provider          text NOT NULL
                    CHECK (provider IN ('mtn_momo','airtel_money','bank_transfer')),
  is_enabled        boolean NOT NULL DEFAULT false,
  encrypted_config  bytea NOT NULL,                   -- AES-256-GCM, see docs/07-PAYMENTS.md
  config_nonce      bytea NOT NULL,
  target_environment text NOT NULL
                    CHECK (target_environment IN ('sandbox','production')),
  last_verified_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bakery_id, provider)
);

CREATE INDEX idx_bakery_payment_credentials_bakery ON bakery_payment_credentials(bakery_id);
```

The `encrypted_config` payload contains a JSON blob with provider-specific fields (subscription key, user id, API key for MoMo; client id, client secret for Airtel; account number, bank name for bank transfer). Decrypted only in-memory when calling the provider.

### `order_messages`
Thread between customer and bakery for a specific order.

```sql
CREATE TABLE order_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bakery_id      uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  sender_type    text NOT NULL CHECK (sender_type IN ('customer','bakery')),
  sender_user_id uuid,                      -- either customers.id or bakery_users.id
  body           text NOT NULL,
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_messages_order ON order_messages(order_id, created_at);
```

### `audit_log`
Every sensitive action lands here. Used for forensics and compliance.

```sql
CREATE TABLE audit_log (
  id              bigserial PRIMARY KEY,
  actor_type      text NOT NULL CHECK (actor_type IN ('customer','bakery_user','super_admin','system','webhook')),
  actor_id        uuid,
  bakery_id       uuid,
  action          text NOT NULL,                 -- 'order.created', 'payment.paid', 'bakery.approved'
  target_type     text,
  target_id       uuid,
  payload         jsonb,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_bakery_time ON audit_log(bakery_id, created_at DESC);
CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_type, actor_id, created_at DESC);
```

### `sessions` / `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash      text NOT NULL UNIQUE,           -- sha256 of the raw token
  subject_type    text NOT NULL CHECK (subject_type IN ('customer','bakery_user','super_admin')),
  subject_id      uuid NOT NULL,
  bakery_id       uuid,                           -- present for bakery_user subjects
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz,
  ip_address      inet,
  user_agent      text
);

CREATE INDEX idx_refresh_tokens_subject ON refresh_tokens(subject_type, subject_id) WHERE revoked_at IS NULL;
```

## Supporting tables

- `password_reset_tokens` — single-use tokens, 30-min TTL
- `email_verification_tokens` — same
- `email_log` — every Resend send, delivery status, for debugging
- `webhook_deliveries` — inbound webhook log (what arrived, when, HMAC verified y/n)
- `platform_settings` — key/value for feature flags (super-admin-only)

## Row-Level Security

RLS is enabled on every tenant-scoped table as a second line of defence. The application always passes `SET LOCAL app.bakery_id = '<uuid>'` inside the per-request transaction, and RLS policies enforce:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (
    bakery_id::text = current_setting('app.bakery_id', true)
    OR current_setting('app.role', true) = 'super_admin'
  );
```

The `public` policy for published products (used by anonymous visitors) is a separate permissive policy with a narrower predicate:

```sql
CREATE POLICY public_read_published ON products
  FOR SELECT
  USING (
    is_published = true
    AND deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM bakeries b
                WHERE b.id = products.bakery_id
                  AND b.status = 'active'
                  AND b.deleted_at IS NULL)
  );
```

RLS does **not** replace application-layer checks. It catches bugs when application-layer checks fail.

## Migrations

Migrations live in `packages/db/migrations/` numbered `0001_*.sql` onwards.

```
0001_init_extensions.sql           -- pgcrypto, citext, earthdistance, cube
0002_tenants_and_users.sql         -- bakeries, bakery_users, customers, super_admin_users
0003_products_and_categories.sql
0004_orders_and_items.sql
0005_payments.sql
0006_payment_credentials.sql
0007_messages_and_audit.sql
0008_tokens.sql
0009_rls_policies.sql
0010_triggers_updated_at.sql
0011_seed_development.sql           -- development only, skipped in prod
```

Each migration is reviewed for:
1. Does every new tenant-scoped table have `bakery_id NOT NULL` with a FK?
2. Is there an index on `bakery_id` (often composite with status or created_at)?
3. Is RLS enabled and a tenant-isolation policy created?
4. Are money columns `*_minor integer` with a `currency_code`?
5. Are timestamps `timestamptz`, not `timestamp`?

## What we explicitly do NOT do

- **No nullable `bakery_id` on tenant-scoped tables.** If a row does not belong to a bakery, it is in a different table.
- **No schema-per-tenant.** Neon free tier has connection limits; schema-per-tenant multiplies them.
- **No denormalised `bakery_slug` on child tables.** Slug can change. Always join or resolve at read time.
- **No storing raw payment credentials.** Always encrypted. Decrypted transiently.

Next: `docs/03-MULTI_TENANCY.md`.
