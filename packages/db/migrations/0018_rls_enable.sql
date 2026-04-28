-- 0018_rls_enable
-- Purpose: enable row-level security on tenant-scoped tables
-- Safe to re-run: yes (drops/recreates policies)
-- migrate:up
ALTER TABLE bakery_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakery_payment_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_bakery_users ON bakery_users;
CREATE POLICY tenant_isolation_bakery_users ON bakery_users
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_product_categories ON product_categories;
CREATE POLICY tenant_isolation_product_categories ON product_categories
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_products ON products;
CREATE POLICY tenant_isolation_products ON products
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS public_read_published_products ON products;
CREATE POLICY public_read_published_products ON products FOR SELECT
  USING (is_published = true AND deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM bakeries b WHERE b.id = products.bakery_id AND b.status = 'active' AND b.deleted_at IS NULL
  ));
DROP POLICY IF EXISTS tenant_isolation_product_variants ON product_variants;
CREATE POLICY tenant_isolation_product_variants ON product_variants
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
CREATE POLICY tenant_isolation_order_items ON order_items
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
CREATE POLICY tenant_isolation_payments ON payments
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_bakery_payment_credentials ON bakery_payment_credentials;
CREATE POLICY tenant_isolation_bakery_payment_credentials ON bakery_payment_credentials
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');
DROP POLICY IF EXISTS tenant_isolation_order_messages ON order_messages;
CREATE POLICY tenant_isolation_order_messages ON order_messages
  USING (bakery_id::text = current_setting('app.bakery_id', true) OR current_setting('app.role', true) = 'super_admin');

-- migrate:down
DROP POLICY IF EXISTS tenant_isolation_order_messages ON order_messages;
DROP POLICY IF EXISTS tenant_isolation_bakery_payment_credentials ON bakery_payment_credentials;
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
DROP POLICY IF EXISTS tenant_isolation_product_variants ON product_variants;
DROP POLICY IF EXISTS public_read_published_products ON products;
DROP POLICY IF EXISTS tenant_isolation_products ON products;
DROP POLICY IF EXISTS tenant_isolation_product_categories ON product_categories;
DROP POLICY IF EXISTS tenant_isolation_bakery_users ON bakery_users;
ALTER TABLE order_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE bakery_payment_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE bakery_users DISABLE ROW LEVEL SECURITY;
