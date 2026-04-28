-- 0010_payment_credentials
-- Purpose: store encrypted per-bakery payment credentials
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE bakery_payment_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('mtn_momo','airtel_money','bank_transfer')),
  is_enabled boolean NOT NULL DEFAULT false,
  encrypted_config bytea NOT NULL,
  config_nonce bytea NOT NULL,
  target_environment text NOT NULL CHECK (target_environment IN ('sandbox','production')),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bakery_id, provider)
);
CREATE INDEX idx_bakery_payment_credentials_bakery ON bakery_payment_credentials(bakery_id);

-- migrate:down
DROP TABLE IF EXISTS bakery_payment_credentials;
