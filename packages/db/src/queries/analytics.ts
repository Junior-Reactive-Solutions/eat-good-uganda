import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export interface PlatformMetrics {
  totalBakeries: number
  activeBakeries: number
  totalCustomers: number
  totalOrders: number
  totalRevenueMinor: number
  pendingApprovalCount: number
}

export interface BakeryAnalytics {
  bakeryId: string
  bakeryName: string
  ordersCount: number
  revenueMinor: number
  customersCount: number
  topProducts: Array<{
    id: string
    name: string
    orderCount: number
  }>
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface TopBakery {
  id: string
  name: string
  value: number
}

export async function getAdminPlatformMetrics(db: Database): Promise<PlatformMetrics> {
  const result = await query<{
    total_bakeries: number
    active_bakeries: number
    total_customers: number
    total_orders: number
    total_revenue_minor: number
    pending_approval: number
  }>(
    db,
    sql`
      SELECT
        COUNT(DISTINCT b.id)::integer as total_bakeries,
        COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::integer as active_bakeries,
        COUNT(DISTINCT c.id)::integer as total_customers,
        COUNT(DISTINCT o.id)::integer as total_orders,
        COALESCE(SUM(o.total_minor), 0)::integer as total_revenue_minor,
        COUNT(DISTINCT CASE WHEN b.status = 'pending_approval' THEN b.id END)::integer as pending_approval
      FROM bakeries b
      LEFT JOIN customers c ON c.deleted_at IS NULL
      LEFT JOIN orders o ON o.deleted_at IS NULL
      WHERE b.deleted_at IS NULL
    `,
  )

  const row = result.rows[0]
  if (!row) {
    return {
      totalBakeries: 0,
      activeBakeries: 0,
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenueMinor: 0,
      pendingApprovalCount: 0,
    }
  }
  return {
    totalBakeries: row.total_bakeries,
    activeBakeries: row.active_bakeries,
    totalCustomers: row.total_customers,
    totalOrders: row.total_orders,
    totalRevenueMinor: row.total_revenue_minor,
    pendingApprovalCount: row.pending_approval,
  }
}

export async function getAdminBakeryAnalytics(
  db: Database,
  bakeryId: string,
): Promise<BakeryAnalytics> {
  // Get bakery info and order metrics
  const bakeryResult = await query<{
    id: string
    display_name: string
    orders_count: number
    total_revenue_minor: number
    customers_count: number
  }>(
    db,
    sql`
      SELECT
        b.id,
        b.display_name,
        COUNT(DISTINCT o.id)::integer as orders_count,
        COALESCE(SUM(o.total_minor), 0)::integer as total_revenue_minor,
        COUNT(DISTINCT o.customer_id)::integer as customers_count
      FROM bakeries b
      LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
      WHERE b.id = ${bakeryId} AND b.deleted_at IS NULL
      GROUP BY b.id, b.display_name
    `,
  )

  const bakeryRow = bakeryResult.rows[0]
  if (!bakeryRow) {
    return {
      bakeryId,
      bakeryName: '',
      ordersCount: 0,
      revenueMinor: 0,
      customersCount: 0,
      topProducts: [],
    }
  }

  // Get top products
  const productsResult = await query<{
    id: string
    name: string
    order_count: number
  }>(
    db,
    sql`
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT oi.id)::integer as order_count
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.deleted_at IS NULL
      WHERE p.bakery_id = ${bakeryId} AND p.deleted_at IS NULL
      GROUP BY p.id, p.name
      ORDER BY order_count DESC
      LIMIT 5
    `,
  )

  return {
    bakeryId,
    bakeryName: bakeryRow.display_name,
    ordersCount: bakeryRow.orders_count,
    revenueMinor: bakeryRow.total_revenue_minor,
    customersCount: bakeryRow.customers_count,
    topProducts: productsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      orderCount: row.order_count,
    })),
  }
}

export async function getAdminMetricsTimeSeries(
  db: Database,
  options: {
    startDate: Date
    endDate: Date
    metric: 'revenue' | 'orders' | 'customers'
    groupBy: 'day' | 'week' | 'month'
  },
): Promise<TimeSeriesPoint[]> {
  const { startDate, endDate, metric, groupBy } = options

  // Use separate queries for different metrics and groupBy combinations
  if (metric === 'revenue' && groupBy === 'day') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
          COALESCE(SUM(o.total_minor), 0)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'revenue' && groupBy === 'week') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW') as date,
          COALESCE(SUM(o.total_minor), 0)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'revenue' && groupBy === 'month') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM') as date,
          COALESCE(SUM(o.total_minor), 0)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'orders' && groupBy === 'day') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
          COUNT(DISTINCT o.id)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'orders' && groupBy === 'week') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW') as date,
          COUNT(DISTINCT o.id)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'orders' && groupBy === 'month') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM') as date,
          COUNT(DISTINCT o.id)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'customers' && groupBy === 'day') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
          COUNT(DISTINCT o.customer_id)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  if (metric === 'customers' && groupBy === 'week') {
    const result = await query<{
      date: string
      value: number
    }>(
      db,
      sql`
        SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW') as date,
          COUNT(DISTINCT o.customer_id)::integer as value
        FROM orders o
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.deleted_at IS NULL
        GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-"W"IW')
        ORDER BY date ASC
      `,
    )
    return result.rows
  }

  // metric === 'customers' && groupBy === 'month'
  const result = await query<{
    date: string
    value: number
  }>(
    db,
    sql`
      SELECT
        TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM') as date,
        COUNT(DISTINCT o.customer_id)::integer as value
      FROM orders o
      WHERE o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
        AND o.deleted_at IS NULL
      GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM')
      ORDER BY date ASC
    `,
  )
  return result.rows
}

export async function getAdminTopBakeries(
  db: Database,
  options: {
    metric: 'revenue' | 'orders' | 'customers'
    limit: number
  },
): Promise<TopBakery[]> {
  const { metric, limit } = options

  if (metric === 'revenue') {
    const result = await query<{
      id: string
      name: string
      value: number
    }>(
      db,
      sql`
        SELECT
          b.id,
          b.display_name as name,
          COALESCE(SUM(o.total_minor), 0)::integer as value
        FROM bakeries b
        LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
        WHERE b.deleted_at IS NULL AND b.status = 'active'
        GROUP BY b.id, b.display_name
        ORDER BY value DESC
        LIMIT ${limit}
      `,
    )
    return result.rows
  }

  if (metric === 'orders') {
    const result = await query<{
      id: string
      name: string
      value: number
    }>(
      db,
      sql`
        SELECT
          b.id,
          b.display_name as name,
          COUNT(DISTINCT o.id)::integer as value
        FROM bakeries b
        LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
        WHERE b.deleted_at IS NULL AND b.status = 'active'
        GROUP BY b.id, b.display_name
        ORDER BY value DESC
        LIMIT ${limit}
      `,
    )
    return result.rows
  }

  // metric === 'customers'
  const result = await query<{
    id: string
    name: string
    value: number
  }>(
    db,
    sql`
      SELECT
        b.id,
        b.display_name as name,
        COUNT(DISTINCT o.customer_id)::integer as value
      FROM bakeries b
      LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
      WHERE b.deleted_at IS NULL AND b.status = 'active'
      GROUP BY b.id, b.display_name
      ORDER BY value DESC
      LIMIT ${limit}
    `,
  )
  return result.rows
}
