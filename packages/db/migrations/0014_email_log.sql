-- 0014_email_log
-- Purpose: log outbound transactional emails
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid REFERENCES bakeries(id) ON DELETE RESTRICT,
  recipient_email citext NOT NULL,
  subject text NOT NULL,
  template_key text NOT NULL,
  provider_message_id text,
  status text NOT NULL CHECK (status IN ('queued','sent','delivered','bounced','failed')),
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_log_bakery ON email_log(bakery_id, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS email_log;
