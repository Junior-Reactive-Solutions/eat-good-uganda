import type { SuperAdminUser } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const SUPER_ADMIN_COLS = sql`
  id, email, password_hash, full_name, is_active,
  totp_secret, last_login_at,
  created_at, updated_at
`

export async function getSuperAdminByEmail(
  db: Database,
  email: string,
): Promise<SuperAdminUser | null> {
  const result = await query<SuperAdminUser>(
    db,
    sql`SELECT ${SUPER_ADMIN_COLS} FROM super_admin_users WHERE email = ${email} AND is_active = true LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getSuperAdminById(db: Database, id: string): Promise<SuperAdminUser | null> {
  const result = await query<SuperAdminUser>(
    db,
    sql`SELECT ${SUPER_ADMIN_COLS} FROM super_admin_users WHERE id = ${id} AND is_active = true LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function updateSuperAdminLastLogin(db: Database, id: string): Promise<void> {
  await query<SuperAdminUser>(
    db,
    sql`UPDATE super_admin_users SET last_login_at = now() WHERE id = ${id}`,
  )
}
