-- 0011_messages
-- Purpose: create order-level messaging between customers and bakeries
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  sender_type text NOT NULL CHECK (sender_type IN ('customer','bakery')),
  sender_user_id uuid,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_messages_order ON order_messages(order_id, created_at);

-- migrate:down
DROP TABLE IF EXISTS order_messages;
