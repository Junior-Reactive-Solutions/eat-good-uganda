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
  deleted_at?: string
}

interface ListOptions {
  limit?: number
  offset?: number
  role?: BakeryUserRole
}

const STAFF_COLS = sql`
  id, bakery_id, email, full_name, phone, role, is_active,
  created_at, updated_at, last_login_at, deleted_at
`

/**
 * List all staff for a bakery with pagination and optional role filtering
 * Multi-tenant isolation: filters by bakery_id
 */
export async function listBakeryStaff(
  db: Database,
  bakeryId: string,
  options: ListOptions = {},
): Promise<BakeryStaff[]> {
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0
  const roleFilter = options.role ? sql`AND role = ${options.role}` : sql``

  const result = await query<BakeryStaff>(
    db,
    sql`
      SELECT ${STAFF_COLS}
      FROM bakery_users
      WHERE bakery_id = ${bakeryId} AND deleted_at IS NULL ${roleFilter}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
  )
  return result.rows
}

/**
 * Get a single staff member by ID with bakery isolation
 * Multi-tenant isolation: filters by both id AND bakery_id
 */
export async function getBakeryStaffMember(
  db: Database,
  bakeryId: string,
  staffId: string,
): Promise<BakeryStaff | null> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      SELECT ${STAFF_COLS}
      FROM bakery_users
      WHERE id = ${staffId} AND bakery_id = ${bakeryId} AND deleted_at IS NULL
      LIMIT 1
    `,
  )
  return result.rows[0] ?? null
}

/**
 * Create a new staff member for a bakery
 * Multi-tenant isolation: creates with specific bakery_id
 */
export async function createBakeryStaff(
  db: Database,
  bakeryId: string,
  data: {
    email: string
    full_name: string
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
        (${bakeryId}, ${data.email}, ${data.full_name}, ${data.phone ?? null}, ${data.role}, true, now(), now())
      RETURNING ${STAFF_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to create bakery staff')
  }
  return row
}

/**
 * Update staff member name, phone, and/or role
 * Multi-tenant isolation: filters by both id AND bakery_id
 * Last owner protection: prevents downgrading the only owner to another role
 */
export async function updateBakeryStaff(
  db: Database,
  bakeryId: string,
  staffId: string,
  updates: {
    full_name?: string
    phone?: string
    role?: BakeryUserRole
  },
): Promise<BakeryStaff> {
  // Get current staff member first
  const current = await getBakeryStaffMember(db, bakeryId, staffId)
  if (!current) {
    throw new Error('Staff member not found')
  }

  // Check if attempting to change role
  if (updates.role && current.role === 'owner' && updates.role !== 'owner') {
    // If changing role from owner, check if this is the last owner
    const ownerCount = await query<{ count: number }>(
      db,
      sql`
        SELECT COUNT(*) as count
        FROM bakery_users
        WHERE bakery_id = ${bakeryId} AND role = 'owner' AND deleted_at IS NULL
      `,
    )
    const count = ownerCount.rows[0]?.count ?? 0
    if (count <= 1) {
      throw new Error('Cannot remove last owner from bakery')
    }
  }

  // Prepare values for update
  const fullName = updates.full_name !== undefined ? updates.full_name : current.full_name
  const phone = updates.phone !== undefined ? updates.phone : current.phone
  const role = updates.role !== undefined ? updates.role : current.role

  const result = await query<BakeryStaff>(
    db,
    sql`
      UPDATE bakery_users
      SET full_name = ${fullName}, phone = ${phone ?? null}, role = ${role}, updated_at = now()
      WHERE id = ${staffId} AND bakery_id = ${bakeryId}
      RETURNING ${STAFF_COLS}
    `,
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error('Staff member not found')
  }
  return row
}

/**
 * Soft delete a staff member
 * Multi-tenant isolation: filters by both id AND bakery_id
 * Last owner protection: prevents deleting the only owner of a bakery
 */
export async function removeBakeryStaff(
  db: Database,
  bakeryId: string,
  staffId: string,
): Promise<BakeryStaff> {
  // Get the staff member to check their role
  const staff = await getBakeryStaffMember(db, bakeryId, staffId)
  if (!staff) {
    throw new Error('Staff member not found')
  }

  // If staff is an owner, check if this is the last owner
  if (staff.role === 'owner') {
    const ownerCount = await query<{ count: number }>(
      db,
      sql`
        SELECT COUNT(*) as count
        FROM bakery_users
        WHERE bakery_id = ${bakeryId} AND role = 'owner' AND deleted_at IS NULL
      `,
    )
    const count = ownerCount.rows[0]?.count ?? 0
    if (count <= 1) {
      throw new Error('Cannot remove last owner from bakery')
    }
  }

  const result = await query<BakeryStaff>(
    db,
    sql`
      UPDATE bakery_users
      SET deleted_at = now(), updated_at = now()
      WHERE id = ${staffId} AND bakery_id = ${bakeryId}
      RETURNING ${STAFF_COLS}
    `,
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to remove staff member')
  }
  return row
}

/**
 * Get staff member by email with bakery isolation
 * Multi-tenant isolation: filters by both email AND bakery_id
 */
export async function getBakeryStaffByEmail(
  db: Database,
  bakeryId: string,
  email: string,
): Promise<BakeryStaff | null> {
  const result = await query<BakeryStaff>(
    db,
    sql`
      SELECT ${STAFF_COLS}
      FROM bakery_users
      WHERE bakery_id = ${bakeryId} AND email = ${email} AND deleted_at IS NULL
      LIMIT 1
    `,
  )
  return result.rows[0] ?? null
}
