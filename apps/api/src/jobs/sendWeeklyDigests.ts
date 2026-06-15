import { getBakeryById, listActiveBakeries, query, sql, type Database } from '@eatgood/db'

import { logger } from '../lib/logger'
import { sendTransactionalEmail } from '../services/email/resend'

/**
 * Summary of weekly digest sending operations.
 */
export interface WeeklyDigestSummary {
  bakeriesProcessed: number
  digestsSent: number
  digestsFailed: number
}

/**
 * A bakery's weekly sales metrics.
 */
export interface WeeklyMetrics {
  bakeryId: string
  displayName: string
  email: string
  timezone: string
  ordersCount: number
  totalRevenueMinor: number
  currencyCode: string
  topProductName: string | null
  topProductCount: number
}

/**
 * Get weekly sales metrics for a bakery.
 *
 * Scoped strictly to the bakery_id to prevent cross-tenant leaks.
 * Fetches: total orders, total revenue, and the top-selling product
 * for the past 7 days.
 */
async function getWeeklyMetrics(
  db: Database,
  bakeryId: string,
): Promise<WeeklyMetrics | null> {
  const bakery = await getBakeryById(db, bakeryId)
  if (!bakery) {
    return null
  }

  // Get weekly order and revenue metrics
  const metricsResult = await query<{
    orders_count: number
    total_revenue_minor: number
    currency_code: string
  }>(
    db,
    sql`SELECT
          COUNT(DISTINCT o.id) AS orders_count,
          COALESCE(SUM(p.amount_minor), 0)::integer AS total_revenue_minor,
          'UGX' AS currency_code
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id AND p.bakery_id = ${bakeryId}
        WHERE o.bakery_id = ${bakeryId}
          AND o.created_at >= now() - interval '7 days'
          AND o.created_at < now()`,
  )

  const metrics = metricsResult.rows[0]
  if (!metrics) {
    return null
  }

  // Get top product by order count in the past week
  const topProductResult = await query<{
    product_name: string
    product_count: number
  }>(
    db,
    sql`SELECT
          p.name AS product_name,
          COUNT(*)::integer AS product_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.bakery_id = ${bakeryId}
          AND o.created_at >= now() - interval '7 days'
          AND o.created_at < now()
        GROUP BY p.name
        ORDER BY product_count DESC
        LIMIT 1`,
  )

  const topProduct = topProductResult.rows[0]

  return {
    bakeryId,
    displayName: bakery.display_name,
    email: bakery.email,
    timezone: bakery.timezone || 'Africa/Kampala',
    ordersCount: metrics.orders_count,
    totalRevenueMinor: metrics.total_revenue_minor,
    currencyCode: metrics.currency_code,
    topProductName: topProduct?.product_name ?? null,
    topProductCount: topProduct?.product_count ?? 0,
  }
}

/**
 * Format currency from minor units (cents) to major units.
 */
function formatCurrency(minorAmount: number, currencyCode: string): string {
  const majorAmount = minorAmount / 100
  return `${currencyCode} ${majorAmount.toFixed(2)}`
}

/**
 * Generate HTML email content for the weekly digest.
 */
function generateDigestHtml(metrics: WeeklyMetrics): string {
  const { displayName, ordersCount, totalRevenueMinor, currencyCode, topProductName, topProductCount } =
    metrics

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Digest - ${displayName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .metric { margin: 15px 0; }
    .metric-label { color: #666; font-size: 14px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; }
    .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly Digest for ${displayName}</h1>
      <p>Your sales summary for the past 7 days</p>
    </div>

    <div class="metric">
      <div class="metric-label">Total Orders</div>
      <div class="metric-value">${ordersCount}</div>
    </div>

    <div class="metric">
      <div class="metric-label">Total Revenue</div>
      <div class="metric-value">${formatCurrency(totalRevenueMinor, currencyCode)}</div>
    </div>

    ${
      topProductName
        ? `
    <div class="metric">
      <div class="metric-label">Top Product</div>
      <div class="metric-value">${topProductName}</div>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${topProductCount} order(s)</p>
    </div>
    `
        : ''
    }

    <div class="footer">
      <p>This is an automated digest. Do not reply to this email.</p>
      <p>Next digest: next Sunday at 9:00 AM ${metrics.timezone}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send weekly sales digest emails to all active bakeries.
 *
 * Runs every Sunday at 9:00 AM Africa/Kampala timezone.
 *
 * For each active bakery:
 * 1. Fetch their weekly metrics (orders, revenue, top product)
 * 2. Generate HTML digest email
 * 3. Send via Resend
 * 4. Log success/failure (never logs PII or credentials)
 *
 * Per-bakery errors are caught and counted so one failure doesn't abort
 * the whole run. A fatal error (e.g. SELECT all bakeries throws) propagates
 * to the cron wrapper in `start-jobs.ts`.
 */
export async function sendWeeklyDigests(db: Database): Promise<WeeklyDigestSummary> {
  const summary: WeeklyDigestSummary = {
    bakeriesProcessed: 0,
    digestsSent: 0,
    digestsFailed: 0,
  }

  // Fetch all active bakeries
  const bakeries = await listActiveBakeries(db)
  summary.bakeriesProcessed = bakeries.length

  // Process each bakery
  for (const bakery of bakeries) {
    try {
      const metrics = await getWeeklyMetrics(db, bakery.id)
      if (!metrics) {
        logger.warn(
          { bakeryId: bakery.id },
          'sendWeeklyDigests: failed to fetch metrics for bakery',
        )
        summary.digestsFailed += 1
        continue
      }

      // Generate HTML and send email
      const html = generateDigestHtml(metrics)
      await sendTransactionalEmail({
        to: metrics.email,
        subject: `Weekly Digest - ${metrics.displayName}`,
        html,
      })

      summary.digestsSent += 1
      logger.info(
        { bakeryId: bakery.id, bakeryName: metrics.displayName },
        'sendWeeklyDigests: digest sent',
      )
    } catch (error) {
      summary.digestsFailed += 1
      logger.error(
        {
          bakeryId: bakery.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'sendWeeklyDigests: failed to send digest',
      )
    }
  }

  // Log summary for operations monitoring
  logger.info(
    {
      bakeriesProcessed: summary.bakeriesProcessed,
      digestsSent: summary.digestsSent,
      digestsFailed: summary.digestsFailed,
    },
    'sendWeeklyDigests: weekly digest run complete',
  )

  return summary
}
