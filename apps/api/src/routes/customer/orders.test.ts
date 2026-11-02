import * as ordersDb from '@eatgood/db'
import type { RequestHandler } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'

// Mock the database module. `pool.query` is mocked directly because the GET
// list/detail and cancel handlers in orders.ts call it straight (not through
// a db-layer helper like the other mocked functions below).
const mockPoolQuery = vi.fn()

vi.mock('@eatgood/db', () => ({
  pool: { query: (...args: unknown[]) => mockPoolQuery(...args) },
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  listOrdersForCustomer: vi.fn(),
  updateOrderStatus: vi.fn(),
  getBakeryById: vi.fn(),
  getProductById: vi.fn(),
}))

// orders.ts fires confirmation emails (fire-and-forget) on successful creation.
// Stub it out — email delivery is covered by lib/email's own test suite.
vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn(),
}))

// Mock middleware
vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (): RequestHandler => (req, _res, next) => {
    req.auth = { kind: 'customer', sub: 'customer-123' }
    next()
  },
}))

vi.mock('../../middleware/requireCustomerContext', () => ({
  // This middleware just validates the kind, doesn't set anything
  requireCustomerContext: ((_req, _res, next) => {
    next()
  }) as RequestHandler,
}))

// The global CSRF middleware (app.ts) requires a matching cookie + header on
// every state-changing method. This helper attaches a valid pair so POST
// requests reach the route handler instead of being rejected with 403.
const CSRF_TOKEN = 'test-csrf-token'

function postWithCsrf(path: string) {
  return request(app)
    .post(path)
    .set('Cookie', [`eg_csrf=${CSRF_TOKEN}`])
    .set('x-csrf-token', CSRF_TOKEN)
}

// Minimal fixtures cast to the real db-layer return types so tests don't need
// `as any` to satisfy mockResolvedValue's generic.
type Bakery = Awaited<ReturnType<typeof ordersDb.getBakeryById>>
type Product = Awaited<ReturnType<typeof ordersDb.getProductById>>
type Order = Awaited<ReturnType<typeof ordersDb.createOrder>>

function mockBakery(overrides: Partial<NonNullable<Bakery>> = {}): Bakery {
  return { id: 'bakery-fixture', status: 'active', ...overrides } as Bakery
}

function mockProduct(overrides: Partial<NonNullable<Product>> = {}): Product {
  return {
    id: '2f94ad92-c6e3-4ddb-8983-79beafd23ab3',
    name: 'Mandazi',
    base_price_minor: 50000,
    ...overrides,
  } as Product
}

function mockCreatedOrder(overrides: Partial<NonNullable<Order>> = {}): Order {
  return {
    id: 'order-fixture',
    order_number: 'EGU-20260507-A3F7',
    total_minor: 100000,
    status: 'pending_payment',
    ...overrides,
  } as Order
}

describe('Customer Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no rows found. Individual tests override via mockResolvedValueOnce
    // or by reassigning mockPoolQuery's implementation for multi-call sequences.
    mockPoolQuery.mockResolvedValue({ rows: [] })
  })

  describe('POST /v1/customer/orders', () => {
    const VALID_BAKERY_ID = '08fbe1e9-b959-48ad-bc5e-a02e3db855de'

    it('creates an order for authenticated customer', async () => {
      const mockOrder = mockCreatedOrder({ id: 'order-123' })

      vi.mocked(ordersDb.getBakeryById).mockResolvedValue(mockBakery({ id: VALID_BAKERY_ID }))
      vi.mocked(ordersDb.getProductById).mockResolvedValue(mockProduct())
      vi.mocked(ordersDb.createOrder).mockResolvedValue(mockOrder)

      const response = await postWithCsrf('/v1/customer/orders').send({
        bakeryId: VALID_BAKERY_ID,
        items: [
          {
            productId: '2f94ad92-c6e3-4ddb-8983-79beafd23ab3',
            quantity: 2,
          },
        ],
        customer: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+256701234567',
          createAccount: false,
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        id: mockOrder.id,
        order_number: mockOrder.order_number,
        total_minor: mockOrder.total_minor,
        next_step: 'pay',
        payment_methods: expect.any(Array),
      })
      expect(ordersDb.createOrder).toHaveBeenCalled()
    })

    it('should validate bakeryId and resolve it from request body', async () => {
      const bakeryId = 'b8341221-4edf-4061-8ea6-49da96812996'
      const mockOrder = mockCreatedOrder({
        id: 'order-456',
        bakery_id: bakeryId,
        order_number: 'EGU-20260507-B4G8',
        total_minor: 0,
      })

      vi.mocked(ordersDb.getBakeryById).mockResolvedValue(mockBakery({ id: bakeryId }))
      vi.mocked(ordersDb.getProductById).mockResolvedValue(mockProduct())
      vi.mocked(ordersDb.createOrder).mockResolvedValue(mockOrder)

      const response = await postWithCsrf('/v1/customer/orders').send({
        bakeryId, // ← bakery comes from request body
        items: [
          {
            productId: '2f94ad92-c6e3-4ddb-8983-79beafd23ab3',
            quantity: 1,
          },
        ],
        customer: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+256701234567',
          createAccount: false,
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      // Verify bakeryId was validated
      expect(ordersDb.getBakeryById).toHaveBeenCalledWith(expect.anything(), bakeryId)

      // Verify order was created with correct bakeryId
      expect(ordersDb.createOrder).toHaveBeenCalledWith(
        expect.anything(),
        bakeryId, // ← bakeryId passed as second arg
        expect.objectContaining({
          // order data
        }),
      )

      expect(response.status).toBe(201)
      expect(response.body.id).toBe('order-456')
    })

    it('should reject invalid bakeryId', async () => {
      const invalidBakeryId = 'e15fe42c-68f0-4326-89fa-a0f64e3d22bc'

      vi.mocked(ordersDb.getBakeryById).mockResolvedValue(null)

      const response = await postWithCsrf('/v1/customer/orders').send({
        bakeryId: invalidBakeryId,
        items: [
          {
            productId: '2f94ad92-c6e3-4ddb-8983-79beafd23ab3',
            quantity: 1,
          },
        ],
        customer: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+256701234567',
          createAccount: false,
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Bakery')
      expect(ordersDb.createOrder).not.toHaveBeenCalled()
    })

    it('validates required fields', async () => {
      const response = await postWithCsrf('/v1/customer/orders').send({
        items: [],
        customer: {
          fullName: '',
          email: '',
          phone: '',
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      expect(response.status).toBe(400)
    })

    it('rejects empty cart', async () => {
      const response = await postWithCsrf('/v1/customer/orders').send({
        items: [],
        customer: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+256701234567',
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('empty')
    })

    it('handles database errors gracefully', async () => {
      vi.mocked(ordersDb.getBakeryById).mockResolvedValue(mockBakery({ id: VALID_BAKERY_ID }))
      vi.mocked(ordersDb.getProductById).mockResolvedValue(mockProduct())
      vi.mocked(ordersDb.createOrder).mockRejectedValue(new Error('Database error'))

      const response = await postWithCsrf('/v1/customer/orders').send({
        bakeryId: VALID_BAKERY_ID,
        items: [
          {
            productId: '2f94ad92-c6e3-4ddb-8983-79beafd23ab3',
            quantity: 1,
          },
        ],
        customer: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+256701234567',
        },
        fulfillment: {
          mode: 'pickup',
        },
        payment: {
          method: 'cash_on_delivery',
        },
      })

      expect(response.status).toBe(500)
      expect(response.body.error).toContain('Failed to create order')
    })
  })

  describe('GET /v1/customer/orders', () => {
    it('returns list of customer orders', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'EGU-20260507-A3F7',
        status: 'confirmed',
        total_minor: 100000,
        fulfilment_mode: 'pickup',
        created_at: new Date(),
      }

      mockPoolQuery.mockResolvedValue({ rows: [{ total: '1' }] })
      vi.mocked(ordersDb.listOrdersForCustomer).mockResolvedValue([mockOrder] as unknown as Awaited<
        ReturnType<typeof ordersDb.listOrdersForCustomer>
      >)

      const response = await request(app).get('/v1/customer/orders')

      expect(response.status).toBe(200)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0]).toEqual({
        id: mockOrder.id,
        order_number: mockOrder.order_number,
        status: mockOrder.status,
        total_minor: mockOrder.total_minor,
        fulfilment_mode: mockOrder.fulfilment_mode,
        created_at: mockOrder.created_at.toISOString(),
      })
    })

    it('supports pagination', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [{ total: '0' }] })
      vi.mocked(ordersDb.listOrdersForCustomer).mockResolvedValue([])

      const response = await request(app)
        .get('/v1/customer/orders')
        .query({ limit: 50, offset: 10 })

      expect(response.status).toBe(200)
      expect(ordersDb.listOrdersForCustomer).toHaveBeenCalledWith(
        expect.anything(),
        'customer-123',
        50,
        10,
      )
    })

    it('enforces maximum limit of 100', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [{ total: '0' }] })
      vi.mocked(ordersDb.listOrdersForCustomer).mockResolvedValue([])

      const response = await request(app).get('/v1/customer/orders').query({ limit: 200 })

      expect(response.status).toBe(200)
      expect(ordersDb.listOrdersForCustomer).toHaveBeenCalledWith(
        expect.anything(),
        'customer-123',
        100,
        0,
      )
    })
  })

  describe('GET /v1/customer/orders/:id', () => {
    it('returns order details with ownership verification', async () => {
      const mockOrder = {
        id: 'order-123',
        bakery_id: 'bakery-456',
        order_number: 'EGU-20260507-A3F7',
        status: 'confirmed',
        total_minor: 100000,
        customer_id: 'customer-123',
        fulfilment_mode: 'pickup',
        delivery_address: null,
        scheduled_for: null,
        created_at: new Date().toISOString(),
      }

      mockPoolQuery.mockResolvedValue({ rows: [mockOrder] })

      const response = await request(app).get('/v1/customer/orders/order-123')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: mockOrder.id,
        order_number: mockOrder.order_number,
        status: mockOrder.status,
        total_minor: mockOrder.total_minor,
        fulfilment_mode: mockOrder.fulfilment_mode,
        delivery_address: mockOrder.delivery_address,
        scheduled_for: mockOrder.scheduled_for,
        created_at: mockOrder.created_at,
      })
    })

    it('returns 404 when order not found', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] })

      const response = await request(app).get('/v1/customer/orders/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })

    it('returns 403 when customer does not own the order', async () => {
      // The route's SQL already filters by customer_id, so a mismatched row
      // can't occur with a real database — this exercises the defensive
      // ownership check in the handler itself.
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: 'order-123', customer_id: 'different-customer' }],
      })

      const response = await request(app).get('/v1/customer/orders/order-123')

      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Forbidden')
    })
  })

  describe('POST /v1/customer/orders/:id/cancel', () => {
    it('cancels a pending payment order', async () => {
      const mockOrder = {
        id: 'order-123',
        bakery_id: 'bakery-456',
        customer_id: 'customer-123',
        status: 'pending_payment',
      }

      mockPoolQuery.mockResolvedValue({ rows: [mockOrder] })
      vi.mocked(ordersDb.updateOrderStatus).mockResolvedValue(
        mockCreatedOrder({ ...mockOrder, status: 'cancelled' }),
      )

      const response = await postWithCsrf('/v1/customer/orders/order-123/cancel')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('cancelled')
      expect(ordersDb.updateOrderStatus).toHaveBeenCalledWith(
        expect.anything(),
        'bakery-456',
        'order-123',
        'cancelled',
      )
    })

    it('returns 422 when order is not pending payment', async () => {
      const mockOrder = {
        id: 'order-123',
        bakery_id: 'bakery-456',
        customer_id: 'customer-123',
        status: 'confirmed',
      }

      mockPoolQuery.mockResolvedValue({ rows: [mockOrder] })

      const response = await postWithCsrf('/v1/customer/orders/order-123/cancel')

      expect(response.status).toBe(422)
      expect(response.body.error).toContain('Cannot cancel order')
    })

    it('returns 404 when order not found', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] })

      const response = await postWithCsrf('/v1/customer/orders/nonexistent/cancel')

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })
  })
})
