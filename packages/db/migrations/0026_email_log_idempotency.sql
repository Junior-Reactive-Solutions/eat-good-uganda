-- 0026_email_log_idempotency
-- Purpose: add idempotency_key and attempt_count to email_log for dedup + retry
-- Safe to re-run: no

-- migrate:up
ALTER TABLE email_log
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS attempt_count    integer NOT NULL DEFAULT 0;

-- Back-fill existing rows so the UNIQUE constraint can be applied
UPDATE email_log
SET idempotency_key = id::text
WHERE idempotency_key IS NULL;

ALTER TABLE email_log
  ALTER COLUMN idempotency_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_idempotency ON email_log(idempotency_key);

-- migrate:down
DROP INDEX IF EXISTS idx_email_log_idempotency;
ALTER TABLE email_log
  DROP COLUMN IF EXISTS idempotency_key,
  DROP COLUMN IF EXISTS attempt_count;
