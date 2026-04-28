-- 0005_customers
-- Purpose: create platform-wide customer accounts
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  password_hash text,
  full_name text,
  phone text,
  email_verified_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  last_known_lat numeric(9,6),
  last_known_lng numeric(9,6),
  favourite_bakery_id uuid REFERENCES bakeries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  last_login_at timestamptz
);
CREATE INDEX idx_customers_favourite ON customers(favourite_bakery_id)
  WHERE favourite_bakery_id IS NOT NULL;

-- migrate:down
DROP TABLE IF EXISTS customers;
