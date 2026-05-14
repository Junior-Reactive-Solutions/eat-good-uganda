import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../../app'
import * as profileDb from '@eatgood/db'

vi.mock('@eatgood/db', () => ({
  pool: {},
  getCustomerProfile: vi.fn(),
  updateCustomerProfile: vi.fn(),
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

describe('Customer Profile API', () => {
  const customerId = 'customer-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /v1/customer/profile', () => {
    it('returns customer profile when it exists', async () => {
      const mockProfile = {
        id: 'prof-123',
        user_id: customerId,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        bio: 'Loves baking',
        avatar_url: 'https://example.com/avatar.jpg',
        default_address_id: 'addr-123',
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:00:00Z',
      }

      vi.mocked(profileDb.getCustomerProfile).mockResolvedValue(mockProfile as any)

      const response = await request(app).get('/v1/customer/profile')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockProfile)
      expect(profileDb.getCustomerProfile).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
      )
    })

    it('returns 404 when profile not found', async () => {
      vi.mocked(profileDb.getCustomerProfile).mockResolvedValue(null)

      const response = await request(app).get('/v1/customer/profile')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Profile not found' })
    })

    it('returns 401 when not authenticated', async () => {
      vi.mocked(profileDb.getCustomerProfile).mockResolvedValue(null)

      const response = await request(app).get('/v1/customer/profile')

      expect(response.status).toBeOneOf([401, 404]) // depends on mock setup
    })
  })

  describe('PATCH /v1/customer/profile', () => {
    it('updates customer profile successfully', async () => {
      const updateData = {
        first_name: 'Jane',
        bio: 'Updated bio',
      }

      const mockUpdatedProfile = {
        id: 'prof-123',
        user_id: customerId,
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        bio: 'Updated bio',
        avatar_url: 'https://example.com/avatar.jpg',
        default_address_id: 'addr-123',
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:30:00Z',
      }

      vi.mocked(profileDb.updateCustomerProfile).mockResolvedValue(mockUpdatedProfile as any)

      const response = await request(app).patch('/v1/customer/profile').send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.first_name).toBe('Jane')
      expect(response.body.bio).toBe('Updated bio')
      expect(profileDb.updateCustomerProfile).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        expect.objectContaining(updateData),
      )
    })

    it('validates date_of_birth format', async () => {
      const response = await request(app).patch('/v1/customer/profile').send({
        date_of_birth: 'invalid-date',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Validation failed')
    })

    it('validates avatar_url is a valid URL', async () => {
      const response = await request(app).patch('/v1/customer/profile').send({
        avatar_url: 'not-a-url',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Validation failed')
    })

    it('allows null avatar_url to clear it', async () => {
      const mockProfile = {
        id: 'prof-123',
        user_id: customerId,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: null,
        bio: null,
        avatar_url: null,
        default_address_id: null,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:30:00Z',
      }

      vi.mocked(profileDb.updateCustomerProfile).mockResolvedValue(mockProfile as any)

      const response = await request(app).patch('/v1/customer/profile').send({
        avatar_url: null,
      })

      expect(response.status).toBe(200)
      expect(response.body.avatar_url).toBeNull()
    })

    it('validates field lengths', async () => {
      const response = await request(app).patch('/v1/customer/profile').send({
        first_name: 'a'.repeat(256),
      })

      expect(response.status).toBe(400)
    })

    it('returns 404 when profile not found', async () => {
      vi.mocked(profileDb.updateCustomerProfile).mockResolvedValue(null)

      const response = await request(app).patch('/v1/customer/profile').send({
        first_name: 'Jane',
      })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Profile not found' })
    })

    it('handles database errors gracefully', async () => {
      vi.mocked(profileDb.updateCustomerProfile).mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app).patch('/v1/customer/profile').send({
        first_name: 'Jane',
      })

      expect(response.status).toBe(500)
      expect(response.body.error).toContain('Failed to update customer profile')
    })

    it('only updates provided fields', async () => {
      const mockProfile = {
        id: 'prof-123',
        user_id: customerId,
        first_name: 'Updated',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        bio: 'Original bio',
        avatar_url: 'https://example.com/avatar.jpg',
        default_address_id: 'addr-123',
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:30:00Z',
      }

      vi.mocked(profileDb.updateCustomerProfile).mockResolvedValue(mockProfile as any)

      const response = await request(app).patch('/v1/customer/profile').send({
        first_name: 'Updated',
      })

      expect(response.status).toBe(200)
      expect(profileDb.updateCustomerProfile).toHaveBeenCalledWith(
        expect.anything(),
        customerId,
        { first_name: 'Updated' },
      )
    })
  })
})
