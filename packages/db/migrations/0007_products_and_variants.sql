-- 0007_products_and_variants
-- Purpose: create products and product variants
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
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
CREATE INDEX idx_products_bakery_published ON products(bakery_id, is_published, sort_order)
  WHERE deleted_at IS NULL;

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

-- migrate:down
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
