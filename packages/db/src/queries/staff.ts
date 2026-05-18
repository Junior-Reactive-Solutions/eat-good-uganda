import type { BakeryUserRole } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export interface BakeryStaff {
  id: string
  bakery_id: string
  email: string
  full_name: string
  phone?: string
  role: BakeryUserRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

const STAFF_COLS = sql`
  id, bakery_id, email, full_name, phone, role, is_active,
  created_at, updated_at, last_login_at
`

export async function getBakeryStaff(db: Database, bakeryId: string): Promise<BakeryStaff[]> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      SELECT ${STAFF_COLS}
      FROM bakery_users
      WHERE bakery_id = ${bakeryId} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
  )
  return result.rows
}

export async function addBakeryStaff(
  db: Database,
  bakeryId: string,
  data: {
    email: string
    fullName: string
    phone?: string
    role: BakeryUserRole
  },
): Promise<BakeryStaff> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      INSERT INTO bakery_users
        (bakery_id, email, full_name, phone, role, is_active, created_at, updated_at)
      VALUES
        (${bakeryId}, ${data.email}, ${data.fullName}, ${data.phone ?? null}, ${data.role}, true, now(), now())
      RETURNING ${STAFF_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to add bakery staff')
  }
  return row
}

export async function updateStaffRole(
  db: Database,
  staffId: string,
  role: BakeryUserRole,
): Promise<BakeryStaff> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      UPDATE bakery_users
      SET role = ${role}, updated_at = now()
      WHERE id = ${staffId}
      RETURNING ${STAFF_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Staff member not found')
  }
  return row
}

export async function removeStaffMember(db: Database, staffId: string): Promise<void> {
  await query(
    db,
    sql`
      UPDATE bakery_users
      SET deleted_at = now(), updated_at = now()
      WHERE id = ${staffId}
    `,
  )
}

export async function getStaffMemberById(
  db: Database,
  staffId: string,
): Promise<BakeryStaff | null> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      SELECT ${STAFF_COLS}
      FROM bakery_users
      WHERE id = ${staffId} AND deleted_at IS NULL
      LIMIT 1
    `,
  )
  return result.rows[0] ?? null
}
