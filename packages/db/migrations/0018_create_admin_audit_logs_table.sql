-- 0018_create_admin_audit_logs_table
-- Purpose: create admin-specific audit logs table with specification-compliant schema
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(255) NOT NULL,
  bakery_id UUID REFERENCES bakeries(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_bakery_id ON audit_logs(bakery_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- migrate:down
DROP TABLE IF EXISTS audit_logs;
