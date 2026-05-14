-- 0020_customer_profiles_and_addresses
-- Purpose: create customer profile and address tables
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  date_of_birth date,
  bio text,
  avatar_url text,
  default_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_customer_profiles_user ON customer_profiles(user_id);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street_address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  postal_code text,
  is_default boolean NOT NULL DEFAULT false,
  is_delivery_address boolean NOT NULL DEFAULT false,
  is_billing_address boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(user_id, is_default)
  WHERE is_default = true;

-- migrate:down
DROP TABLE IF EXISTS customer_addresses;
DROP TABLE IF EXISTS customer_profiles;
