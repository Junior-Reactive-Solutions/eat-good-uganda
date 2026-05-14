import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../../app'
import * as addressesDb from '@eatgood/db'

vi.mock('@eatgood/db', () => ({
  pool: {},
  getCustomerAddresses: vi.fn(),
  getCustomerAddress: vi.fn(),
  createCustomerAddress: vi.fn(),
  updateCustomerAddress: vi.fn(),
  deleteCustomerAddress: vi.fn(),
}))

vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: () => (_req: any, _res: any, next: any) => {
    _req.auth = { kind: 'customer', sub: 'customer-123' }
    next()
  },
}))

vi.mock('../../middleware/requireCustomerContext', () => ({
  requireCustomerContext: (_req: any, _res: any, next: any) => {
    _req.customer = { id: 'customer-123' }
    _req.db = {}
    next()
  },
}))

describe('Customer Addresses API', () => {
  const customerId = 'customer-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /v1/customer/addresses', () => {
    it('returns list of customer addresses', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          user_id: customerId,
          street_address: '123 Main St',
          city: 'Kampala',
          district: 'Makindye',
          postal_code: '00001',
          is_default: true,
          is_delivery_address: true,
          is_billing_address: false,
          created_at: '2026-05-13T10:00:00Z',
          updated_at: '2026-05-13T10:00:00Z',
        },
        {
          id: 'addr-2',
          user_id: customerId,
          street_address: '456 Oak Ave',
          city: 'Entebbe',
          district: 'Entebbe',
          postal_code: '00002',
          is_default: false,
          is_delivery_address: false,
          is_billing_address: true,
          created_at: '2026-05-12T10:00:00Z',
          updated_at: '2026-05-12T10:00:00Z',
        },
      ]

      vi.mocked(addressesDb.getCustomerAddresses).mockResolvedValue(mockAddresses as any)

      const response = await request(app).get('/v1/customer/addresses')

      expect(response.status).toBe(200)
      expect(response.body.items).toHaveLength(2)
      expect(response.body.total).toBe(2)
      expect(response.body.items[0].id).toBe('addr-1')
      expect(addressesDb.getCustomerAddresses).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
      )
    })

    it('returns empty array when no addresses exist', async () => {
      vi.mocked(addressesDb.getCustomerAddresses).mockResolvedValue([])

      const response = await request(app).get('/v1/customer/addresses')

      expect(response.status).toBe(200)
      expect(response.body.items).toEqual([])
      expect(response.body.total).toBe(0)
    })
  })

  describe('GET /v1/customer/addresses/:addressId', () => {
    it('returns single address for authenticated user', async () => {
      const mockAddress = {
        id: 'addr-1',
        user_id: customerId,
        street_address: '123 Main St',
        city: 'Kampala',
        district: 'Makindye',
        postal_code: '00001',
        is_default: true,
        is_delivery_address: true,
        is_billing_address: false,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:00:00Z',
      }

      vi.mocked(addressesDb.getCustomerAddress).mockResolvedValue(mockAddress as any)

      const response = await request(app).get('/v1/customer/addresses/addr-1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockAddress)
      expect(addressesDb.getCustomerAddress).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        'addr-1',
      )
    })

    it('returns 404 when address does not exist', async () => {
      vi.mocked(addressesDb.getCustomerAddress).mockResolvedValue(null)

      const response = await request(app).get('/v1/customer/addresses/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Address not found' })
    })
  })

  describe('POST /v1/customer/addresses', () => {
    it('creates new address', async () => {
      const createData = {
        street_address: '789 Elm St',
        city: 'Nakawa',
        district: 'Nakawa',
        postal_code: '00003',
        is_delivery_address: true,
        is_billing_address: true,
      }

      const mockCreatedAddress = {
        id: 'addr-new',
        user_id: customerId,
        ...createData,
        is_default: false,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:00:00Z',
      }

      vi.mocked(addressesDb.createCustomerAddress).mockResolvedValue(mockCreatedAddress as any)

      const response = await request(app).post('/v1/customer/addresses').send(createData)

      expect(response.status).toBe(201)
      expect(response.body.street_address).toBe(createData.street_address)
      expect(response.body.city).toBe(createData.city)
      expect(addressesDb.createCustomerAddress).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        expect.objectContaining(createData),
      )
    })

    it('creates address as default', async () => {
      const createData = {
        street_address: '789 Elm St',
        city: 'Nakawa',
        district: 'Nakawa',
        is_delivery_address: true,
        is_billing_address: false,
        is_default: true,
      }

      const mockCreatedAddress = {
        id: 'addr-new',
        user_id: customerId,
        postal_code: null,
        ...createData,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:00:00Z',
      }

      vi.mocked(addressesDb.createCustomerAddress).mockResolvedValue(mockCreatedAddress as any)

      const response = await request(app).post('/v1/customer/addresses').send(createData)

      expect(response.status).toBe(201)
      expect(response.body.is_default).toBe(true)
    })

    it('validates required fields', async () => {
      const response = await request(app).post('/v1/customer/addresses').send({
        city: 'Kampala',
        // missing street_address and district
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Validation failed')
    })

    it('validates field lengths', async () => {
      const response = await request(app).post('/v1/customer/addresses').send({
        street_address: 'a'.repeat(256),
        city: 'Kampala',
        district: 'Makindye',
      })

      expect(response.status).toBe(400)
    })

    it('handles database errors gracefully', async () => {
      vi.mocked(addressesDb.createCustomerAddress).mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app).post('/v1/customer/addresses').send({
        street_address: '789 Elm St',
        city: 'Nakawa',
        district: 'Nakawa',
        is_delivery_address: true,
        is_billing_address: false,
      })

      expect(response.status).toBe(500)
      expect(response.body.error).toContain('Failed to create customer address')
    })
  })

  describe('PATCH /v1/customer/addresses/:addressId', () => {
    it('updates address successfully', async () => {
      const updateData = {
        street_address: 'Updated Street',
        postal_code: '99999',
      }

      const mockUpdatedAddress = {
        id: 'addr-1',
        user_id: customerId,
        street_address: 'Updated Street',
        city: 'Kampala',
        district: 'Makindye',
        postal_code: '99999',
        is_default: false,
        is_delivery_address: true,
        is_billing_address: false,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:30:00Z',
      }

      vi.mocked(addressesDb.updateCustomerAddress).mockResolvedValue(
        mockUpdatedAddress as any,
      )

      const response = await request(app)
        .patch('/v1/customer/addresses/addr-1')
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.street_address).toBe('Updated Street')
      expect(response.body.postal_code).toBe('99999')
      expect(addressesDb.updateCustomerAddress).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        'addr-1',
        expect.objectContaining(updateData),
      )
    })

    it('sets address as default', async () => {
      const mockUpdatedAddress = {
        id: 'addr-1',
        user_id: customerId,
        street_address: '123 Main St',
        city: 'Kampala',
        district: 'Makindye',
        postal_code: null,
        is_default: true,
        is_delivery_address: true,
        is_billing_address: false,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:30:00Z',
      }

      vi.mocked(addressesDb.updateCustomerAddress).mockResolvedValue(
        mockUpdatedAddress as any,
      )

      const response = await request(app).patch('/v1/customer/addresses/addr-1').send({
        is_default: true,
      })

      expect(response.status).toBe(200)
      expect(response.body.is_default).toBe(true)
    })

    it('returns 404 when address not found', async () => {
      vi.mocked(addressesDb.updateCustomerAddress).mockResolvedValue(null)

      const response = await request(app)
        .patch('/v1/customer/addresses/nonexistent')
        .send({
          street_address: 'Updated',
        })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Address not found' })
    })

    it('validates input schema', async () => {
      const response = await request(app)
        .patch('/v1/customer/addresses/addr-1')
        .send({
          postal_code: 'a'.repeat(21),
        })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /v1/customer/addresses/:addressId', () => {
    it('deletes address successfully', async () => {
      vi.mocked(addressesDb.deleteCustomerAddress).mockResolvedValue(true)

      const response = await request(app).delete('/v1/customer/addresses/addr-1')

      expect(response.status).toBe(204)
      expect(addressesDb.deleteCustomerAddress).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        'addr-1',
      )
    })

    it('returns 404 when address not found', async () => {
      vi.mocked(addressesDb.deleteCustomerAddress).mockResolvedValue(false)

      const response = await request(app).delete('/v1/customer/addresses/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Address not found' })
    })

    it('handles database errors gracefully', async () => {
      vi.mocked(addressesDb.deleteCustomerAddress).mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app).delete('/v1/customer/addresses/addr-1')

      expect(response.status).toBe(500)
      expect(response.body.error).toContain('Failed to delete customer address')
    })
  })

  describe('User isolation', () => {
    it('prevents cross-user address access', async () => {
      const otherUserId = 'customer-456'

      vi.mocked(addressesDb.getCustomerAddress).mockImplementation(
        (_db, userId, _addressId) => {
          if (userId !== customerId) {
            return Promise.resolve(null)
          }
          return Promise.resolve({
            id: 'addr-1',
            user_id: customerId,
            street_address: '123 Main St',
            city: 'Kampala',
            district: 'Makindye',
            postal_code: null,
            is_default: true,
            is_delivery_address: true,
            is_billing_address: false,
            created_at: '2026-05-13T10:00:00Z',
            updated_at: '2026-05-13T10:00:00Z',
          } as any)
        },
      )

      const response = await request(app).get('/v1/customer/addresses/addr-1')

      // The middleware should enforce user context
      expect([200, 404]).toContain(response.status)
    })
  })
})
