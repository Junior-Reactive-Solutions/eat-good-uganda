import {
  getOrderById,
  listOrdersForBakery,
  pool,
  updateOrderStatus,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod/v4'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

export const bakeryOrdersRouter = createRouter() as Router

const ORDER_STATUS_VALUES = [
  'pending_payment',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const

const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
})

/**
 * GET /
 * List orders for the authenticated bakery
 */
bakeryOrdersRouter.get(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    const bakeryId = req.bakery?.id
    if (!bakeryId) return res.status(401).json({ error: 'Unauthorized' })

    const parsed = listOrdersQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues })
    }

    const { limit, offset, status, date_from, date_to } = parsed.data

    try {
      // Fetch raw orders from DB
      let orders = await listOrdersForBakery(pool, bakeryId, limit + 1, offset)

      // Client-side status filter (DB function doesn't support it; no new query needed)
      if (status) {
        orders = orders.filter((o) => o.status === status)
      }

      // Date range filter
      if (date_from) {
        const from = new Date(date_from)
        orders = orders.filter((o) => o.created_at >= from)
      }
      if (date_to) {
        const to = new Date(date_to)
        to.setHours(23, 59, 59, 999)
        orders = orders.filter((o) => o.created_at <= to)
      }

      const hasMore = orders.length > limit
      if (hasMore) orders.pop()

      // Fetch customer names for customer orders
      const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))]
      const customerMap: Record<string, { full_name: string; email: string; phone: string | null }> = {}
      if (customerIds.length > 0) {
        const ids = customerIds as string[]
        const placeholders = ids.map((_, i) => `$${String(i + 1)}`).join(',')
        const result = await pool.query<{ id: string; full_name: string; email: string; phone: string | null }>(
          `SELECT id, full_name, email, phone FROM customers WHERE id IN (${placeholders})`,
          ids,
        )
        for (const row of result.rows) {
          customerMap[row.id] = { full_name: row.full_name, email: row.email, phone: row.phone }
        }
      }

      // Fetch payment methods
      const orderIds = orders.map((o) => o.id)
      const paymentMap: Record<string, string> = {}
      if (orderIds.length > 0) {
        const placeholders = orderIds.map((_, i) => `$${String(i + 1)}`).join(',')
        const result = await pool.query<{ order_id: string; method: string }>(
          `SELECT DISTINCT ON (order_id) order_id, method FROM payments WHERE order_id IN (${placeholders}) ORDER BY order_id, created_at DESC`,
          orderIds,
        )
        for (const row of result.rows) {
          paymentMap[row.order_id] = row.method
        }
      }

      const items = orders.map((o) => {
        const customer = o.customer_id ? customerMap[o.customer_id] : null
        return {
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          subtotal_minor: o.subtotal_minor,
          delivery_fee_minor: o.delivery_fee_minor,
          total_minor: o.total_minor,
          fulfilment_mode: o.fulfilment_mode,
          created_at: o.created_at,
          customer_name: customer?.full_name ?? o.guest_name ?? null,
          customer_email: customer?.email ?? o.guest_email ?? '',
          customer_phone: customer?.phone ?? o.guest_phone ?? null,
          payment_method: paymentMap[o.id] ?? 'cash_on_delivery',
        }
      })

      res.json({ items, total: items.length + offset + (hasMore ? 1 : 0), offset, limit })
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to list orders')
      res.status(500).json({ error: 'Failed to list orders' })
    }
  },
)

/**
 * GET /:orderId
 * Get order detail including line items
 */
bakeryOrdersRouter.get(
  '/:orderId',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    const bakeryId = req.bakery?.id
    if (!bakeryId) return res.status(401).json({ error: 'Unauthorized' })
    const { orderId } = req.params as { orderId: string }

    try {
      const order = await getOrderById(pool, bakeryId, orderId)
      if (!order) return res.status(404).json({ error: 'Order not found' })

      // Fetch customer info
      let customerName: string | null = order.guest_name ?? null
      let customerEmail: string = order.guest_email ?? ''
      let customerPhone: string | null = order.guest_phone ?? null
      if (order.customer_id) {
        const cResult = await pool.query<{ full_name: string; email: string; phone: string | null }>(
          'SELECT full_name, email, phone FROM customers WHERE id = $1',
          [order.customer_id],
        )
        if (cResult.rows[0]) {
          customerName = cResult.rows[0].full_name
          customerEmail = cResult.rows[0].email
          customerPhone = cResult.rows[0].phone
        }
      }

      // Fetch payment method
      const pResult = await pool.query<{ method: string }>(
        'SELECT method FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
        [order.id],
      )
      const paymentMethod = pResult.rows[0]?.method ?? 'cash_on_delivery'

      // Fetch order items
      const itemsResult = await pool.query<{
        product_id: string
        product_name: string
        variant_id: string | null
        variant_name: string | null
        unit_price_minor: number
        quantity: number
        line_total_minor: number
      }>(
        `SELECT product_id, product_name, variant_id, variant_name,
                unit_price_minor, quantity, line_total_minor
         FROM order_items
         WHERE order_id = $1 AND bakery_id = $2`,
        [order.id, bakeryId],
      )

      res.json({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        subtotal_minor: order.subtotal_minor,
        delivery_fee_minor: order.delivery_fee_minor,
        total_minor: order.total_minor,
        fulfilment_mode: order.fulfilment_mode,
        created_at: order.created_at,
        scheduled_for: order.scheduled_for,
        delivery_address: order.delivery_address,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        items: itemsResult.rows,
      })
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to get order detail')
      res.status(500).json({ error: 'Failed to get order' })
    }
  },
)

/**
 * PATCH /:orderId
 * Update order status (with transition validation)
 */
bakeryOrdersRouter.patch(
  '/:orderId',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    const bakeryId = req.bakery?.id
    if (!bakeryId) return res.status(401).json({ error: 'Unauthorized' })
    const { orderId } = req.params as { orderId: string }

    const parsed = updateStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues })
    }

    try {
      const updated = await updateOrderStatus(pool, bakeryId, orderId, parsed.data.status)
      if (!updated) return res.status(404).json({ error: 'Order not found' })

      res.json({ id: updated.id, status: updated.status, updated_at: updated.updated_at })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.startsWith('Invalid status transition')) {
        return res.status(422).json({ error: msg })
      }
      logger.error({ error: msg }, 'Failed to update order status')
      res.status(500).json({ error: 'Failed to update order' })
    }
  },
)
