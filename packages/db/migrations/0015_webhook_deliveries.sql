-- 0015_webhook_deliveries
-- Purpose: store inbound webhook attempts for replay/forensics
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  bakery_id uuid REFERENCES bakeries(id) ON DELETE RESTRICT,
  external_reference text,
  signature_header text,
  is_signature_valid boolean NOT NULL DEFAULT false,
  raw_body jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);
CREATE INDEX idx_webhook_deliveries_provider ON webhook_deliveries(provider, received_at DESC);

-- migrate:down
DROP TABLE IF EXISTS webhook_deliveries;
