-- 0004_bakery_users
-- Purpose: create bakery staff accounts
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE bakery_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  email citext NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('owner','manager','staff')),
  is_active boolean NOT NULL DEFAULT true,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (bakery_id, email)
);
CREATE INDEX idx_bakery_users_bakery ON bakery_users(bakery_id) WHERE deleted_at IS NULL;

-- migrate:down
DROP TABLE IF EXISTS bakery_users;
