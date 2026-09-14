-- 0024_add_website_currency_to_bakeries
-- Purpose: add website URL and currency_code columns to bakeries table
-- Safe to re-run: no (uses ADD COLUMN)
-- migrate:up
ALTER TABLE bakeries
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS currency_code char(3) NOT NULL DEFAULT 'UGX';

-- migrate:down
ALTER TABLE bakeries
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS currency_code;
