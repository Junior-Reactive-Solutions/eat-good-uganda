-- 0001_init_extensions
-- Purpose: enable required postgres extensions
-- Safe to re-run: yes (uses IF NOT EXISTS)
-- migrate:up
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext CASCADE;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- migrate:down
DROP EXTENSION IF EXISTS earthdistance CASCADE;
DROP EXTENSION IF EXISTS cube CASCADE;
DROP EXTENSION IF EXISTS citext CASCADE;
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
