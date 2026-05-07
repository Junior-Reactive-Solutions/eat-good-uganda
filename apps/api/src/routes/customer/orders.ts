import { pool, createOrder, getOrderById, getOrderByNumber, listOrdersForCustomer, updateOrderStatus } from '@eatgood/db'
import { orderCreationSchema, type OrderCreation } from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'

import { requireCustomerContext } from '../../middleware/requireCustomerContext'
import { authenticateToken } from '../../middleware/authenticateToken'
import { generateOrderNumber } from '../../services/orders'
import { sendOrderConfirmationEmail } from '../../services/email/orders'

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
  const customerId = req.customer?.id
  const bakeryId = req.customer?.bakery_id

  if (!customerId || !bakeryId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Validate request body
    const body = orderCreationSchema.parse(req.body) as OrderCreation

    // Ensure items are not empty
    if (!body.items || body.items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' })
    }

    // Note: In Phase 3, we'll validate bakery is active, items exist, prices match, etc.
    // For MVP, we'll keep it simple and just create the order

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Prepare fulfillment data
    const fulfilmentData = {
      mode: body.fulfillment.mode,
      delivery_address: body.fulfillment.mode === 'delivery' ? body.fulfillment.deliveryAddress : null,
      scheduled_for: body.fulfillment.scheduledFor || null,
    }

    // Calculate subtotal (in reality, this should come from validated product prices)
    // For MVP, we'll use a placeholder value that will be set by the database
    const subtotalMinor = 0 // This should be calculated from items

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
      delivery_fee_minor: 0, // Delivery fee would be calculated here
      total_minor: subtotalMinor,
      currency_code: 'UGX',
      customer_notes: body.notes || null,
      items: body.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: '', // Would come from product lookup
        variant_name: null,
        unit_price_minor: 0, // Would be fetched from product
        quantity: item.quantity,
        line_total_minor: 0, // Would be calculated
      })),
    })

    // Send confirmation email to authenticated customer
    const publicCustomerUrl = process.env.PUBLIC_CUSTOMER_URL || 'https://app.eatgood.ug'
    const orderLink = `${publicCustomerUrl}/account/orders/${order.id}`

    try {
      await sendOrderConfirmationEmail({
        to: body.customer.email,
        orderNumber: order.order_number,
        orderId: order.id,
        orderLink,
        total: order.total_minor,
      })
    } catch (emailError) {
      // Email sending failed - fail the entire order creation
      console.error('Email sending failed for order:', order.id, emailError)
      // Note: In a real system, you might want to delete the order here
      return res.status(500).json({
        error: 'Failed to send confirmation email. Please try again.',
      })
    }

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
 * List all orders for authenticated customer (paginated)
 */
customerOrdersRouter.get('/', authenticateToken, requireCustomerContext, async (req: Request, res: Response) => {
  const customerId = req.customer?.id

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const limitParam = Array.isArray(req.query.limit) ? String(req.query.limit[0]) : typeof req.query.limit === 'string' ? req.query.limit : ''
    const offsetParam = Array.isArray(req.query.offset) ? String(req.query.offset[0]) : typeof req.query.offset === 'string' ? req.query.offset : ''

    const limit = Math.min(parseInt(limitParam) || 20, 100)
    const offset = parseInt(offsetParam) || 0

    const orders = await listOrdersForCustomer(pool, customerId, limit, offset)

    return res.json({
      orders: orders.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_minor: order.total_minor,
        created_at: order.created_at,
      })),
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
  const customerId = req.customer?.id
  const bakeryId = req.customer?.bakery_id
  const orderId = req.params.id as string

  if (!customerId || !bakeryId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const order = await getOrderById(pool, bakeryId, orderId)

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
  const customerId = req.customer?.id
  const bakeryId = req.customer?.bakery_id
  const orderId = req.params.id as string

  if (!customerId || !bakeryId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const order = await getOrderById(pool, bakeryId, orderId)

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

    // Update status to cancelled
    await updateOrderStatus(pool, bakeryId, orderId, 'cancelled')

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
