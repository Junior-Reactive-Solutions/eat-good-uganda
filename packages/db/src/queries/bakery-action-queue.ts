import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export interface ActionQueueOrder {
  id: string
  orderNumber: string
  createdAt: string
  totalMinor: number
  waitMinutes: number
}

export interface ActionQueueDueOrder {
  id: string
  orderNumber: string
  scheduledFor: string
  fulfilmentMode: 'pickup' | 'delivery'
}

export interface ActionQueueProduct {
  id: string
  name: string
}

export interface BakeryActionQueue {
  /** Orders awaiting payment confirmation, oldest first. */
  unconfirmedOrders: ActionQueueOrder[]
  /** Confirmed/preparing orders scheduled within the next 3 hours. */
  dueSoonOrders: ActionQueueDueOrder[]
  /** Published, available products with no enabled payment method to sell through
   * are still listed — this instead flags products marked unavailable. */
  outOfStockProducts: ActionQueueProduct[]
  /** True if the bakery has at least one enabled, verified payment credential. */
  hasEnabledPaymentMethod: boolean
}

/**
 * Everything a bakery operator needs to act on right now, in one call.
 * Backs the "Needs you now" queue on the Bakery Admin dashboard.
 */
export async function getBakeryActionQueue(
  db: Database,
  bakeryId: string,
): Promise<BakeryActionQueue> {
  const unconfirmedResult = await query<{
    id: string
    order_number: string
    created_at: string
    total_minor: number
    wait_minutes: number
  }>(
    db,
    sql`SELECT
          id, order_number, created_at, total_minor,
          EXTRACT(EPOCH FROM (now() - created_at))::integer / 60 AS wait_minutes
        FROM orders
        WHERE bakery_id = ${bakeryId}
          AND status = 'pending_payment'
        ORDER BY created_at ASC
        LIMIT 20`,
  )

  const dueSoonResult = await query<{
    id: string
    order_number: string
    scheduled_for: string
    fulfilment_mode: 'pickup' | 'delivery'
  }>(
    db,
    sql`SELECT id, order_number, scheduled_for, fulfilment_mode
        FROM orders
        WHERE bakery_id = ${bakeryId}
          AND status IN ('confirmed', 'preparing')
          AND scheduled_for IS NOT NULL
          AND scheduled_for <= now() + interval '3 hours'
        ORDER BY scheduled_for ASC
        LIMIT 20`,
  )

  const outOfStockResult = await query<{ id: string; name: string }>(
    db,
    sql`SELECT id, name
        FROM products
        WHERE bakery_id = ${bakeryId}
          AND deleted_at IS NULL
          AND is_published = true
          AND is_available = false
        ORDER BY updated_at DESC
        LIMIT 20`,
  )

  const paymentResult = await query<{ count: number }>(
    db,
    sql`SELECT COUNT(*)::integer AS count
        FROM bakery_payment_credentials
        WHERE bakery_id = ${bakeryId}
          AND is_enabled = true`,
  )

  return {
    unconfirmedOrders: unconfirmedResult.rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      createdAt: r.created_at,
      totalMinor: r.total_minor,
      waitMinutes: r.wait_minutes,
    })),
    dueSoonOrders: dueSoonResult.rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      scheduledFor: r.scheduled_for,
      fulfilmentMode: r.fulfilment_mode,
    })),
    outOfStockProducts: outOfStockResult.rows,
    hasEnabledPaymentMethod: (paymentResult.rows[0]?.count ?? 0) > 0,
  }
}
