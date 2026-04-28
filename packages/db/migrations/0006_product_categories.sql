-- 0006_product_categories
-- Purpose: create per-bakery product categories
-- Safe to re-run: no (uses CREATE TABLE)
-- migrate:up
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

-- migrate:down
DROP TABLE IF EXISTS product_categories;
