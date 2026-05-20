/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import * as paymentsDb from '@eatgood/db'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'
import * as initiateService from '../../services/payment/initiate'
import * as statusService from '../../services/payment/status'

// The route reads the order via `query(db, sql\`...\`)` and the payment list
// via `listPaymentsForOrder`. We mock the whole db package so no real
// connection is required, and so `sql` is a harmless passthrough.
vi.mock('@eatgood/db', () => ({
  pool: {},
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
  query: vi.fn(),
  listPaymentsForOrder: vi.fn(),
}))

// Authenticate as a fixed customer. The route resolves the customer id from
// `req.auth.sub` (falling back from `req.customer.id`), so setting `auth` here
// is sufficient for both the auth middleware and the route handler.
vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: () => (_req: any, _res: any, next: any) => {
    _req.auth = { kind: 'customer', sub: 'customer-123' }
    next()
  },
}))

vi.mock('../../middleware/requireCustomerContext', () => ({
  requireCustomerContext: (_req: any, _res: any, next: any) => {
    _req.db = {}
    next()
  },
}))

// Stub the payment domain services so the route is tested in isolation from
// the MoMo provider and encryption layers.
vi.mock('../../services/payment/initiate', () => ({
  initiateMomoPayment: vi.fn(),
}))

vi.mock('../../services/payment/status', async () => {
  // Preserve the real PaymentNotFoundError so `instanceof` checks in the route
  // continue to work while we stub checkPaymentStatus.
  class PaymentNotFoundError extends Error {
    override readonly name = 'PaymentNotFoundError'
    readonly statusCode = 404
    constructor(message = 'Payment not found') {
      super(message)
    }
  }
  return {
    PaymentNotFoundError,
    checkPaymentStatus: vi.fn(),
  }
})

const CUSTOMER_ID = 'customer-123'
const BAKERY_ID = 'bakery-abc'
const ORDER_ID = 'order-xyz'

// The global CSRF middleware (app.ts) requires a matching cookie + header on
// every state-changing method. These helpers attach a valid pair so POST
// requests reach the route handler instead of being rejected with 403.
const CSRF_TOKEN = 'test-csrf-token'

function payRequest(orderId: string) {
  return request(app)
    .post(`/v1/customer/orders/${orderId}/pay`)
    .set('Cookie', [`eg_csrf=${CSRF_TOKEN}`])
    .set('x-csrf-token', CSRF_TOKEN)
}

/** A minimal pending order row owned by CUSTOMER_ID. */
function pendingOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    bakery_id: BAKERY_ID,
    customer_id: CUSTOMER_ID,
    status: 'pending_payment',
    total_minor: 10000,
    currency_code: 'UGX',
    ...overrides,
  }
}

/** Configure `query()` to resolve the supplied order row (or none). */
function mockOrderQuery(row: Record<string, unknown> | null) {
  vi.mocked(paymentsDb.query).mockResolvedValue({
    rows: row ? [row] : [],
  } as any)
}

describe('Customer Payments API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /v1/customer/orders/:orderId/pay', () => {
    it('initiates a payment with a valid phone and returns 200 pending', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([])
      vi.mocked(initiateService.initiateMomoPayment).mockResolvedValue({
        paymentId: 'payment-1',
        status: 'pending',
        pollUrl: `/v1/customer/orders/${ORDER_ID}/payment-status`,
      })

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        paymentId: 'payment-1',
        status: 'pending',
        pollUrl: `/v1/customer/orders/${ORDER_ID}/payment-status`,
      })

      // The bakery_id and amount must come from the order, never the client.
      expect(initiateService.initiateMomoPayment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderId: ORDER_ID,
          bakeryId: BAKERY_ID,
          amountMinor: 10000,
          currencyCode: 'UGX',
          payerPhone: '+256700000000',
        }),
      )
    })

    it('forwards an optional idempotencyKey to the service', async () => {
      const idempotencyKey = '11111111-1111-4111-8111-111111111111'
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([])
      vi.mocked(initiateService.initiateMomoPayment).mockResolvedValue({
        paymentId: 'payment-1',
        status: 'pending',
        pollUrl: `/v1/customer/orders/${ORDER_ID}/payment-status`,
      })

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000', idempotencyKey })

      expect(response.status).toBe(200)
      expect(initiateService.initiateMomoPayment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ idempotencyKey }),
      )
    })

    it('rejects an invalid phone number with 400', async () => {
      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '0700000000' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Invalid Uganda phone number' })
      // Validation happens before any order lookup or service call.
      expect(paymentsDb.query).not.toHaveBeenCalled()
      expect(initiateService.initiateMomoPayment).not.toHaveBeenCalled()
    })

    it('rejects a non-MoMo method with 400', async () => {
      const response = await payRequest(ORDER_ID)
        .send({ method: 'airtel_money', phone: '+256700000000' })

      expect(response.status).toBe(400)
      expect(initiateService.initiateMomoPayment).not.toHaveBeenCalled()
    })

    it('returns 404 when the order does not exist', async () => {
      mockOrderQuery(null)

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Order not found' })
      expect(initiateService.initiateMomoPayment).not.toHaveBeenCalled()
    })

    it('returns 400 when the order is no longer pending payment', async () => {
      mockOrderQuery(pendingOrderRow({ status: 'confirmed' }))

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Order already has a confirmed payment',
      })
      expect(initiateService.initiateMomoPayment).not.toHaveBeenCalled()
    })

    it('returns 400 when a paid payment already exists for the order', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([
        { id: 'payment-0', status: 'paid' } as any,
      ])

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Order already has a confirmed payment',
      })
      expect(initiateService.initiateMomoPayment).not.toHaveBeenCalled()
    })

    it('returns 503 when MoMo is not configured for the bakery', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([])
      vi.mocked(initiateService.initiateMomoPayment).mockResolvedValue({
        paymentId: '',
        status: 'failed',
        error: 'MoMo not configured',
      })

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(503)
      expect(response.body.error).toBe('MoMo not configured')
    })

    it('returns 502 on an upstream provider failure', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([])
      vi.mocked(initiateService.initiateMomoPayment).mockResolvedValue({
        paymentId: 'payment-1',
        status: 'failed',
        error: 'Payment could not be initiated',
      })

      const response = await payRequest(ORDER_ID)
        .send({ method: 'mtn_momo', phone: '+256700000000' })

      expect(response.status).toBe(502)
      expect(response.body.error).toBe('Payment could not be initiated')
    })
  })

  describe('GET /v1/customer/orders/:orderId/payment-status', () => {
    it('returns pending for an in-flight payment', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([
        { id: 'payment-1', status: 'pending' } as any,
      ])
      vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
        status: 'pending',
      })

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'pending' })
      expect(statusService.checkPaymentStatus).toHaveBeenCalledWith(
        expect.anything(),
        BAKERY_ID,
        'payment-1',
      )
    })

    it('returns paid with the financial transaction id', async () => {
      mockOrderQuery(pendingOrderRow({ status: 'confirmed' }))
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([
        { id: 'payment-1', status: 'paid' } as any,
      ])
      vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
        status: 'paid',
        financialTransactionId: 'ftx-999',
      })

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        status: 'paid',
        financialTransactionId: 'ftx-999',
      })
    })

    it('returns failed with a reason', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([
        { id: 'payment-1', status: 'failed' } as any,
      ])
      vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
        status: 'failed',
        reason: 'Payment failed',
      })

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'failed', reason: 'Payment failed' })
    })

    it('returns 404 when the order does not exist', async () => {
      mockOrderQuery(null)

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Order not found' })
      expect(statusService.checkPaymentStatus).not.toHaveBeenCalled()
    })

    it('returns 404 when no payment exists for the order', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([])

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Payment not found' })
      expect(statusService.checkPaymentStatus).not.toHaveBeenCalled()
    })

    it('returns 404 when the status service raises PaymentNotFoundError', async () => {
      mockOrderQuery(pendingOrderRow())
      vi.mocked(paymentsDb.listPaymentsForOrder).mockResolvedValue([
        { id: 'payment-1', status: 'pending' } as any,
      ])
      vi.mocked(statusService.checkPaymentStatus).mockRejectedValue(
        new statusService.PaymentNotFoundError(),
      )

      const response = await request(app).get(
        `/v1/customer/orders/${ORDER_ID}/payment-status`,
      )

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Payment not found' })
    })
  })
})
