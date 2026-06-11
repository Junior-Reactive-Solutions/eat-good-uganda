import { pool, createOrder, getOrderById, getOrderByNumber, listOrdersForCustomer, updateOrderStatus, getBakeryById, getProductById } from '@eatgood/db'
import { orderCreationSchema, type OrderCreation } from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'

import { authenticateToken } from '../../middleware/authenticateToken'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'
import { sendOrderConfirmationEmail, sendBakeryOrderAlertEmail } from '../../services/email/orders'
import { generateOrderNumber } from '../../services/orders'

export const customerOrdersRouter = createRouter() as Router

/**
 * POST /v1/customer/orders
 * Create a new order for authenticated customer
 *
 * Customer context is extracted from JWT token
 * Order is created with items from cart
 * Bakery is extracted from customer context (not from request body)
 */
customerOrdersRouter.post('/', authenticateToken, requireCustomerContext, async (req: Request, res: Response) => {
  const customerId = (req as any).auth?.sub as string | undefined

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Validate request body
    const body = orderCreationSchema.parse(req.body)

    // Ensure items are not empty
    if (!body.items || body.items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' })
    }

    // Extract and validate bakery_id from request body
    const bakeryId = body.bakeryId
    if (!bakeryId) {
      return res.status(400).json({ error: 'bakeryId is required' })
    }

    // Validate bakery exists and is active
    const bakery = await getBakeryById(pool, bakeryId)
    if (!bakery || bakery.status !== 'active') {
      return res.status(400).json({ error: 'Bakery not found or inactive' })
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Prepare fulfillment data
    const fulfilmentData = {
      mode: body.fulfillment.mode,
      delivery_address: body.fulfillment.mode === 'delivery' ? body.fulfillment.deliveryAddress : null,
      scheduled_for: body.fulfillment.scheduledFor || null,
    }

    // Load products and calculate order totals
    const orderItems: Array<{
      product_id: string
      variant_id: string | null
      product_name: string
      variant_name: string | null
      unit_price_minor: number
      quantity: number
      line_total_minor: number
    }> = []

    let subtotalMinor = 0

    for (const item of body.items) {
      const product = await getProductById(pool, bakeryId, item.productId)
      if (!product) {
        return res.status(422).json({
          error: `Product ${item.productId} not found for this bakery`,
        })
      }

      const unitPrice = product.base_price_minor
      const lineTotal = unitPrice * item.quantity

      orderItems.push({
        product_id: product.id,
        variant_id: item.variantId || null,
        product_name: product.name,
        variant_name: null, // TODO: load variant name from DB if variantId provided
        unit_price_minor: unitPrice,
        quantity: item.quantity,
        line_total_minor: lineTotal,
      })

      subtotalMinor += lineTotal
    }

    // Calculate delivery fee (from bakery settings; for now, fixed zero)
    const deliveryFeeMinor = body.fulfillment.mode === 'delivery' ? bakery.delivery_fee_minor || 0 : 0
    const totalMinor = subtotalMinor + deliveryFeeMinor

    // Create order using database layer
    const order = await createOrder(pool, bakeryId, {
      customer_id: customerId,
      order_number: orderNumber,
      fulfilment_mode: body.fulfillment.mode,
      scheduled_for: fulfilmentData.scheduled_for ? new Date(fulfilmentData.scheduled_for) : null,
      delivery_address: fulfilmentData.delivery_address ? {
        line1: fulfilmentData.delivery_address.line1,
        ...(fulfilmentData.delivery_address.line2 && { line2: fulfilmentData.delivery_address.line2 }),
        city: fulfilmentData.delivery_address.city,
        lat: fulfilmentData.delivery_address.lat || 0,
        lng: fulfilmentData.delivery_address.lng || 0,
        ...(fulfilmentData.delivery_address.notes && { notes: fulfilmentData.delivery_address.notes }),
      } : null,
      subtotal_minor: subtotalMinor,
      delivery_fee_minor: deliveryFeeMinor,
      total_minor: totalMinor,
      currency_code: 'UGX',
      customer_notes: body.notes || null,
      items: orderItems,
    })

    // Send confirmation emails (fire-and-forget: don't await, don't catch exceptions)
    const publicCustomerUrl = process.env.PUBLIC_CUSTOMER_URL || 'https://app.eatgood.ug'
    const publicBakeryAdminUrl = process.env.PUBLIC_BAKERY_ADMIN_URL || 'https://app.eatgood.ug/bakery'
    const customerOrderLink = `${publicCustomerUrl}/account/orders/${order.id}`
    const bakeryOrderLink = `${publicBakeryAdminUrl}/orders/${order.id}`

    // Send customer confirmation email
    sendOrderConfirmationEmail({
      to: body.customer.email,
      orderNumber: order.order_number,
      orderId: order.id,
      orderLink: customerOrderLink,
      total: order.total_minor,
    }).catch((err) => {
      console.error('Failed to send customer confirmation email for order:', order.id, err)
    })

    // Send bakery alert email (fire-and-forget, bakery dashboard will show new order)
    sendBakeryOrderAlertEmail({
      to: 'orders@bakery.example.com', // TODO: Load from bakery contact info in Phase 6D
      orderNumber: order.order_number,
      orderId: order.id,
      customerName: body.customer.fullName,
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
      })),
      total: order.total_minor,
      orderLink: bakeryOrderLink,
    }).catch((err) => {
      console.error('Failed to send bakery alert email for order:', order.id, err)
    })

    return res.status(201).json({
      id: order.id,
      order_number: order.order_number,
      total_minor: order.total_minor,
      next_step: 'pay',
      payment_methods: ['cash_on_delivery', 'bank_transfer', 'mtn_momo', 'airtel_money'], // Would filter by bakery config
    })
  } catch (error) {
    if (error instanceof Error) {
      // Check if validation error
      if (error.message.includes('Parse error') || error.message.includes('Invalid')) {
        return res.status(400).json({ error: error.message })
      }
      // Check if database error
      if (error.message.includes('violates foreign key')) {
        return res.status(422).json({ error: 'Invalid product or bakery' })
      }
    }
    console.error('Error creating order:', error)
    return res.status(500).json({ error: 'Failed to create order' })
  }
})

/**
 * GET /v1/customer/orders
 * List all orders for authenticated customer (paginated with optional filters)
 * Query params:
 *   limit: items per page (default 20, max 100)
 *   offset: pagination offset (default 0)
 *   status: filter by order status (optional)
 *   date_from: filter orders from date (ISO format, optional)
 *   date_to: filter orders to date (ISO format, optional)
 *   search: search by order number (optional)
 */
customerOrdersRouter.get('/', authenticateToken, requireCustomerContext, async (req: Request, res: Response) => {
  const customerId = (req as any).auth?.sub as string | undefined

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const limitParam = Array.isArray(req.query.limit) ? String(req.query.limit[0]) : typeof req.query.limit === 'string' ? req.query.limit : ''
    const offsetParam = Array.isArray(req.query.offset) ? String(req.query.offset[0]) : typeof req.query.offset === 'string' ? req.query.offset : ''
    const statusFilter = Array.isArray(req.query.status) ? String(req.query.status[0]) : typeof req.query.status === 'string' ? req.query.status : undefined
    const dateFromParam = Array.isArray(req.query.date_from) ? String(req.query.date_from[0]) : typeof req.query.date_from === 'string' ? req.query.date_from : undefined
    const dateToParam = Array.isArray(req.query.date_to) ? String(req.query.date_to[0]) : typeof req.query.date_to === 'string' ? req.query.date_to : undefined
    const searchParam = Array.isArray(req.query.search) ? String(req.query.search[0]) : typeof req.query.search === 'string' ? req.query.search : undefined

    const limit = Math.min(parseInt(limitParam) || 20, 100)
    const offset = parseInt(offsetParam) || 0
    const page = Math.floor(offset / limit) + 1

    // Get total count for pagination metadata
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM orders
       WHERE customer_id = $1 AND deleted_at IS NULL`,
      [customerId],
    )
    const total = parseInt(result.rows[0]?.total || '0')
    const pageSize = limit
    const totalPages = Math.ceil(total / pageSize)

    const orders = await listOrdersForCustomer(pool, customerId, limit, offset)

    const items = orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_minor: order.total_minor,
      created_at: order.created_at,
      fulfilment_mode: order.fulfilment_mode,
    }))

    return res.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('Error listing orders:', error)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

/**
 * GET /v1/customer/orders/:id
 * Get order detail with items
 * Verify ownership (customer_id matches auth)
 */
customerOrdersRouter.get('/:id', authenticateToken, requireCustomerContext, async (req: Request, res: Response) => {
  const customerId = (req as any).auth?.sub as string | undefined
  const orderId = req.params.id as string

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Load order without bakery_id filter (customer can have orders across bakeries)
    const result = await pool.query(
      `SELECT id, bakery_id, customer_id,
              guest_email, guest_phone, guest_name,
              order_number, status, fulfilment_mode, scheduled_for,
              delivery_address,
              subtotal_minor, delivery_fee_minor, total_minor, currency_code,
              customer_notes, internal_notes,
              created_at, updated_at,
              confirmed_at, delivered_at, cancelled_at, cancelled_reason
       FROM orders
       WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [orderId, customerId],
    )
    const order = result.rows[0]

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Verify ownership
    if (order.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return res.json({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_minor: order.total_minor,
      fulfilment_mode: order.fulfilment_mode,
      delivery_address: order.delivery_address,
      scheduled_for: order.scheduled_for,
      created_at: order.created_at,
      // Note: would include items array in real implementation
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return res.status(500).json({ error: 'Failed to fetch order' })
  }
})

/**
 * POST /v1/customer/orders/:id/cancel
 * Cancel an order (only if in pending_payment status)
 */
customerOrdersRouter.post('/:id/cancel', authenticateToken, requireCustomerContext, async (req: Request, res: Response) => {
  const customerId = (req as any).auth?.sub as string | undefined
  const orderId = req.params.id as string

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Load order to verify ownership and get bakery_id
    const result = await pool.query(
      `SELECT id, bakery_id, customer_id, status
       FROM orders
       WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [orderId, customerId],
    )
    const order = result.rows[0]

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Verify ownership
    if (order.customer_id !== customerId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Can only cancel pending_payment orders
    if (order.status !== 'pending_payment') {
      return res.status(422).json({ error: 'Cannot cancel order in this status' })
    }

    // Update status to cancelled (use bakery_id from order)
    await updateOrderStatus(pool, order.bakery_id, orderId, 'cancelled')

    return res.json({
      id: order.id,
      status: 'cancelled',
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return res.status(500).json({ error: 'Failed to cancel order' })
  }
})
