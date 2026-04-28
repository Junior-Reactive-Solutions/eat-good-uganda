-- 0001_init_extensions
-- Purpose: enable required postgres extensions
-- Safe to re-run: yes (uses IF NOT EXISTS)
-- migrate:up
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- migrate:down
DROP EXTENSION IF EXISTS earthdistance;
DROP EXTENSION IF EXISTS cube;
DROP EXTENSION IF EXISTS citext;
DROP EXTENSION IF EXISTS pgcrypto;
