import { query } from '../../client'
import type { Database } from '../../client'
import { sql } from '../../sql'

export interface DashboardMetrics {
  totalBakeries: number
  totalActiveBakeries: number
  totalCustomers: number
  totalOrdersThisMonth: number
  totalRevenueThisMonth: number
  totalRevenuePreviousMonth: number
}

export async function adminGetDashboardMetrics(db: Database): Promise<DashboardMetrics> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // Get all metrics in parallel
  const [
    bakeriesResult,
    activebakeriesResult,
    customersResult,
    ordersResult,
    revenueResult,
    prevRevenueResult,
  ] = await Promise.all([
    query<{ count: bigint }>(
      db,
      sql`SELECT COUNT(*) as count FROM bakeries WHERE deleted_at IS NULL`,
    ),
    query<{ count: bigint }>(
      db,
      sql`SELECT COUNT(*) as count FROM bakeries WHERE status = 'active' AND deleted_at IS NULL`,
    ),
    query<{ count: bigint }>(
      db,
      sql`SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL`,
    ),
    query<{ count: bigint }>(
      db,
      sql`SELECT COUNT(*) as count FROM orders
            WHERE created_at >= ${monthStart.toISOString()}
            AND created_at <= ${monthEnd.toISOString()}`,
    ),
    query<{ total: bigint }>(
      db,
      sql`SELECT COALESCE(SUM(total_minor), 0) as total FROM orders
            WHERE created_at >= ${monthStart.toISOString()}
            AND created_at <= ${monthEnd.toISOString()}
            AND status NOT IN ('cancelled', 'refunded')`,
    ),
    query<{ total: bigint }>(
      db,
      sql`SELECT COALESCE(SUM(total_minor), 0) as total FROM orders
            WHERE created_at >= ${prevMonthStart.toISOString()}
            AND created_at <= ${prevMonthEnd.toISOString()}
            AND status NOT IN ('cancelled', 'refunded')`,
    ),
  ])

  return {
    totalBakeries: Number(bakeriesResult.rows[0]?.count ?? 0),
    totalActiveBakeries: Number(activebakeriesResult.rows[0]?.count ?? 0),
    totalCustomers: Number(customersResult.rows[0]?.count ?? 0),
    totalOrdersThisMonth: Number(ordersResult.rows[0]?.count ?? 0),
    totalRevenueThisMonth: Number(revenueResult.rows[0]?.total ?? 0),
    totalRevenuePreviousMonth: Number(prevRevenueResult.rows[0]?.total ?? 0),
  }
}
