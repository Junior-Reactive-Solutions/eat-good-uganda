import type { RequestHandler } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'

const mockPoolQuery = vi.fn()

vi.mock('@eatgood/db', () => ({
  pool: { query: (...args: unknown[]) => mockPoolQuery(...args) },
}))

vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (): RequestHandler => (req, _res, next) => {
    req.auth = { kind: 'customer', sub: 'customer-123' }
    next()
  },
}))

vi.mock('../../middleware/requireCustomerContext', () => ({
  requireCustomerContext: ((req, _res, next) => {
    req.customer = { id: 'customer-123', bakery_id: 'n/a' }
    req.db = {} as typeof req.db
    next()
  }) as RequestHandler,
}))

// The global CSRF middleware (app.ts) requires a matching cookie + header on
// every state-changing method. This helper attaches a valid pair so POST/PATCH
// requests reach the route handler instead of being rejected with 403.
const CSRF_TOKEN = 'test-csrf-token'

function withCsrf<T extends { set: (field: string, val: string | string[]) => T }>(req: T): T {
  return req.set('Cookie', [`eg_csrf=${CSRF_TOKEN}`]).set('x-csrf-token', CSRF_TOKEN)
}

function customerRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'customer-123',
    email: 'jane@example.com',
    email_verified_at: null,
    phone: '+256700000000',
    full_name: 'Jane Doe',
    marketing_opt_in: false,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('Customer Account Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /v1/customer/account-settings', () => {
    it('returns account settings for the authenticated customer', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [customerRow()] })

      const response = await request(app).get('/v1/customer/account-settings')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'customer-123',
        email: 'jane@example.com',
        email_verified: false,
        phone: '+256700000000',
        full_name: 'Jane Doe',
        marketing_opt_in: false,
        notification_preferences: {
          email_orders: true,
          email_promotions: false,
          sms_orders: false,
        },
        language: 'en',
        privacy_mode: false,
        created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      })
    })

    it('reflects marketing_opt_in into email_promotions', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [customerRow({ marketing_opt_in: true })] })

      const response = await request(app).get('/v1/customer/account-settings')

      expect(response.status).toBe(200)
      expect(response.body.notification_preferences.email_promotions).toBe(true)
    })

    it('returns 404 when the customer no longer exists', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] })

      const response = await request(app).get('/v1/customer/account-settings')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Customer not found' })
    })

    it('returns 500 and logs the failure for an unexpected error', async () => {
      mockPoolQuery.mockRejectedValue(new Error('Database error'))

      const response = await request(app).get('/v1/customer/account-settings')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Failed to fetch account settings' })
    })
  })

  describe('PATCH /v1/customer/account-settings', () => {
    it('accepts a partial update and echoes defaults for omitted fields', async () => {
      const response = await withCsrf(request(app).patch('/v1/customer/account-settings')).send({
        language: 'sw',
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'customer-123',
        notification_preferences: {
          email_orders: true,
          email_promotions: false,
          sms_orders: false,
        },
        language: 'sw',
        privacy_mode: false,
      })
    })

    it('echoes back supplied notification_preferences and privacy_mode', async () => {
      const response = await withCsrf(request(app).patch('/v1/customer/account-settings')).send({
        notification_preferences: { email_orders: false, sms_orders: true },
        privacy_mode: true,
      })

      expect(response.status).toBe(200)
      expect(response.body.notification_preferences).toEqual({
        email_orders: false,
        sms_orders: true,
      })
      expect(response.body.privacy_mode).toBe(true)
    })

    it('returns 400 with validation details for an unknown field', async () => {
      const response = await withCsrf(request(app).patch('/v1/customer/account-settings')).send({
        unknown_field: true,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request body')
      expect(response.body.details).toBeDefined()
    })

    it('returns 400 with validation details for an invalid language', async () => {
      const response = await withCsrf(request(app).patch('/v1/customer/account-settings')).send({
        language: 'fr',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request body')
    })
  })

  describe('POST /v1/customer/account-settings/change-password', () => {
    it('changes the password with valid input', async () => {
      const response = await withCsrf(
        request(app).post('/v1/customer/account-settings/change-password'),
      ).send({
        current_password: 'OldPassword123',
        new_password: 'NewPassword456',
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'Password changed successfully' })
    })

    it('returns 400 with per-field messages when new_password is too short', async () => {
      const response = await withCsrf(
        request(app).post('/v1/customer/account-settings/change-password'),
      ).send({
        current_password: 'OldPassword123',
        new_password: 'short',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request body')
      expect(response.body.details).toContain('Password must be at least 8 characters')
    })

    it('returns 400 when current_password is missing', async () => {
      const response = await withCsrf(
        request(app).post('/v1/customer/account-settings/change-password'),
      ).send({
        new_password: 'NewPassword456',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /v1/customer/account-settings/verify-email', () => {
    it('sends a verification email', async () => {
      const response = await withCsrf(
        request(app).post('/v1/customer/account-settings/verify-email'),
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'Verification email sent' })
    })
  })

  describe('POST /v1/customer/account-settings/verify-phone', () => {
    it('sends an OTP to the phone', async () => {
      const response = await withCsrf(
        request(app).post('/v1/customer/account-settings/verify-phone'),
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'OTP sent to phone' })
    })
  })

  describe('CSRF protection', () => {
    it('rejects PATCH without a CSRF token', async () => {
      const response = await request(app).patch('/v1/customer/account-settings').send({})

      expect(response.status).toBe(403)
    })

    it('rejects POST change-password without a CSRF token', async () => {
      const response = await request(app)
        .post('/v1/customer/account-settings/change-password')
        .send({ current_password: 'a', new_password: 'NewPassword456' })

      expect(response.status).toBe(403)
    })
  })
})
