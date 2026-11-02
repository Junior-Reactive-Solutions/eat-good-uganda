/**
 * Test fixtures for creating deterministic test data
 * All functions return actual database rows via SQL
 * Use sequential IDs and deterministic slugs for reproducibility
 */

import { randomUUID } from 'node:crypto'

import { query, pool, type Database } from './client'
import { sql } from './sql'

let seedCounter = 0

export async function seedBakery(
  db: Database = pool,
  overrides: Record<string, unknown> = {},
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const slug = (overrides['slug'] as string | undefined) ?? `test-bakery-${String(seedCounter)}`
  const legalName =
    (overrides['legal_name'] as string | undefined) ?? `Test Bakery ${String(seedCounter)}`
  const displayName =
    (overrides['display_name'] as string | undefined) ?? `Test Bakery ${String(seedCounter)}`
  const phone = (overrides['phone'] as string | undefined) ?? '+256700000000'
  const email =
    (overrides['email'] as string | undefined) ?? `bakery${String(seedCounter)}@test.com`
  const addressLine1 =
    (overrides['address_line1'] as string | undefined) ?? `${String(seedCounter)} Test Street`
  const city = (overrides['city'] as string | undefined) ?? 'Kampala'
  const latitude = (overrides['latitude'] as number | undefined) ?? 0.3476 + seedCounter * 0.001
  const longitude = (overrides['longitude'] as number | undefined) ?? 32.5825 + seedCounter * 0.001
  const primaryColor = (overrides['primary_color'] as string | undefined) ?? '#8B4513'
  const status = (overrides['status'] as string | undefined) ?? 'active'

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

export async function seedBakeryUser(
  db: Database = pool,
  bakeryId: string,
  overrides: Record<string, unknown> = {},
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const email = (overrides['email'] as string | undefined) ?? `staff${String(seedCounter)}@test.com`
  const fullName =
    (overrides['full_name'] as string | undefined) ?? `Test Staff ${String(seedCounter)}`
  const passwordHash =
    (overrides['password_hash'] as string | undefined) ?? 'hashed-password-for-testing'
  const role = (overrides['role'] as string | undefined) ?? 'manager'

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

export async function seedCustomer(
  db: Database = pool,
  overrides: Record<string, unknown> = {},
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const email =
    (overrides['email'] as string | undefined) ?? `customer${String(seedCounter)}@test.com`
  const fullName =
    (overrides['full_name'] as string | undefined) ?? `Test Customer ${String(seedCounter)}`
  const passwordHash =
    (overrides['password_hash'] as string | undefined) ?? 'hashed-password-for-testing'

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

export async function seedProduct(
  db: Database = pool,
  bakeryId: string,
  overrides: Record<string, unknown> = {},
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const slug = (overrides['slug'] as string | undefined) ?? `product-${String(seedCounter)}`
  const name = (overrides['name'] as string | undefined) ?? `Test Product ${String(seedCounter)}`
  const basePriceMinor = (overrides['base_price_minor'] as number | undefined) ?? 50000
  const isPublished = (overrides['is_published'] as boolean | undefined) ?? true

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

export async function seedOrder(
  db: Database = pool,
  overrides: Record<string, unknown> & { bakery_id: string },
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const bakeryId = overrides['bakery_id']
  const customerId = (overrides['customer_id'] as string | undefined) ?? randomUUID()
  const orderNumber =
    (overrides['order_number'] as string | undefined) ?? `EGU-TEST-${String(seedCounter)}`
  const status = (overrides['status'] as string | undefined) ?? 'pending'
  const subtotalMinor = (overrides['subtotal_minor'] as number | undefined) ?? 50000
  const taxMinor = (overrides['tax_minor'] as number | undefined) ?? 0
  const deliveryFeeMinor = (overrides['delivery_fee_minor'] as number | undefined) ?? 0
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

export async function seedSuperAdmin(
  db: Database = pool,
  overrides: Record<string, unknown> = {},
): Promise<unknown> {
  seedCounter++

  const id = (overrides['id'] as string | undefined) ?? randomUUID()
  const email = (overrides['email'] as string | undefined) ?? `admin${String(seedCounter)}@test.com`
  const fullName =
    (overrides['full_name'] as string | undefined) ?? `Test Admin ${String(seedCounter)}`
  const passwordHash =
    (overrides['password_hash'] as string | undefined) ?? 'hashed-password-for-testing'

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

export function resetSeedCounter(): void {
  seedCounter = 0
}

export function getSeedCounter(): number {
  return seedCounter
}
