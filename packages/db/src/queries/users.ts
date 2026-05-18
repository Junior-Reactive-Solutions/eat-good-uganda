import type { Database } from '../client'
import { query } from '../client'
import { sql } from '../sql'

export interface CustomerDetail {
  id: string
  email: string
  phone: string | undefined
  full_name: string
  is_banned: boolean
  ban_reason: string | undefined
  banned_at: string | undefined
  fraud_flag: boolean
  fraud_reason: string | undefined
  total_orders: number
  total_spent_minor: number
  created_at: string
  updated_at: string
}

export async function banCustomer(db: Database, customerId: string, reason: string): Promise<void> {
  await query(
    db,
    sql`
      UPDATE customers
      SET is_banned = true, ban_reason = ${reason}, banned_at = now(), updated_at = now()
      WHERE id = ${customerId} AND deleted_at IS NULL
    `,
  )
}

export async function unbanCustomer(db: Database, customerId: string): Promise<void> {
  await query(
    db,
    sql`
      UPDATE customers
      SET is_banned = false, ban_reason = NULL, banned_at = NULL, updated_at = now()
      WHERE id = ${customerId} AND deleted_at IS NULL
    `,
  )
}

export async function getCustomerDetails(
  db: Database,
  customerId: string,
): Promise<CustomerDetail | null> {
  const result = await query<CustomerDetail & { total_orders: string; total_spent_minor: string }>(
    db,
    sql`
      SELECT
        c.id,
        c.email,
        c.phone,
        c.full_name,
        c.is_banned,
        c.ban_reason,
        c.banned_at,
        c.fraud_flag,
        c.fraud_reason,
        COUNT(DISTINCT o.id)::text as total_orders,
        COALESCE(SUM(o.total_minor), 0)::text as total_spent_minor,
        c.created_at,
        c.updated_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.deleted_at IS NULL
      WHERE c.id = ${customerId} AND c.deleted_at IS NULL
      GROUP BY c.id
    `,
  )

  if (!result.rows[0]) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    full_name: row.full_name,
    is_banned: row.is_banned,
    ban_reason: row.ban_reason,
    banned_at: row.banned_at,
    fraud_flag: row.fraud_flag,
    fraud_reason: row.fraud_reason,
    total_orders: parseInt(row.total_orders, 10),
    total_spent_minor: parseInt(row.total_spent_minor, 10),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function listCustomers(
  db: Database,
  filters: {
    search?: string
    isBanned?: boolean
    fraudFlag?: boolean
    limit?: number
    offset?: number
  } = {},
): Promise<{ customers: CustomerDetail[]; total: number }> {
  const limit = filters.limit || 20
  const offset = filters.offset || 0

  // Build dynamic query based on filters
  const whereConditions: string[] = ['c.deleted_at IS NULL']
  const queryParams: (string | boolean | number)[] = []

  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    const paramIdx1 = queryParams.length + 1
    const paramIdx2 = queryParams.length + 2
    whereConditions.push(
      `(c.email ILIKE $${String(paramIdx1)} OR c.full_name ILIKE $${String(paramIdx2)})`,
    )
    queryParams.push(searchTerm, searchTerm)
  }

  if (filters.isBanned !== undefined) {
    const paramIdx = queryParams.length + 1
    whereConditions.push(`c.is_banned = $${String(paramIdx)}`)
    queryParams.push(filters.isBanned)
  }

  if (filters.fraudFlag !== undefined) {
    const paramIdx = queryParams.length + 1
    whereConditions.push(`c.fraud_flag = $${String(paramIdx)}`)
    queryParams.push(filters.fraudFlag)
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`
  const limitParamIdx = queryParams.length + 1
  const offsetParamIdx = queryParams.length + 2

  const result = await query<
    CustomerDetail & { total_orders: string; total_spent_minor: string; total: string }
  >(db, {
    text: `
        SELECT
          c.id,
          c.email,
          c.phone,
          c.full_name,
          c.is_banned,
          c.ban_reason,
          c.banned_at,
          c.fraud_flag,
          c.fraud_reason,
          COUNT(DISTINCT o.id)::text as total_orders,
          COALESCE(SUM(o.total_minor), 0)::text as total_spent_minor,
          c.created_at,
          c.updated_at,
          COUNT(*) OVER()::text as total
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.deleted_at IS NULL
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $${String(limitParamIdx)} OFFSET $${String(offsetParamIdx)}
      `,
    values: [...queryParams, limit, offset],
  })

  const customers: CustomerDetail[] = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    phone: row.phone,
    full_name: row.full_name,
    is_banned: row.is_banned,
    ban_reason: row.ban_reason,
    banned_at: row.banned_at,
    fraud_flag: row.fraud_flag,
    fraud_reason: row.fraud_reason,
    total_orders: parseInt(row.total_orders, 10),
    total_spent_minor: parseInt(row.total_spent_minor, 10),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  const total = result.rows[0] ? parseInt(result.rows[0].total, 10) : 0

  return { customers, total }
}
