import type { RequestHandler } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'

vi.mock('@eatgood/db', () => ({
  pool: {},
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
// every state-changing method. This helper attaches a valid pair so PATCH/
// DELETE requests reach the route handler instead of being rejected with 403.
const CSRF_TOKEN = 'test-csrf-token'

function withCsrf<T extends { set: (field: string, val: string | string[]) => T }>(req: T): T {
  return req.set('Cookie', [`eg_csrf=${CSRF_TOKEN}`]).set('x-csrf-token', CSRF_TOKEN)
}

describe('Customer Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /v1/customer/notifications', () => {
    it('returns an empty paginated list (MVP has no notification_log table yet)', async () => {
      const response = await request(app).get('/v1/customer/notifications')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      })
    })

    it('respects limit and offset query params', async () => {
      const response = await request(app)
        .get('/v1/customer/notifications')
        .query({ limit: 10, offset: 30 })

      expect(response.status).toBe(200)
      expect(response.body.pageSize).toBe(10)
      expect(response.body.page).toBe(4)
    })

    it('caps limit at 100', async () => {
      const response = await request(app).get('/v1/customer/notifications').query({ limit: 500 })

      expect(response.status).toBe(200)
      expect(response.body.pageSize).toBe(100)
    })

    it('falls back to defaults for non-numeric params', async () => {
      const response = await request(app)
        .get('/v1/customer/notifications')
        .query({ limit: 'abc', offset: 'xyz' })

      expect(response.status).toBe(200)
      expect(response.body.pageSize).toBe(20)
      expect(response.body.page).toBe(1)
    })
  })

  describe('PATCH /v1/customer/notifications/:id/read', () => {
    it('marks a notification as read', async () => {
      const response = await withCsrf(request(app).patch('/v1/customer/notifications/notif-1/read'))

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'notif-1',
        read: true,
        message: 'Notification marked as read',
      })
    })

    it('rejects the request without a CSRF token', async () => {
      const response = await request(app).patch('/v1/customer/notifications/notif-1/read')

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /v1/customer/notifications/:id', () => {
    it('deletes a notification', async () => {
      const response = await withCsrf(request(app).delete('/v1/customer/notifications/notif-1'))

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'notif-1',
        message: 'Notification deleted',
      })
    })

    it('rejects the request without a CSRF token', async () => {
      const response = await request(app).delete('/v1/customer/notifications/notif-1')

      expect(response.status).toBe(403)
    })
  })

  describe('PATCH /v1/customer/notifications/mark-all-read', () => {
    it('marks all notifications as read', async () => {
      const response = await withCsrf(
        request(app).patch('/v1/customer/notifications/mark-all-read'),
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'All notifications marked as read' })
    })

    it('is not shadowed by the /:id/read route', async () => {
      // Regression guard: 'mark-all-read' must not be captured as an :id by
      // the earlier-registered PATCH /:id/read route.
      const response = await withCsrf(
        request(app).patch('/v1/customer/notifications/mark-all-read'),
      )

      expect(response.body.message).toBe('All notifications marked as read')
      expect(response.body).not.toHaveProperty('read')
    })

    it('rejects the request without a CSRF token', async () => {
      const response = await request(app).patch('/v1/customer/notifications/mark-all-read')

      expect(response.status).toBe(403)
    })
  })
})
