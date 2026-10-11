import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'
import { logger } from '../../lib/logger'
import { loginBakery } from '../../services/auth/bakery'

vi.mock('@eatgood/db', () => ({
  pool: {},
  getBakeryUserById: vi.fn(),
}))

vi.mock('../../services/auth/bakery', () => ({
  loginBakery: vi.fn(),
  signupBakery: vi.fn(),
  logoutBakery: vi.fn(),
  refreshBakerySession: vi.fn(),
  forgotPasswordBakery: vi.fn(),
  resetPasswordBakery: vi.fn(),
  verifyEmailBakery: vi.fn(),
}))

vi.mock('../../lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

describe('POST /v1/bakery/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with a generic message on invalid credentials', async () => {
    vi.mocked(loginBakery).mockRejectedValue(new Error('invalid credentials'))

    const res = await request(app)
      .post('/v1/bakery/auth/login')
      .send({ email: 'owner@example.com', password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'invalid credentials' })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns 403 when the account email is not verified', async () => {
    vi.mocked(loginBakery).mockRejectedValue(new Error('email_not_verified'))

    const res = await request(app)
      .post('/v1/bakery/auth/login')
      .send({ email: 'owner@example.com', password: 'correct-password' })

    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'email_not_verified' })
  })

  it('returns 400 with validation details on a malformed body', async () => {
    const res = await request(app)
      .post('/v1/bakery/auth/login')
      .send({ email: 'not-an-email', password: '' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(loginBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for an unexpected error instead of a fake 401', async () => {
    vi.mocked(loginBakery).mockRejectedValue(
      new Error('password authentication failed for user "neondb_owner"'),
    )

    const res = await request(app)
      .post('/v1/bakery/auth/login')
      .send({ email: 'owner@example.com', password: 'correct-password' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'password authentication failed for user "neondb_owner"',
      }),
      'Bakery login failed unexpectedly',
    )
  })
})
