import type { Database } from '../client'
import { query } from '../client'
import { sql } from '../sql'

export interface AuditLog {
  id: string
  actor_type: 'customer' | 'bakery_user' | 'super_admin' | 'system' | 'webhook'
  actor_id?: string
  bakery_id?: string
  action: string
  target_type?: string
  target_id?: string
  payload?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

const AUDIT_LOG_COLS = sql`
  id, actor_type, actor_id, bakery_id, action, target_type, target_id,
  payload, ip_address, user_agent, created_at
`

export async function createAuditLog(
  db: Database,
  data: {
    actorType: 'customer' | 'bakery_user' | 'super_admin' | 'system' | 'webhook'
    actorId?: string
    bakeryId?: string
    action: string
    targetType?: string
    targetId?: string
    payload?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  },
): Promise<AuditLog> {
  const result = await query<AuditLog>(
    db,
    sql`
      INSERT INTO audit_log
        (actor_type, actor_id, bakery_id, action, target_type, target_id, payload, ip_address, user_agent, created_at)
      VALUES
        (${data.actorType}, ${data.actorId ?? null}, ${data.bakeryId ?? null}, ${data.action}, ${data.targetType ?? null}, ${data.targetId ?? null}, ${data.payload ? JSON.stringify(data.payload) : null}, ${data.ipAddress ?? null}, ${data.userAgent ?? null}, now())
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
    actorId?: string
    actorType?: string
    action?: string
    bakeryId?: string
    targetType?: string
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

  if (filters.actorId) {
    whereClauses.push(`actor_id = $${String(values.length + 1)}`)
    values.push(filters.actorId)
  }
  if (filters.actorType) {
    whereClauses.push(`actor_type = $${String(values.length + 1)}`)
    values.push(filters.actorType)
  }
  if (filters.action) {
    whereClauses.push(`action = $${String(values.length + 1)}`)
    values.push(filters.action)
  }
  if (filters.bakeryId) {
    whereClauses.push(`bakery_id = $${String(values.length + 1)}`)
    values.push(filters.bakeryId)
  }
  if (filters.targetType) {
    whereClauses.push(`target_type = $${String(values.length + 1)}`)
    values.push(filters.targetType)
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
      id, actor_type, actor_id, bakery_id, action, target_type, target_id,
      payload, ip_address, user_agent, created_at,
      COUNT(*) OVER() as total
    FROM audit_log
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
