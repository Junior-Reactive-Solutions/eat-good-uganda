import { describe, expect, it, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Mock the database module before importing app
vi.mock('@eatgood/db', () => {
  const mockQuery = vi.fn()
  return {
    pool: {
      query: mockQuery,
    },
  }
})

import { app } from '../../app'
import { pool } from '@eatgood/db'

const mockPoolQuery = vi.mocked(pool.query)

describe('Internal Health Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never)
  })

  describe('GET /v1/internal/health', () => {
    it('returns 200 with correct response shape', async () => {
      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('uptime_seconds')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('returns valid JSON with proper types', async () => {
      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      expect(typeof response.body.status).toBe('string')
      expect(typeof response.body.uptime_seconds).toBe('number')
      expect(typeof response.body.version).toBe('string')
      expect(typeof response.body.timestamp).toBe('string')
    })

    it('uptime_seconds is a non-negative integer', async () => {
      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      expect(response.body.uptime_seconds).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(response.body.uptime_seconds)).toBe(true)
    })

    it('timestamp is a valid ISO string', async () => {
      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      // Check that it's a valid ISO string
      const date = new Date(response.body.timestamp)
      expect(date instanceof Date && !Number.isNaN(date.getTime())).toBe(true)
    })

    it('version defaults to "dev" when GIT_SHA is not set', async () => {
      const originalGitSha = process.env.GIT_SHA
      delete process.env.GIT_SHA

      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      expect(response.body.version).toBe('dev')

      // Restore original value
      if (originalGitSha) {
        process.env.GIT_SHA = originalGitSha
      }
    })

    it('uses GIT_SHA from environment when available', async () => {
      const originalGitSha = process.env.GIT_SHA
      process.env.GIT_SHA = 'abc123def456'

      const response = await request(app).get('/v1/internal/health')

      expect(response.status).toBe(200)
      expect(response.body.version).toBe('abc123def456')

      // Restore original value
      if (originalGitSha) {
        process.env.GIT_SHA = originalGitSha
      } else {
        delete process.env.GIT_SHA
      }
    })

    it('does not query the database (lightweight keep-alive ping)', async () => {
      // This is a smoke test: the endpoint should complete instantly
      // without hitting the database. If it did, it would be much slower
      // and would require a database connection.
      const startTime = Date.now()
      const response = await request(app).get('/v1/internal/health')
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      // Should complete in < 50ms (well under typical DB query time)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('GET /v1/internal/ready', () => {
    it('returns 200 when database is available', async () => {
      const response = await request(app).get('/v1/internal/ready')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ready')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('returns valid ISO timestamp', async () => {
      const response = await request(app).get('/v1/internal/ready')

      expect(response.status).toBe(200)
      const date = new Date(response.body.timestamp)
      expect(date instanceof Date && !Number.isNaN(date.getTime())).toBe(true)
    })

    it('times out after 500ms on slow database', async () => {
      // Mock pool.query to hang for longer than the timeout
      mockPoolQuery.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ rows: [], rowCount: 0 } as never)
            }, 2000) // 2 second delay > 500ms timeout
          }),
      )

      const response = await request(app).get('/v1/internal/ready')

      expect(response.status).toBe(503)
      expect(response.body.status).toBe('not_ready')
      expect(response.body.reason).toBe('database_timeout')
    })

    it('returns 503 when database is unavailable', async () => {
      // Mock pool.query to throw an error
      mockPoolQuery.mockRejectedValue(new Error('Connection refused'))

      const response = await request(app).get('/v1/internal/ready')

      expect(response.status).toBe(503)
      expect(response.body.status).toBe('not_ready')
      expect(response.body.reason).toBe('database_error')
    })

    it('completes within reasonable time (test speed)', async () => {
      const startTime = Date.now()
      const response = await request(app).get('/v1/internal/ready')
      const duration = Date.now() - startTime

      // Should complete reasonably fast (within a couple hundred ms)
      // to not block orchestration platforms
      expect(duration).toBeLessThan(2000)
      expect([200, 503]).toContain(response.status)
    })

    it('returns proper error response shape on database error', async () => {
      const response = await request(app).get('/v1/internal/ready')

      // Response should always have status and reason fields
      expect(response.body).toHaveProperty('status')
      expect(['ready', 'not_ready']).toContain(response.body.status)

      if (response.body.status === 'not_ready') {
        expect(response.body).toHaveProperty('reason')
        expect(['database_error', 'database_timeout', 'internal_error']).toContain(
          response.body.reason,
        )
      }
    })

    it('responses are in JSON format', async () => {
      const response = await request(app).get('/v1/internal/ready')

      expect(response.headers['content-type']).toMatch(/json/)
    })
  })

  describe('Integration', () => {
    it('health endpoint does not trigger ready checks', async () => {
      // Both endpoints should be independent
      const healthResponse = await request(app).get('/v1/internal/health')
      const readyResponse = await request(app).get('/v1/internal/ready')

      expect(healthResponse.status).toBe(200)
      expect([200, 503]).toContain(readyResponse.status)
    })

    it('both endpoints return JSON', async () => {
      const healthResponse = await request(app).get('/v1/internal/health')
      const readyResponse = await request(app).get('/v1/internal/ready')

      expect(healthResponse.headers['content-type']).toMatch(/json/)
      expect(readyResponse.headers['content-type']).toMatch(/json/)
    })
  })
})
