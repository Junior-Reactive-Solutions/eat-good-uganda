-- 0008_orders_and_items
-- Purpose: create orders and order line items
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  guest_email citext,
  guest_phone text,
  guest_name text,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','refunded')),
  fulfilment_mode text NOT NULL CHECK (fulfilment_mode IN ('pickup','delivery')),
  scheduled_for timestamptz,
  delivery_address jsonb,
  subtotal_minor integer NOT NULL,
  delivery_fee_minor integer NOT NULL DEFAULT 0,
  total_minor integer NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'UGX',
  customer_notes text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  CHECK (customer_id IS NOT NULL OR guest_email IS NOT NULL)
);
CREATE INDEX idx_orders_bakery_status ON orders(bakery_id, status, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_scheduled ON orders(bakery_id, scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  variant_name text,
  unit_price_minor integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_minor integer NOT NULL,
  item_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_bakery ON order_items(bakery_id);

-- migrate:down
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
