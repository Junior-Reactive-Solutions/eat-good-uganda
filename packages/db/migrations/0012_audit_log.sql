-- 0012_audit_log
-- Purpose: create immutable audit log for sensitive actions
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('customer','bakery_user','super_admin','system','webhook')),
  actor_id uuid,
  bakery_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  payload jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_bakery_time ON audit_log(bakery_id, created_at DESC);
CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_type, actor_id, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS audit_log;
