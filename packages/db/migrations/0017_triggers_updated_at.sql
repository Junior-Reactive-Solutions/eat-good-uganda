-- 0017_triggers_updated_at
-- Purpose: keep updated_at columns in sync on update
-- Safe to re-run: yes (drops/recreates function and triggers)
-- migrate:up
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_bakeries ON bakeries;
CREATE TRIGGER trg_set_updated_at_bakeries BEFORE UPDATE ON bakeries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_super_admin_users ON super_admin_users;
CREATE TRIGGER trg_set_updated_at_super_admin_users BEFORE UPDATE ON super_admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_bakery_users ON bakery_users;
CREATE TRIGGER trg_set_updated_at_bakery_users BEFORE UPDATE ON bakery_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_customers ON customers;
CREATE TRIGGER trg_set_updated_at_customers BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_product_categories ON product_categories;
CREATE TRIGGER trg_set_updated_at_product_categories BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_products ON products;
CREATE TRIGGER trg_set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_product_variants ON product_variants;
CREATE TRIGGER trg_set_updated_at_product_variants BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_orders ON orders;
CREATE TRIGGER trg_set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_payments ON payments;
CREATE TRIGGER trg_set_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_bakery_payment_credentials ON bakery_payment_credentials;
CREATE TRIGGER trg_set_updated_at_bakery_payment_credentials BEFORE UPDATE ON bakery_payment_credentials FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_email_log ON email_log;
CREATE TRIGGER trg_set_updated_at_email_log BEFORE UPDATE ON email_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_platform_settings ON platform_settings;
CREATE TRIGGER trg_set_updated_at_platform_settings BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_set_updated_at_platform_settings ON platform_settings;
DROP TRIGGER IF EXISTS trg_set_updated_at_email_log ON email_log;
DROP TRIGGER IF EXISTS trg_set_updated_at_bakery_payment_credentials ON bakery_payment_credentials;
DROP TRIGGER IF EXISTS trg_set_updated_at_payments ON payments;
DROP TRIGGER IF EXISTS trg_set_updated_at_orders ON orders;
DROP TRIGGER IF EXISTS trg_set_updated_at_product_variants ON product_variants;
DROP TRIGGER IF EXISTS trg_set_updated_at_products ON products;
DROP TRIGGER IF EXISTS trg_set_updated_at_product_categories ON product_categories;
DROP TRIGGER IF EXISTS trg_set_updated_at_customers ON customers;
DROP TRIGGER IF EXISTS trg_set_updated_at_bakery_users ON bakery_users;
DROP TRIGGER IF EXISTS trg_set_updated_at_super_admin_users ON super_admin_users;
DROP TRIGGER IF EXISTS trg_set_updated_at_bakeries ON bakeries;
DROP FUNCTION IF EXISTS set_updated_at();
