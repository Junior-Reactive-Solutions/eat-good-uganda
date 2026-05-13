import type { OrderStatus } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export interface BakeryMetrics {
  totalSalesMinor: number
  totalOrdersCount: number
  ordersByStatus: Array<{
    status: OrderStatus
    count: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    unitsSold: number
    totalRevenueMinor: number
  }>
  revenueByDay: Array<{
    date: string
    revenueMinor: number
    orderCount: number
  }>
}

/**
 * Get bakery metrics for current month
 * Includes: total sales, order counts by status, top products, daily revenue
 * All amounts in minor currency units (e.g., UGX for Uganda)
 */
export async function getBakeryMetrics(
  db: Database,
  bakeryId: string,
): Promise<BakeryMetrics> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Total sales this month (excludes cancelled orders)
  const totalSalesResult = await query<{ total: number }>(
    db,
    sql`SELECT COALESCE(SUM(total_minor), 0)::integer as total FROM orders
        WHERE bakery_id = ${bakeryId}
          AND created_at >= ${monthStart.toISOString()}
          AND created_at <= ${monthEnd.toISOString()}
          AND status != 'cancelled'`,
  )
  const totalSalesMinor = totalSalesResult.rows[0]?.total ?? 0

  // Total orders this month (includes all statuses including cancelled for count)
  const totalOrdersResult = await query<{ count: number }>(
    db,
    sql`SELECT COUNT(*)::integer as count FROM orders
        WHERE bakery_id = ${bakeryId}
          AND created_at >= ${monthStart.toISOString()}
          AND created_at <= ${monthEnd.toISOString()}`,
  )
  const totalOrdersCount = totalOrdersResult.rows[0]?.count ?? 0

  // Orders by status this month
  const statusResult = await query<{ status: OrderStatus; count: number }>(
    db,
    sql`SELECT status, COUNT(*)::integer as count FROM orders
        WHERE bakery_id = ${bakeryId}
          AND created_at >= ${monthStart.toISOString()}
          AND created_at <= ${monthEnd.toISOString()}
        GROUP BY status
        ORDER BY count DESC`,
  )

  // Top products this month (top 10 by revenue)
  const topProductsResult = await query<{
    productId: string
    productName: string
    unitsSold: number
    totalRevenueMinor: number
  }>(
    db,
    sql`SELECT
          p.id as "productId",
          p.name as "productName",
          SUM(oi.quantity)::integer as "unitsSold",
          SUM((oi.unit_price_minor::bigint * oi.quantity))::integer as "totalRevenueMinor"
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE p.bakery_id = ${bakeryId}
          AND o.created_at >= ${monthStart.toISOString()}
          AND o.created_at <= ${monthEnd.toISOString()}
          AND o.status != 'cancelled'
        GROUP BY p.id, p.name
        ORDER BY "totalRevenueMinor" DESC
        LIMIT 10`,
  )

  // Daily revenue this month
  const revenueByDayResult = await query<{
    date: string
    revenueMinor: number
    orderCount: number
  }>(
    db,
    sql`SELECT
          DATE(created_at)::text as date,
          COALESCE(SUM(total_minor), 0)::integer as "revenueMinor",
          COUNT(*)::integer as "orderCount"
        FROM orders
        WHERE bakery_id = ${bakeryId}
          AND created_at >= ${monthStart.toISOString()}
          AND created_at <= ${monthEnd.toISOString()}
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
  )

  return {
    totalSalesMinor,
    totalOrdersCount,
    ordersByStatus: statusResult.rows,
    topProducts: topProductsResult.rows,
    revenueByDay: revenueByDayResult.rows,
  }
}
