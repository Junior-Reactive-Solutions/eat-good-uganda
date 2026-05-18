-- 0021_add_customer_ban_and_fraud_columns
-- Purpose: add ban and fraud management columns to customers table
-- Safe to re-run: no (uses ALTER TABLE)
-- migrate:up
ALTER TABLE customers
ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN ban_reason text,
ADD COLUMN banned_at timestamptz,
ADD COLUMN fraud_flag boolean NOT NULL DEFAULT false,
ADD COLUMN fraud_reason text;

CREATE INDEX idx_customers_banned ON customers(is_banned) WHERE is_banned = true;
CREATE INDEX idx_customers_fraud_flag ON customers(fraud_flag) WHERE fraud_flag = true;

-- migrate:down
ALTER TABLE customers
DROP COLUMN IF EXISTS fraud_reason,
DROP COLUMN IF EXISTS fraud_flag,
DROP COLUMN IF EXISTS banned_at,
DROP COLUMN IF EXISTS ban_reason,
DROP COLUMN IF EXISTS is_banned;

DROP INDEX IF EXISTS idx_customers_fraud_flag;
DROP INDEX IF EXISTS idx_customers_banned;
