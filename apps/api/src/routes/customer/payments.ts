/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import {
  listPaymentsForOrder,
  pool,
  query,
  sql,
} from '@eatgood/db'
import type { Database } from '@eatgood/db'
import type { Order } from '@eatgood/shared'
import { initiateMomoPaymentSchema } from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'
import {
  initiateMomoPayment,
  type InitiateMomoPaymentResult,
} from '../../services/payment/initiate'
import {
  PaymentNotFoundError,
  checkPaymentStatus,
  type PaymentStatusResult,
} from '../../services/payment/status'

export const customerPaymentsRouter = createRouter() as Router

/**
 * Resolve the DB handle attached by the request pipeline, falling back to the
 * shared pool. Keeps tests able to inject a stub `req.db` while production
 * code uses the application-wide pool.
 */
function getDb(req: Request): Database {
  return ((req as any).db as Database | undefined) ?? pool
}

/**
 * Look up an order by id scoped to the authenticated customer. Returns null
 * when the order is missing or owned by a different customer — the two cases
 * are deliberately indistinguishable to avoid leaking cross-tenant existence.
 *
 * We do NOT pre-filter by bakery_id here because the customer JWT does not
 * carry one; the order's own bakery_id is the source of truth and is used to
 * scope every subsequent payment query.
 */
async function loadCustomerOwnedOrder(
  db: Database,
  orderId: string,
  customerId: string,
): Promise<Order | null> {
  const result = await query<Order>(
    db,
    sql`SELECT id, bakery_id, customer_id,
               guest_email, guest_phone, guest_name,
               order_number, status, fulfilment_mode, scheduled_for,
               delivery_address,
               subtotal_minor, delivery_fee_minor, total_minor, currency_code,
               customer_notes, internal_notes,
               created_at, updated_at,
               confirmed_at, delivered_at, cancelled_at, cancelled_reason
        FROM orders
        WHERE id = ${orderId}
          AND customer_id = ${customerId}
          AND deleted_at IS NULL
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

/**
 * POST /v1/customer/orders/:orderId/pay
 *
 * Initiate an MTN MoMo collection for a customer's pending order.
 *
 * Flow:
 *   1. Authenticate as customer.
 *   2. Load order by id, scoped to the authenticated customer (404 if absent
 *      or owned by a different customer).
 *   3. Refuse if the order is no longer in `pending_payment` (already paid,
 *      confirmed, cancelled, refunded, etc.).
 *   4. Refuse if any payment row for this order is already in a settled
 *      `paid` state (defence in depth — the order status above is the
 *      primary check).
 *   5. Validate body against the Zod schema (method + phone + optional
 *      idempotency key).
 *   6. Call `initiateMomoPayment()` with the order amount in minor units and
 *      the order's bakery_id (multi-tenant scope).
 *   7. Map the service result to an HTTP status code:
 *      - success / pending      → 200
 *      - validation/config fail → 400 / 502
 */
customerPaymentsRouter.post(
  '/:orderId/pay',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId =
      ((req as any).customer?.id as string | undefined) ??
      (req.auth?.kind === 'customer' ? req.auth.sub : undefined)
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const orderId = req.params.orderId as string
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' })
    }

    try {
      // 1. Validate body first so we don't leak the order's existence on
      //    requests that would have failed validation anyway.
      const body = initiateMomoPaymentSchema.parse(req.body)

      const db = getDb(req)

      // 2. Load the order, scoped to the authenticated customer.
      const order = await loadCustomerOwnedOrder(db, orderId, customerId)
      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      // 3. Only `pending_payment` orders can be paid. Everything else has
      //    moved on (confirmed → already paid; cancelled/refunded → terminal).
      if (order.status !== 'pending_payment') {
        return res.status(400).json({
          error: 'Order already has a confirmed payment',
        })
      }

      // 4. Defence in depth: if a prior `paid` row exists for this order,
      //    refuse to start a second collection — the row table is the
      //    ground truth for settlement.
      const existingPayments = await listPaymentsForOrder(
        db,
        order.bakery_id,
        order.id,
      )
      const alreadyPaid = existingPayments.some((p) => p.status === 'paid')
      if (alreadyPaid) {
        return res.status(400).json({
          error: 'Order already has a confirmed payment',
        })
      }

      // 5. Hand off to the payment service. We pass the order's bakery_id —
      //    NEVER trust the client to supply this — and the order total in
      //    minor units.
      const result: InitiateMomoPaymentResult = await initiateMomoPayment(db, {
        orderId: order.id,
        bakeryId: order.bakery_id,
        amountMinor: order.total_minor,
        currencyCode: order.currency_code,
        payerPhone: body.phone,
        ...(body.idempotencyKey !== undefined
          ? { idempotencyKey: body.idempotencyKey }
          : {}),
      })

      // 6. Translate service-side errors into HTTP status codes. The service
      //    has already redacted any provider credential / token material.
      if (result.status === 'failed') {
        const reason = result.error ?? 'Payment could not be initiated'
        if (
          reason === 'Invalid phone number' ||
          reason === 'Invalid payment amount' ||
          reason === 'Unsupported currency'
        ) {
          return res.status(400).json({
            paymentId: result.paymentId || undefined,
            status: result.status,
            error: reason,
          })
        }
        if (reason === 'MoMo not configured' || reason === 'Bakery not found') {
          return res.status(503).json({
            paymentId: result.paymentId || undefined,
            status: result.status,
            error: reason,
          })
        }
        // Provider / upstream failure.
        return res.status(502).json({
          paymentId: result.paymentId || undefined,
          status: result.status,
          error: reason,
        })
      }

      return res.status(200).json({
        paymentId: result.paymentId,
        status: result.status,
        pollUrl: result.pollUrl,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const phoneIssue = error.issues.find((issue) =>
          issue.path.includes('phone'),
        )
        if (phoneIssue) {
          return res
            .status(400)
            .json({ error: 'Invalid Uganda phone number' })
        }
        return res
          .status(400)
          .json({ error: 'Validation failed', details: error.issues })
      }

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          orderId,
        },
        'Failed to initiate payment',
      )
      return res.status(500).json({ error: 'Failed to initiate payment' })
    }
  },
)

/**
 * GET /v1/customer/orders/:orderId/payment-status
 *
 * Poll the most recent payment attempt for a customer's order. Returns one
 * of `pending` | `paid` | `failed` along with an optional reason on failure.
 *
 * Flow:
 *   1. Authenticate as customer.
 *   2. Load the order, scoped to the customer (404 if missing/wrong owner).
 *   3. Find the most recent payment row for this order (404 if none).
 *   4. Delegate to `checkPaymentStatus()` which may re-poll the provider for
 *      `pending`/`initiated` rows; terminal rows return immediately.
 *   5. Map the union result to the public response shape.
 */
customerPaymentsRouter.get(
  '/:orderId/payment-status',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId =
      ((req as any).customer?.id as string | undefined) ??
      (req.auth?.kind === 'customer' ? req.auth.sub : undefined)
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const orderId = req.params.orderId as string
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' })
    }

    try {
      const db = getDb(req)

      const order = await loadCustomerOwnedOrder(db, orderId, customerId)
      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      // Most recent payment first — `listPaymentsForOrder` orders by
      // created_at DESC, so [0] is the latest attempt.
      const payments = await listPaymentsForOrder(db, order.bakery_id, order.id)
      const latest = payments[0]
      if (!latest) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      const status: PaymentStatusResult = await checkPaymentStatus(
        db,
        order.bakery_id,
        latest.id,
      )

      if (status.status === 'paid') {
        return res.status(200).json({
          status: 'paid',
          financialTransactionId: status.financialTransactionId,
        })
      }
      if (status.status === 'failed') {
        return res.status(200).json({
          status: 'failed',
          reason: status.reason,
        })
      }
      return res.status(200).json({ status: 'pending' })
    } catch (error) {
      if (error instanceof PaymentNotFoundError) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          orderId,
        },
        'Failed to check payment status',
      )
      return res.status(500).json({ error: 'Failed to check payment status' })
    }
  },
)
