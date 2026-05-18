import type { Database } from '../client'
import { query } from '../client'
import { sql } from '../sql'

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  bakery_id?: string
  resource_type?: string
  resource_id?: string
  changes?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

const AUDIT_LOG_COLS = sql`
  id, admin_id, action, bakery_id, resource_type, resource_id,
  changes, ip_address, user_agent, created_at
`

export async function createAuditLog(
  db: Database,
  data: {
    adminId: string
    action: string
    bakeryId?: string
    resourceType?: string
    resourceId?: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  },
): Promise<AuditLog> {
  const result = await query<AuditLog>(
    db,
    sql`
      INSERT INTO audit_logs
        (admin_id, action, bakery_id, resource_type, resource_id, changes, ip_address, user_agent, created_at)
      VALUES
        (${data.adminId}, ${data.action}, ${data.bakeryId ?? null}, ${data.resourceType ?? null}, ${data.resourceId ?? null}, ${data.changes ? JSON.stringify(data.changes) : null}, ${data.ipAddress ?? null}, ${data.userAgent ?? null}, now())
      RETURNING ${AUDIT_LOG_COLS}
    `,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to create audit log')
  }
  return row
}

export async function getAuditLogs(
  db: Database,
  filters: {
    adminId?: string
    action?: string
    bakeryId?: string
    resourceType?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {},
): Promise<{ logs: AuditLog[]; total: number }> {
  const limit = Math.min(filters.limit || 100, 1000)
  const offset = filters.offset || 0

  // Build the WHERE clause dynamically
  const whereClauses: string[] = []
  const values: unknown[] = []

  if (filters.adminId) {
    whereClauses.push(`admin_id = $${String(values.length + 1)}`)
    values.push(filters.adminId)
  }
  if (filters.action) {
    whereClauses.push(`action = $${String(values.length + 1)}`)
    values.push(filters.action)
  }
  if (filters.bakeryId) {
    whereClauses.push(`bakery_id = $${String(values.length + 1)}`)
    values.push(filters.bakeryId)
  }
  if (filters.resourceType) {
    whereClauses.push(`resource_type = $${String(values.length + 1)}`)
    values.push(filters.resourceType)
  }
  if (filters.startDate) {
    whereClauses.push(`created_at >= $${String(values.length + 1)}`)
    values.push(filters.startDate.toISOString())
  }
  if (filters.endDate) {
    whereClauses.push(`created_at <= $${String(values.length + 1)}`)
    values.push(filters.endDate.toISOString())
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const sqlQuery = `
    SELECT
      id, admin_id, action, bakery_id, resource_type, resource_id,
      changes, ip_address, user_agent, created_at,
      COUNT(*) OVER() as total
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${String(limit)} OFFSET ${String(offset)}
  `

  const result = await db.query<AuditLog & { total: string }>(sqlQuery, values)

  if (result.rows.length === 0) {
    return { logs: [], total: 0 }
  }

  const firstRow = result.rows[0]
  const totalCount = firstRow ? parseInt(firstRow.total, 10) : 0

  const logs = result.rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { total, ...logWithoutTotal } = row
    return logWithoutTotal
  })

  return {
    logs,
    total: totalCount,
  }
}
