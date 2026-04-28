-- 0009_payments
-- Purpose: create payment records
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('mtn_momo','airtel_money','bank_transfer','cash_on_delivery')),
  amount_minor integer NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'UGX',
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','pending','paid','failed','cancelled','refunded','awaiting_proof','awaiting_confirmation')),
  provider_reference text,
  external_reference text,
  payer_phone text,
  bank_proof_url text,
  failure_reason text,
  webhook_payload jsonb,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_bakery_status ON payments(bakery_id, status);
CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(method, provider_reference)
  WHERE provider_reference IS NOT NULL;

-- migrate:down
DROP TABLE IF EXISTS payments;
