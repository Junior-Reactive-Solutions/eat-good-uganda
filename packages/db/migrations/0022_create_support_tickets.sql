-- 0022_create_support_tickets
-- Purpose: Create support ticketing system with ticket messages
-- Safe to re-run: no (uses CREATE TABLE)

-- migrate:up

-- support_tickets table: customer service issues managed by super admins
CREATE TABLE support_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id       uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  admin_id        uuid REFERENCES super_admin_users(id) ON DELETE SET NULL,
  subject         text NOT NULL,
  description     text NOT NULL,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority        text NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX idx_support_tickets_bakery ON support_tickets(bakery_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_admin ON support_tickets(admin_id) WHERE admin_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_support_tickets_status ON support_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC) WHERE deleted_at IS NULL;

-- ticket_messages table: conversation history
CREATE TABLE ticket_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL,
  sender_type     text NOT NULL
                  CHECK (sender_type IN ('bakery_user', 'super_admin', 'system')),
  message         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at DESC);

-- migrate:down

DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
