-- 0019_seed_development
-- Purpose: seed development data for local UI and API testing
-- Safe to re-run: yes (uses deterministic upsert patterns)
-- migrate:up
DO $$
DECLARE
  env_value text := COALESCE(current_setting('app.env', true), 'development');
  bakery_a uuid;
  bakery_b uuid;
  bakery_c uuid;
  customer_primary uuid;
  order_idx integer;
BEGIN
  IF env_value NOT IN ('development', 'dev', 'local') THEN
    RAISE NOTICE 'Skipping dev seed in environment: %', env_value;
    RETURN;
  END IF;

  INSERT INTO bakeries (slug, legal_name, display_name, phone, email, address_line1, latitude, longitude, status)
  VALUES
    ('sweet-cravings', 'Sweet Cravings Ltd', 'Sweet Cravings', '+256700000001', 'sweet@example.com', 'Kampala Road 1', 0.3136, 32.5811, 'active'),
    ('kampala-crumbs', 'Kampala Crumbs Ltd', 'Kampala Crumbs', '+256700000002', 'crumbs@example.com', 'Kampala Road 2', 0.3200, 32.5900, 'active'),
    ('nile-bakes', 'Nile Bakes Ltd', 'Nile Bakes', '+256700000003', 'nile@example.com', 'Kampala Road 3', 0.3050, 32.5700, 'active')
  ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name;

  SELECT id INTO bakery_a FROM bakeries WHERE slug = 'sweet-cravings';
  SELECT id INTO bakery_b FROM bakeries WHERE slug = 'kampala-crumbs';
  SELECT id INTO bakery_c FROM bakeries WHERE slug = 'nile-bakes';

  INSERT INTO product_categories (bakery_id, name, slug)
  VALUES
    (bakery_a, 'Cakes', 'cakes'),
    (bakery_b, 'Bread', 'bread'),
    (bakery_c, 'Pastries', 'pastries')
  ON CONFLICT (bakery_id, slug) DO NOTHING;

  INSERT INTO products (bakery_id, slug, name, base_price_minor, is_published, is_available)
  SELECT CASE WHEN i <= 7 THEN bakery_a WHEN i <= 14 THEN bakery_b ELSE bakery_c END,
         CONCAT('product-', i),
         CONCAT('Sample Product ', i),
         10000 + (i * 500),
         true,
         true
  FROM generate_series(1, 20) AS i
  ON CONFLICT (bakery_id, slug) DO NOTHING;

  INSERT INTO customers (email, full_name, phone)
  SELECT CONCAT('customer', i, '@example.com'), CONCAT('Customer ', i), CONCAT('+2567000000', i)
  FROM generate_series(1, 5) AS i
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO customer_primary FROM customers ORDER BY created_at LIMIT 1;

  FOR order_idx IN 1..10 LOOP
    INSERT INTO orders (
      bakery_id, customer_id, order_number, status, fulfilment_mode,
      subtotal_minor, total_minor, currency_code
    ) VALUES (
      CASE WHEN order_idx <= 4 THEN bakery_a WHEN order_idx <= 7 THEN bakery_b ELSE bakery_c END,
      customer_primary,
      CONCAT('EGU-SEED-', LPAD(order_idx::text, 4, '0')),
      'pending_payment',
      'pickup',
      20000 + (order_idx * 1000),
      20000 + (order_idx * 1000),
      'UGX'
    ) ON CONFLICT (order_number) DO NOTHING;
  END LOOP;
END $$;

-- migrate:down
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'EGU-SEED-%');
DELETE FROM orders WHERE order_number LIKE 'EGU-SEED-%';
DELETE FROM products WHERE slug LIKE 'product-%';
DELETE FROM product_categories WHERE slug IN ('cakes', 'bread', 'pastries');
DELETE FROM customers WHERE email LIKE 'customer%@example.com';
DELETE FROM bakeries WHERE slug IN ('sweet-cravings', 'kampala-crumbs', 'nile-bakes');
