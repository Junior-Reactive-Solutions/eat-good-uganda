import type { BakeryUser, BakeryUserRole } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const BAKERY_USER_COLS = sql`
  id, bakery_id, email, password_hash, full_name, phone,
  role, is_active,
  email_verified_at, last_login_at,
  created_at, updated_at, deleted_at
`

export async function getBakeryUserByEmail(
  db: Database,
  email: string,
): Promise<BakeryUser | null> {
  const result = await query<BakeryUser>(
    db,
    sql`SELECT ${BAKERY_USER_COLS} FROM bakery_users WHERE email = ${email} AND deleted_at IS NULL LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getBakeryUserById(db: Database, id: string): Promise<BakeryUser | null> {
  const result = await query<BakeryUser>(
    db,
    sql`SELECT ${BAKERY_USER_COLS} FROM bakery_users WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function createBakeryUser(
  db: Database,
  input: {
    bakery_id: string
    email: string
    password_hash: string
    full_name: string
    phone: string | null
    role: BakeryUserRole
  },
): Promise<BakeryUser> {
  const result = await query<BakeryUser>(
    db,
    sql`INSERT INTO bakery_users (bakery_id, email, password_hash, full_name, phone, role)
        VALUES (${input.bakery_id}, ${input.email}, ${input.password_hash}, ${input.full_name}, ${input.phone}, ${input.role})
        RETURNING ${BAKERY_USER_COLS}`,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to create bakery user')
  }
  return row
}

export async function markBakeryUserEmailVerified(db: Database, id: string): Promise<void> {
  await query<BakeryUser>(
    db,
    sql`UPDATE bakery_users SET email_verified_at = now() WHERE id = ${id}`,
  )
}

export async function updateBakeryUserLastLogin(db: Database, id: string): Promise<void> {
  await query<BakeryUser>(db, sql`UPDATE bakery_users SET last_login_at = now() WHERE id = ${id}`)
}

export async function updateBakeryUserPasswordHash(
  db: Database,
  id: string,
  hash: string,
): Promise<void> {
  await query<BakeryUser>(
    db,
    sql`UPDATE bakery_users SET password_hash = ${hash}, updated_at = now() WHERE id = ${id}`,
  )
}
