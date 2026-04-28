-- 0003_bakeries
-- Purpose: create the core tenant table
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
CREATE TABLE bakeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug citext UNIQUE NOT NULL,
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
  email citext NOT NULL,
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

-- migrate:down
DROP TABLE IF EXISTS bakeries;
