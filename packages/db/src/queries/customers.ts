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
