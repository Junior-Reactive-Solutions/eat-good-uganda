import * as ordersDb from '@eatgood/db'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'


// Mock the database module
vi.mock('@eatgood/db', () => ({
  pool: {},
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  listOrdersForCustomer: vi.fn(),
  updateOrderStatus: vi.fn(),
}))

// Mock middleware
vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.auth = { type: 'customer', id: 'customer-123', bakery_id: 'bakery-456' }
    next()
  },
}))

vi.mock('../../middleware/requireCustomerContext', () => ({
  requireCustomerContext: (req: any, res: any, next: any) => {
    req.customer = { id: 'customer-123', bakery_id: 'bakery-456' }
    next()
  },
}))

describe('Customer Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /v1/customer/orders', () => {
    it('creates an order for authenticated customer', async () => {
      const mockOrder = {
        id: 'order-123',
        order_number: 'EGU-20260507-A3F7',
        total_minor: 100000,
        status: 'pending_payment',
      }

      vi.mocked(ordersDb.createOrder).mockResolvedValue(mockOrder as any)

      const response = await request(app)
        .post('/v1/customer/orders')
        .send({
          items: [
            {
              productId: 'prod-1',
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

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/v1/customer/orders')
        .send({
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
      const response = await request(app)
        .post('/v1/customer/orders')
        .send({
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
      vi.mocked(ordersDb.createOrder).mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app)
        .post('/v1/customer/orders')
        .send({
          items: [
            {
              productId: 'prod-1',
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
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'EGU-20260507-A3F7',
          status: 'confirmed',
          total_minor: 100000,
          created_at: new Date(),
        },
      ]

      vi.mocked(ordersDb.listOrdersForCustomer).mockResolvedValue(
        mockOrders as any,
      )

      const response = await request(app).get('/v1/customer/orders')

      expect(response.status).toBe(200)
      expect(response.body.orders).toHaveLength(1)
      expect(response.body.orders[0]).toEqual({
        id: mockOrders[0]!.id,
        order_number: mockOrders[0]!.order_number,
        status: mockOrders[0]!.status,
        total_minor: mockOrders[0]!.total_minor,
        created_at: mockOrders[0]!.created_at.toISOString(),
      })
    })

    it('supports pagination', async () => {
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
      vi.mocked(ordersDb.listOrdersForCustomer).mockResolvedValue([])

      const response = await request(app)
        .get('/v1/customer/orders')
        .query({ limit: 200 })

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
        order_number: 'EGU-20260507-A3F7',
        status: 'confirmed',
        total_minor: 100000,
        customer_id: 'customer-123',
        fulfilment_mode: 'pickup',
        delivery_address: null,
        scheduled_for: null,
        created_at: new Date(),
      }

      vi.mocked(ordersDb.getOrderById).mockResolvedValue(mockOrder as any)

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
        created_at: mockOrder.created_at.toISOString(),
      })
    })

    it('returns 404 when order not found', async () => {
      vi.mocked(ordersDb.getOrderById).mockResolvedValue(null)

      const response = await request(app).get('/v1/customer/orders/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })

    it('returns 403 when customer does not own the order', async () => {
      const mockOrder = {
        id: 'order-123',
        customer_id: 'different-customer',
      }

      vi.mocked(ordersDb.getOrderById).mockResolvedValue(mockOrder as any)

      const response = await request(app).get('/v1/customer/orders/order-123')

      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Forbidden')
    })
  })

  describe('POST /v1/customer/orders/:id/cancel', () => {
    it('cancels a pending payment order', async () => {
      const mockOrder = {
        id: 'order-123',
        customer_id: 'customer-123',
        status: 'pending_payment',
      }

      vi.mocked(ordersDb.getOrderById).mockResolvedValue(mockOrder as any)
      vi.mocked(ordersDb.updateOrderStatus).mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
      } as any)

      const response = await request(app).post('/v1/customer/orders/order-123/cancel')

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
        customer_id: 'customer-123',
        status: 'confirmed',
      }

      vi.mocked(ordersDb.getOrderById).mockResolvedValue(mockOrder as any)

      const response = await request(app).post('/v1/customer/orders/order-123/cancel')

      expect(response.status).toBe(422)
      expect(response.body.error).toContain('Cannot cancel order')
    })

    it('returns 404 when order not found', async () => {
      vi.mocked(ordersDb.getOrderById).mockResolvedValue(null)

      const response = await request(app).post('/v1/customer/orders/nonexistent/cancel')

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })
  })
})
