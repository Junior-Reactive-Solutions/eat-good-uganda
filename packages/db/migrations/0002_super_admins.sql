-- 0002_super_admins
-- Purpose: create platform operator users
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE super_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  totp_secret text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE IF EXISTS super_admin_users;
