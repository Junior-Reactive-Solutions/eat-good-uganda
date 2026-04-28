-- 0016_platform_settings
-- Purpose: create key/value platform settings table
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('seed_environment', '{"allowed":"development"}', 'controls local seed execution')
ON CONFLICT (setting_key) DO NOTHING;

-- migrate:down
DELETE FROM platform_settings WHERE setting_key = 'seed_environment';
DROP TABLE IF EXISTS platform_settings;
