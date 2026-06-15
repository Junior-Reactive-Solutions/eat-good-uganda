/**
 * Test fixtures for creating deterministic test data
 * All functions return actual database rows via SQL
 * Use sequential IDs and deterministic slugs for reproducibility
 */

import { randomUUID } from 'node:crypto'
import { query, pool, type Database } from './client'
import { sql } from './sql'

let seedCounter = 0

/**
 * Bakery test fixture
 * Creates a fresh bakery with deterministic data
 */
export async function seedBakery(
  db: Database = pool,
  overrides: Partial<any> = {},
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const slug = overrides.slug ?? `test-bakery-${seedCounter}`
  const legalName = overrides.legal_name ?? `Test Bakery ${seedCounter}`
  const displayName = overrides.display_name ?? `Test Bakery ${seedCounter}`
  const phone = overrides.phone ?? '+256700000000'
  const email = overrides.email ?? `bakery${seedCounter}@test.com`
  const addressLine1 = overrides.address_line1 ?? `${seedCounter} Test Street`
  const city = overrides.city ?? 'Kampala'
  const latitude = overrides.latitude ?? 0.3476 + seedCounter * 0.001
  const longitude = overrides.longitude ?? 32.5825 + seedCounter * 0.001
  const primaryColor = overrides.primary_color ?? '#8B4513'
  const status = overrides.status ?? 'active'

  const result = await query(
    db,
    sql`
      INSERT INTO bakeries (
        id, slug, legal_name, display_name, phone, email, address_line1, city,
        latitude, longitude, primary_color, status
      )
      VALUES (${id}, ${slug}, ${legalName}, ${displayName}, ${phone}, ${email},
              ${addressLine1}, ${city}, ${latitude}, ${longitude}, ${primaryColor}, ${status})
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Bakery user (staff) test fixture
 * Creates a bakery staff member with deterministic data
 */
export async function seedBakeryUser(
  db: Database = pool,
  bakeryId: string,
  overrides: Partial<any> = {},
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const email = overrides.email ?? `staff${seedCounter}@test.com`
  const fullName = overrides.full_name ?? `Test Staff ${seedCounter}`
  const passwordHash = overrides.password_hash ?? 'hashed-password-for-testing'
  const role = overrides.role ?? 'manager'

  const result = await query(
    db,
    sql`
      INSERT INTO bakery_users (id, bakery_id, email, password_hash, full_name, role)
      VALUES (${id}, ${bakeryId}, ${email}, ${passwordHash}, ${fullName}, ${role})
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Customer test fixture
 * Creates a customer account with deterministic data
 */
export async function seedCustomer(
  db: Database = pool,
  overrides: Partial<any> = {},
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const email = overrides.email ?? `customer${seedCounter}@test.com`
  const fullName = overrides.full_name ?? `Test Customer ${seedCounter}`
  const passwordHash = overrides.password_hash ?? 'hashed-password-for-testing'

  const result = await query(
    db,
    sql`
      INSERT INTO customers (id, email, password_hash, full_name)
      VALUES (${id}, ${email}, ${passwordHash}, ${fullName})
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Product test fixture
 * Creates a product/menu item with deterministic data
 */
export async function seedProduct(
  db: Database = pool,
  bakeryId: string,
  overrides: Partial<any> = {},
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const slug = overrides.slug ?? `product-${seedCounter}`
  const name = overrides.name ?? `Test Product ${seedCounter}`
  const basePriceMinor = overrides.base_price_minor ?? 50000 // UGX 50,000
  const isPublished = overrides.is_published ?? true

  const result = await query(
    db,
    sql`
      INSERT INTO products (
        id, bakery_id, slug, name, base_price_minor, is_published
      )
      VALUES (${id}, ${bakeryId}, ${slug}, ${name}, ${basePriceMinor}, ${isPublished})
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Order test fixture
 * Creates an order with deterministic data
 * Requires bakery_id in overrides
 */
export async function seedOrder(
  db: Database = pool,
  overrides: Partial<any> & { bakery_id: string },
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const bakeryId = overrides.bakery_id
  const customerId = overrides.customer_id ?? randomUUID()
  const orderNumber = overrides.order_number ?? `EGU-TEST-${seedCounter}`
  const status = overrides.status ?? 'pending'
  const subtotalMinor = overrides.subtotal_minor ?? 50000 // UGX 50,000
  const taxMinor = overrides.tax_minor ?? 0
  const deliveryFeeMinor = overrides.delivery_fee_minor ?? 0
  const totalMinor = subtotalMinor + taxMinor + deliveryFeeMinor

  const result = await query(
    db,
    sql`
      INSERT INTO orders (
        id, bakery_id, customer_id, order_number, status,
        subtotal_minor, tax_minor, delivery_fee_minor, total_minor
      )
      VALUES (
        ${id}, ${bakeryId}, ${customerId}, ${orderNumber}, ${status},
        ${subtotalMinor}, ${taxMinor}, ${deliveryFeeMinor}, ${totalMinor}
      )
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Super admin test fixture
 * Creates a platform operator account with deterministic data
 */
export async function seedSuperAdmin(
  db: Database = pool,
  overrides: Partial<any> = {},
): Promise<any> {
  seedCounter++

  const id = overrides.id ?? randomUUID()
  const email = overrides.email ?? `admin${seedCounter}@test.com`
  const fullName = overrides.full_name ?? `Test Admin ${seedCounter}`
  const passwordHash = overrides.password_hash ?? 'hashed-password-for-testing'

  const result = await query(
    db,
    sql`
      INSERT INTO super_admin_users (id, email, password_hash, full_name)
      VALUES (${id}, ${email}, ${passwordHash}, ${fullName})
      RETURNING *
    `,
  )

  return result.rows[0]
}

/**
 * Reset the seed counter (useful for test isolation)
 */
export function resetSeedCounter(): void {
  seedCounter = 0
}

/**
 * Get current seed counter value
 */
export function getSeedCounter(): number {
  return seedCounter
}

// Legacy type exports for backward compatibility
export type BakeryRow = { id: string; slug: string }
export type BakeryUserRow = { id: string; bakery_id: string; email: string }
export type CustomerRow = { id: string; email: string }
export type ProductFixtureRow = { id: string; bakery_id: string; name: string }
export type OrderRow = { id: string; bakery_id: string; order_number: string }
