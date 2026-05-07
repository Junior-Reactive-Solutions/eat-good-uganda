import { pool, createOrder, getOrderById } from '@eatgood/db'
import { orderCreationSchema, type OrderCreation } from '@eatgood/shared'
import { Router } from 'express'
import type { Request, Response } from 'express'

import { generateOrderNumber, generateClaimToken, hashClaimToken } from '../../services/orders'
import { authRateLimit } from '../../middleware/rateLimit'
import { sendOrderConfirmationEmail } from '../../services/email/orders'

const router = Router()

/**
 * POST /v1/public/orders
 * Create an order for guest checkout
 *
 * No authentication required
 * Guest provides: email, phone, full name
 * Client MUST provide bakery_id explicitly
 *
 * Returns: order with claim_token for guest to verify ownership
 */
router.post('/', authRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const body = orderCreationSchema.parse(req.body) as OrderCreation

    // Ensure bakery_id is provided for guest checkout
    if (!body.bakeryId) {
      return res.status(400).json({ error: 'bakeryId is required for guest checkout' })
    }

    // Ensure items are not empty
    if (!body.items || body.items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' })
    }

    // Note: In Phase 3, we'll validate bakery is active, items exist, prices match, etc.

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Generate claim token for guest to verify order ownership
    const claimToken = generateClaimToken()
    const claimTokenHash = hashClaimToken(claimToken)

    // Prepare fulfillment data
    const fulfilmentData = {
      mode: body.fulfillment.mode,
      delivery_address: body.fulfillment.mode === 'delivery' ? body.fulfillment.deliveryAddress : null,
      scheduled_for: body.fulfillment.scheduledFor || null,
    }

    // Calculate subtotal (in reality, from validated product prices)
    const subtotalMinor = 0 // Placeholder

    // Create order (customer_id = null for guest)
    const order = await createOrder(pool, body.bakeryId, {
      customer_id: null, // Guest checkout
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
      delivery_fee_minor: 0,
      total_minor: subtotalMinor,
      currency_code: 'UGX',
      customer_notes: body.notes || null,
      // Guest info stored in order
      guest_email: body.customer.email,
      guest_phone: body.customer.phone,
      guest_name: body.customer.fullName,
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

    // Send confirmation email with claim token
    const publicCustomerUrl = process.env.PUBLIC_CUSTOMER_URL || 'https://app.eatgood.ug'
    const orderLink = `${publicCustomerUrl}/account/orders/${order.id}`

    try {
      await sendOrderConfirmationEmail({
        to: body.customer.email,
        orderNumber: order.order_number,
        orderId: order.id,
        claimToken,
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
      payment_methods: ['cash_on_delivery', 'bank_transfer', 'mtn_momo', 'airtel_money'],
      claim_token: claimToken, // Send to frontend, frontend stores and uses for verification
      message: 'Order created. Check your email for confirmation and claim token.',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Parse error') || error.message.includes('Invalid')) {
        return res.status(400).json({ error: error.message })
      }
      if (error.message.includes('violates foreign key')) {
        return res.status(422).json({ error: 'Invalid product or bakery' })
      }
    }
    console.error('Error creating guest order:', error)
    return res.status(500).json({ error: 'Failed to create order' })
  }
})

/**
 * GET /v1/public/orders/:id
 * Get order detail for guest
 *
 * Requires claim token to verify ownership (guest cannot access order without token)
 * Query parameter: claim=<token>
 */
router.get('/:id', async (req: Request, res: Response) => {
  const orderId = req.params.id
  const claimToken = req.query.claim as string | undefined

  if (!claimToken) {
    return res.status(401).json({ error: 'Claim token required to access guest order' })
  }

  try {
    // TODO: Implement proper guest order lookup
    // For MVP Phase 2, we're skipping the claim token storage.
    // In Phase 3, we should either:
    // 1. Add claim_token_hash column to orders table
    // 2. Create separate claim_tokens table
    // For now, the frontend stores the claim token and includes it in URL

    // Placeholder: return error indicating this endpoint is not fully implemented for guest access
    return res.status(501).json({
      error: 'Guest order lookup not yet implemented. Use authenticated endpoints or check email confirmation.'
    })
  } catch (error) {
    console.error('Error fetching guest order:', error)
    return res.status(500).json({ error: 'Failed to fetch order' })
  }
})

export default router
