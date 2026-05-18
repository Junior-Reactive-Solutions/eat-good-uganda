import type { Database } from '../client'

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
  const { rows } = await db.query<{
    total_bakeries: string
    active_bakeries: string
    total_customers: string
    total_orders: string
    total_revenue_minor: string
    pending_approval: string
  }>(
    `
    SELECT
      COUNT(DISTINCT b.id)::text as total_bakeries,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::text as active_bakeries,
      COUNT(DISTINCT c.id)::text as total_customers,
      COUNT(DISTINCT o.id)::text as total_orders,
      COALESCE(SUM(o.total_amount_minor), 0)::text as total_revenue_minor,
      COUNT(DISTINCT CASE WHEN b.status = 'pending_approval' THEN b.id END)::text as pending_approval
    FROM bakeries b
    LEFT JOIN customers c ON c.deleted_at IS NULL
    LEFT JOIN orders o ON o.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
    `,
  )

  const row = rows[0]
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
    totalBakeries: parseInt(row.total_bakeries, 10),
    activeBakeries: parseInt(row.active_bakeries, 10),
    totalCustomers: parseInt(row.total_customers, 10),
    totalOrders: parseInt(row.total_orders, 10),
    totalRevenueMinor: parseInt(row.total_revenue_minor, 10),
    pendingApprovalCount: parseInt(row.pending_approval, 10),
  }
}

export async function getAdminBakeryAnalytics(
  db: Database,
  bakeryId: string,
): Promise<BakeryAnalytics> {
  // Get bakery info and order metrics
  const { rows: bakeryRows } = await db.query<{
    id: string
    display_name: string
    orders_count: string
    total_revenue_minor: string
    customers_count: string
  }>(
    `
    SELECT
      b.id,
      b.display_name,
      COUNT(DISTINCT o.id)::text as orders_count,
      COALESCE(SUM(o.total_amount_minor), 0)::text as total_revenue_minor,
      COUNT(DISTINCT o.customer_id)::text as customers_count
    FROM bakeries b
    LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
    WHERE b.id = $1 AND b.deleted_at IS NULL
    GROUP BY b.id, b.display_name
    `,
    [bakeryId],
  )

  if (bakeryRows.length === 0) {
    return {
      bakeryId,
      bakeryName: '',
      ordersCount: 0,
      revenueMinor: 0,
      customersCount: 0,
      topProducts: [],
    }
  }

  const bakeryRow = bakeryRows[0]
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
  const { rows: productRows } = await db.query<{
    id: string
    name: string
    order_count: string
  }>(
    `
    SELECT
      p.id,
      p.name,
      COUNT(oi.id)::text as order_count
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id AND oi.deleted_at IS NULL
    LEFT JOIN orders o ON o.id = oi.order_id AND o.deleted_at IS NULL
    WHERE p.bakery_id = $1 AND p.deleted_at IS NULL
    GROUP BY p.id, p.name
    ORDER BY order_count DESC
    LIMIT 5
    `,
    [bakeryId],
  )

  return {
    bakeryId,
    bakeryName: bakeryRow.display_name,
    ordersCount: parseInt(bakeryRow.orders_count, 10),
    revenueMinor: parseInt(bakeryRow.total_revenue_minor, 10),
    customersCount: parseInt(bakeryRow.customers_count, 10),
    topProducts: productRows.map((row) => ({
      id: row.id,
      name: row.name,
      orderCount: parseInt(row.order_count, 10),
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

  let selectClause = ''
  if (metric === 'revenue') {
    selectClause = 'COALESCE(SUM(o.total_amount_minor), 0) as value'
  } else if (metric === 'orders') {
    selectClause = 'COUNT(DISTINCT o.id) as value'
  } else {
    selectClause = 'COUNT(DISTINCT o.customer_id) as value'
  }

  let dateFormat = "'YYYY-MM-DD'"
  if (groupBy === 'week') {
    dateFormat = '\'YYYY-"W"IW\''
  } else if (groupBy === 'month') {
    dateFormat = "'YYYY-MM'"
  }

  const { rows } = await db.query<{
    date: string
    value: string
  }>(
    `
    SELECT
      TO_CHAR(o.created_at, ${dateFormat}) as date,
      ${selectClause}
    FROM orders o
    WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.deleted_at IS NULL
    GROUP BY TO_CHAR(o.created_at, ${dateFormat})
    ORDER BY date ASC
    `,
    [startDate, endDate],
  )

  return rows.map((row) => ({
    date: row.date,
    value: parseInt(row.value, 10),
  }))
}

export async function getAdminTopBakeries(
  db: Database,
  options: {
    metric: 'revenue' | 'orders' | 'customers'
    limit: number
  },
): Promise<TopBakery[]> {
  const { metric, limit } = options

  let selectClause = ''
  if (metric === 'revenue') {
    selectClause = 'COALESCE(SUM(o.total_amount_minor), 0) as value'
  } else if (metric === 'orders') {
    selectClause = 'COUNT(DISTINCT o.id) as value'
  } else {
    selectClause = 'COUNT(DISTINCT o.customer_id) as value'
  }

  const { rows } = await db.query<{
    id: string
    name: string
    value: string
  }>(
    `
    SELECT
      b.id,
      b.display_name as name,
      ${selectClause}
    FROM bakeries b
    LEFT JOIN orders o ON o.bakery_id = b.id AND o.deleted_at IS NULL
    WHERE b.deleted_at IS NULL AND b.status = 'active'
    GROUP BY b.id, b.display_name
    ORDER BY value DESC
    LIMIT $1
    `,
    [limit],
  )

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: parseInt(row.value, 10),
  }))
}
