-- 0013_tokens
-- Purpose: create refresh and one-time auth token tables
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  subject_type text NOT NULL CHECK (subject_type IN ('customer','bakery_user','super_admin')),
  subject_id uuid NOT NULL,
  bakery_id uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip_address inet,
  user_agent text
);
CREATE INDEX idx_refresh_tokens_subject ON refresh_tokens(subject_type, subject_id) WHERE revoked_at IS NULL;

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  subject_type text NOT NULL CHECK (subject_type IN ('customer','bakery_user','super_admin')),
  subject_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  subject_type text NOT NULL CHECK (subject_type IN ('customer','bakery_user')),
  subject_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS refresh_tokens;
