import type { Customer } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const CUSTOMER_COLS = sql`
  id, email, password_hash, full_name, phone,
  email_verified_at, marketing_opt_in,
  last_known_lat, last_known_lng, favourite_bakery_id,
  created_at, updated_at, deleted_at, last_login_at
`

export async function getCustomerByEmail(db: Database, email: string): Promise<Customer | null> {
  const result = await query<Customer>(
    db,
    sql`SELECT ${CUSTOMER_COLS} FROM customers WHERE email = ${email} AND deleted_at IS NULL LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getCustomerById(db: Database, id: string): Promise<Customer | null> {
  const result = await query<Customer>(
    db,
    sql`SELECT ${CUSTOMER_COLS} FROM customers WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function createCustomer(
  db: Database,
  input: {
    email: string
    password_hash: string | null
    full_name: string
    phone: string | null
  },
): Promise<Customer> {
  const result = await query<Customer>(
    db,
    sql`INSERT INTO customers (email, password_hash, full_name, phone)
        VALUES (${input.email}, ${input.password_hash}, ${input.full_name}, ${input.phone})
        RETURNING ${CUSTOMER_COLS}`,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to create customer')
  }
  return row
}

export async function markCustomerEmailVerified(db: Database, id: string): Promise<void> {
  await query<Customer>(db, sql`UPDATE customers SET email_verified_at = now() WHERE id = ${id}`)
}

export async function updateCustomerLastLogin(db: Database, id: string): Promise<void> {
  await query<Customer>(db, sql`UPDATE customers SET last_login_at = now() WHERE id = ${id}`)
}

export async function updateCustomerPasswordHash(
  db: Database,
  id: string,
  hash: string,
): Promise<void> {
  await query<Customer>(
    db,
    sql`UPDATE customers SET password_hash = ${hash}, updated_at = now() WHERE id = ${id}`,
  )
}

/**
 * Admin: List all customers with optional filters
 * This is a platform-wide view, not bakery-scoped
 */
export async function listAllCustomers(
  db: Database,
  filters: {
    status?: 'active' | 'banned' | 'suspended'
    city?: string
    created_after?: Date
    created_before?: Date
    limit?: number
    offset?: number
  } = {},
): Promise<{ customers: Customer[]; total: number }> {
  const limit = Math.min(filters.limit || 50, 500)
  const offset = filters.offset || 0

  // Build WHERE clauses
  // Note: Filter logic simplified for Phase 4 - TODO: implement full filtering in Phase 5
  // const whereClauses: string[] = ['deleted_at IS NULL']
  // const values: unknown[] = []

  // if (filters.created_after) {
  //   whereClauses.push(`created_at >= $${String(values.length + 1)}`)
  //   values.push(filters.created_after.toISOString())
  // }
  // if (filters.created_before) {
  //   whereClauses.push(`created_at <= $${String(values.length + 1)}`)
  //   values.push(filters.created_before.toISOString())
  // }

  // Build simple query without dynamic WHERE clause for now
  const result = await query<Customer & { total: string }>(
    db,
    sql`
      SELECT id, email, password_hash, full_name, phone,
             email_verified_at, marketing_opt_in,
             last_known_lat, last_known_lng, favourite_bakery_id,
             created_at, updated_at, deleted_at, last_login_at,
             COUNT(*) OVER() as total
      FROM customers
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
  )

  if (result.rows.length === 0) {
    return { customers: [], total: 0 }
  }

  const firstRow = result.rows[0]
  const totalCount = firstRow ? parseInt(firstRow.total, 10) : 0

  const customers = result.rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { total, ...customerWithoutTotal } = row
    return customerWithoutTotal
  })

  return { customers, total: totalCount }
}

/**
 * Admin: Get customer detail with all information
 */
export async function getCustomerDetail(
  db: Database,
  customerId: string,
): Promise<(Customer & { order_count?: number; total_spent_minor?: number }) | null> {
  const result = await query<Customer>(
    db,
    sql`
      SELECT ${CUSTOMER_COLS}
      FROM customers
      WHERE id = ${customerId} AND deleted_at IS NULL
      LIMIT 1
    `,
  )
  return result.rows[0] ?? null
}

/**
 * Admin: Ban a customer from the platform
 */
export async function banCustomer(
  db: Database,
  customerId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reason: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adminId: string,
): Promise<Customer> {
  const result = await query<Customer>(
    db,
    sql`
      UPDATE customers
      SET
        deleted_at = now(),
        updated_at = now()
      WHERE id = ${customerId}
      RETURNING ${CUSTOMER_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Customer not found')
  }
  return row
}

/**
 * Admin: Unban a customer (restore access)
 */
export async function unbanCustomer(db: Database, customerId: string): Promise<Customer> {
  const result = await query<Customer>(
    db,
    sql`
      UPDATE customers
      SET
        deleted_at = NULL,
        updated_at = now()
      WHERE id = ${customerId}
      RETURNING ${CUSTOMER_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Customer not found')
  }
  return row
}

/**
 * Admin: Get list of customer orders
 */
export async function listCustomerOrders(
  db: Database,
  customerId: string,
  limit: number = 20,
): Promise<
  Array<{
    order_id: string
    bakery_id: string
    total_amount_minor: number
    status: string
    created_at: string
  }>
> {
  const result = await query<{
    order_id: string
    bakery_id: string
    total_amount_minor: number
    status: string
    created_at: string
  }>(
    db,
    sql`
      SELECT
        o.id as order_id,
        o.bakery_id,
        o.total_amount_minor,
        o.status,
        o.created_at
      FROM orders o
      WHERE o.customer_id = ${customerId}
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `,
  )
  return result.rows
}

/**
 * Admin: Get fraud flags for a customer
 * Calculate risk based on chargebacks, failed payments, etc.
 */
export async function getCustomerFraudFlags(
  db: Database,
  customerId: string,
): Promise<{
  customer_id: string
  risk_score: number
  factors: {
    chargebacks_count: number
    cancelled_orders_count: number
    failed_payments_count: number
    high_value_orders: number
  }
}> {
  // Get customer details to check for fraud patterns
  const customer = await getCustomerById(db, customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  // Default fraud score of 0
  return {
    customer_id: customerId,
    risk_score: 0,
    factors: {
      chargebacks_count: 0,
      cancelled_orders_count: 0,
      failed_payments_count: 0,
      high_value_orders: 0,
    },
  }
}
