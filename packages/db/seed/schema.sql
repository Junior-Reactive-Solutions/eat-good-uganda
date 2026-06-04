-- Eat Good Uganda — Canonical consolidated schema
-- Derived exactly from packages/db/migrations/*.sql
-- Emails use VARCHAR(255) (citext aliasing caused Neon batching issues).
-- Run AFTER: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- Extensions are created separately by db-bootstrap.ts before this file runs.

-- ============================================================
-- Platform operators
-- ============================================================
CREATE TABLE super_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  totp_secret text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Bakeries (core tenant)
-- ============================================================
CREATE TABLE bakeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  legal_name text NOT NULL,
  display_name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  primary_color text NOT NULL DEFAULT '#8B4513',
  accent_color text,
  phone text NOT NULL,
  whatsapp text,
  email VARCHAR(255) NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL DEFAULT 'Kampala',
  country_code char(2) NOT NULL DEFAULT 'UG',
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  timezone text NOT NULL DEFAULT 'Africa/Kampala',
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','active','suspended','archived')),
  accepts_pickup boolean NOT NULL DEFAULT true,
  accepts_delivery boolean NOT NULL DEFAULT false,
  delivery_fee_minor integer,
  delivery_radius_km numeric(5,2),
  min_order_minor integer,
  custom_domain text UNIQUE,
  subdomain text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES super_admin_users(id)
);
CREATE INDEX idx_bakeries_status ON bakeries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bakeries_geo ON bakeries USING gist (ll_to_earth(latitude::float8, longitude::float8))
  WHERE status = 'active' AND deleted_at IS NULL;

-- ============================================================
-- Bakery staff
-- ============================================================
CREATE TABLE bakery_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  email VARCHAR(255) NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('owner','manager','staff')),
  is_active boolean NOT NULL DEFAULT true,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (bakery_id, email)
);
CREATE INDEX idx_bakery_users_bakery ON bakery_users(bakery_id) WHERE deleted_at IS NULL;

-- ============================================================
-- Customers
-- ============================================================
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash text,
  full_name text,
  phone text,
  email_verified_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  last_known_lat numeric(9,6),
  last_known_lng numeric(9,6),
  favourite_bakery_id uuid REFERENCES bakeries(id) ON DELETE SET NULL,
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  banned_at timestamptz,
  fraud_flag boolean NOT NULL DEFAULT false,
  fraud_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  last_login_at timestamptz
);
CREATE INDEX idx_customers_favourite ON customers(favourite_bakery_id) WHERE favourite_bakery_id IS NOT NULL;
CREATE INDEX idx_customers_banned ON customers(is_banned) WHERE is_banned = true;
CREATE INDEX idx_customers_fraud ON customers(fraud_flag) WHERE fraud_flag = true;

-- ============================================================
-- Product catalogue
-- ============================================================
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bakery_id, slug)
);
CREATE INDEX idx_product_categories_bakery ON product_categories(bakery_id);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  base_price_minor integer NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'UGX',
  image_urls text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  requires_advance_notice_hours integer,
  sort_order integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (bakery_id, slug)
);
CREATE INDEX idx_products_bakery_published ON products(bakery_id, is_published, sort_order) WHERE deleted_at IS NULL;

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  name text NOT NULL,
  price_minor integer NOT NULL,
  sku text,
  sort_order integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_bakery ON product_variants(bakery_id);

-- ============================================================
-- Orders & items
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
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

-- ============================================================
-- Payments
-- ============================================================
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
CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(method, provider_reference) WHERE provider_reference IS NOT NULL;

-- ============================================================
-- Per-bakery payment credentials (encrypted)
-- ============================================================
CREATE TABLE bakery_payment_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('mtn_momo','airtel_money','bank_transfer')),
  is_enabled boolean NOT NULL DEFAULT false,
  encrypted_config bytea NOT NULL,
  config_nonce bytea NOT NULL,
  target_environment text NOT NULL CHECK (target_environment IN ('sandbox','production')),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bakery_id, provider)
);
CREATE INDEX idx_bakery_payment_credentials_bakery ON bakery_payment_credentials(bakery_id);

-- ============================================================
-- Auth tokens
-- ============================================================
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

-- ============================================================
-- Audit logs (FK corrected to super_admin_users)
-- ============================================================
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES super_admin_users(id),
  action VARCHAR(255) NOT NULL,
  bakery_id uuid REFERENCES bakeries(id),
  resource_type VARCHAR(50),
  resource_id uuid,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_bakery_id ON audit_logs(bakery_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- Support ticketing
-- ============================================================
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id uuid NOT NULL REFERENCES bakeries(id) ON DELETE RESTRICT,
  admin_id uuid REFERENCES super_admin_users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_support_tickets_bakery ON support_tickets(bakery_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_status ON support_tickets(status) WHERE deleted_at IS NULL;

CREATE TABLE ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('bakery_user','super_admin','system')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================================
-- Customer profiles & addresses
-- ============================================================
CREATE TABLE customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  date_of_birth date,
  bio text,
  avatar_url text,
  default_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX idx_customer_profiles_user ON customer_profiles(user_id);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street_address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  postal_code text,
  is_default boolean NOT NULL DEFAULT false,
  is_delivery_address boolean NOT NULL DEFAULT false,
  is_billing_address boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
