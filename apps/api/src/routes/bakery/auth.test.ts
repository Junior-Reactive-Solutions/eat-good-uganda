import type { RequestHandler } from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'
import { logger } from '../../lib/logger'
import {
  loginBakery,
  signupBakery,
  logoutBakery,
  refreshBakerySession,
  forgotPasswordBakery,
  resetPasswordBakery,
  verifyEmailBakery,
} from '../../services/auth/bakery'

const getBakeryUserById = vi.fn()

vi.mock('@eatgood/db', () => ({
  pool: {},
  getBakeryUserById: (...args: unknown[]) => getBakeryUserById(...args),
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

vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (): RequestHandler => (req, _res, next) => {
    req.auth = { kind: 'bakery_user', sub: 'user-1', bakery_id: 'bakery-1', role: 'owner' }
    next()
  },
}))

const validSignupBody = {
  email: 'owner@example.com',
  password: 'Str0ngPassword!',
  full_name: 'Jane Doe',
  bakery_slug: 'janes-bakes',
  bakery_legal_name: 'Janes Bakes Ltd',
  bakery_display_name: "Jane's Bakes",
  bakery_phone: '+256700000000',
  bakery_email: 'contact@janesbakes.ug',
  bakery_address_line1: 'Plot 1 Main Street',
  bakery_latitude: 0.3476,
  bakery_longitude: 32.5825,
}

const UNEXPECTED_ERROR = new Error('password authentication failed for user "neondb_owner"')

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
    vi.mocked(loginBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app)
      .post('/v1/bakery/auth/login')
      .send({ email: 'owner@example.com', password: 'correct-password' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery login failed unexpectedly',
    )
  })
})

describe('POST /v1/bakery/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 409 when the email is already registered', async () => {
    vi.mocked(signupBakery).mockRejectedValue(new Error('email already registered'))

    const res = await request(app).post('/v1/bakery/auth/signup').send(validSignupBody)

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'email already registered' })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns 409 when the bakery slug is already taken', async () => {
    vi.mocked(signupBakery).mockRejectedValue(new Error('bakery slug already taken'))

    const res = await request(app).post('/v1/bakery/auth/signup').send(validSignupBody)

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'bakery slug already taken' })
  })

  it('returns 400 with validation details on a malformed body', async () => {
    const res = await request(app).post('/v1/bakery/auth/signup').send({ email: 'not-an-email' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(signupBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(signupBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app).post('/v1/bakery/auth/signup').send(validSignupBody)

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery signup failed unexpectedly',
    )
  })
})

describe('POST /v1/bakery/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 204 when there is no refresh token cookie', async () => {
    const res = await request(app).post('/v1/bakery/auth/logout')

    expect(res.status).toBe(204)
    expect(logoutBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(logoutBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app)
      .post('/v1/bakery/auth/logout')
      .set('Cookie', 'eg_bakery_rt=some-refresh-token')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery logout failed unexpectedly',
    )
  })
})

describe('POST /v1/bakery/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when there is no refresh token cookie', async () => {
    const res = await request(app).post('/v1/bakery/auth/refresh')

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'no refresh token' })
  })

  it.each(['refresh token not found or revoked', 'refresh token expired', 'user not found'])(
    'returns 401 for known session error: %s',
    async (message) => {
      vi.mocked(refreshBakerySession).mockRejectedValue(new Error(message))

      const res = await request(app)
        .post('/v1/bakery/auth/refresh')
        .set('Cookie', 'eg_bakery_rt=some-refresh-token')

      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: message })
      expect(logger.error).not.toHaveBeenCalled()
    },
  )

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(refreshBakerySession).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app)
      .post('/v1/bakery/auth/refresh')
      .set('Cookie', 'eg_bakery_rt=some-refresh-token')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery session refresh failed unexpectedly',
    )
  })
})

describe('POST /v1/bakery/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 with validation details on a malformed body', async () => {
    const res = await request(app)
      .post('/v1/bakery/auth/forgot-password')
      .send({ email: 'not-an-email' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(forgotPasswordBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(forgotPasswordBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app)
      .post('/v1/bakery/auth/forgot-password')
      .send({ email: 'owner@example.com' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery forgot-password request failed unexpectedly',
    )
  })
})

describe('POST /v1/bakery/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for an invalid or expired token', async () => {
    vi.mocked(resetPasswordBakery).mockRejectedValue(new Error('invalid or expired token'))

    const res = await request(app)
      .post('/v1/bakery/auth/reset-password')
      .send({ token: 'tok', password: 'Str0ngPassword!' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'invalid or expired token' })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns 400 with validation details on a malformed body', async () => {
    const res = await request(app)
      .post('/v1/bakery/auth/reset-password')
      .send({ token: '', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(resetPasswordBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for a data anomaly (user not found)', async () => {
    vi.mocked(resetPasswordBakery).mockRejectedValue(new Error('user not found'))

    const res = await request(app)
      .post('/v1/bakery/auth/reset-password')
      .send({ token: 'tok', password: 'Str0ngPassword!' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'user not found' }),
      'Bakery password reset failed unexpectedly',
    )
  })

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(resetPasswordBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app)
      .post('/v1/bakery/auth/reset-password')
      .send({ token: 'tok', password: 'Str0ngPassword!' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
  })
})

describe('POST /v1/bakery/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for an invalid or expired token', async () => {
    vi.mocked(verifyEmailBakery).mockRejectedValue(new Error('invalid or expired token'))

    const res = await request(app).post('/v1/bakery/auth/verify-email').send({ token: 'tok' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'invalid or expired token' })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns 400 with validation details on a malformed body', async () => {
    const res = await request(app).post('/v1/bakery/auth/verify-email').send({ token: '' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(verifyEmailBakery).not.toHaveBeenCalled()
  })

  it('returns 500 and logs the failure for an unexpected error', async () => {
    vi.mocked(verifyEmailBakery).mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app).post('/v1/bakery/auth/verify-email').send({ token: 'tok' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Bakery email verification failed unexpectedly',
    )
  })
})

describe('GET /v1/bakery/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current user on success', async () => {
    getBakeryUserById.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      full_name: 'Jane Doe',
      bakery_id: 'bakery-1',
      role: 'owner',
      email_verified_at: new Date().toISOString(),
    })

    const res = await request(app).get('/v1/bakery/auth/me')

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('owner@example.com')
  })

  it('returns 404 when the user no longer exists', async () => {
    getBakeryUserById.mockResolvedValue(null)

    const res = await request(app).get('/v1/bakery/auth/me')

    expect(res.status).toBe(404)
  })

  it('returns 500 and logs the failure for an unexpected error instead of leaking it', async () => {
    getBakeryUserById.mockRejectedValue(UNEXPECTED_ERROR)

    const res = await request(app).get('/v1/bakery/auth/me')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: UNEXPECTED_ERROR.message }),
      'Fetching bakery user failed unexpectedly',
    )
  })
})
