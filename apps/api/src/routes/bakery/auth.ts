/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

import { pool, getBakeryUserById } from '@eatgood/db'
import {
  bakerySignupSchema,
  bakeryLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import { clearAuthCookies, setAuthCookies } from '../../lib/cookies'
import { authenticateToken } from '../../middleware/authenticateToken'
import { authRateLimit } from '../../middleware/rateLimit'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'
import {
  forgotPasswordBakery,
  loginBakery,
  logoutBakery,
  refreshBakerySession,
  resetPasswordBakery,
  signupBakery,
  verifyEmailBakery,
} from '../../services/auth/bakery'

export const bakeryAuthRouter = createRouter() as Router

bakeryAuthRouter.post('/signup', authRateLimit, async (req, res) => {
  try {
    const body = bakerySignupSchema.parse(req.body)

    const { bakery, owner } = await signupBakery(pool, body)

    return res.status(201).json({
      bakery: {
        id: bakery.id,
        slug: bakery.slug,
        display_name: bakery.display_name,
        status: bakery.status,
      },
      owner: {
        id: owner.id,
        email: owner.email,
        full_name: owner.full_name,
      },
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'email already registered' ||
        error.message === 'bakery slug already taken')
    ) {
      return res.status(409).json({ error: error.message })
    }
    return res.status(400).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.post('/login', authRateLimit, async (req, res) => {
  try {
    const body = bakeryLoginSchema.parse(req.body)

    const { user, accessToken, refreshToken, csrfToken, expiresAt } = await loginBakery(
      pool,
      body,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    )

    setAuthCookies(res, {
      accessToken,
      refreshTokenRaw: refreshToken,
      csrfToken,
      namespace: 'bakery',
      expiresAt,
    })

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        bakery_id: user.bakery_id,
        role: user.role,
        email_verified_at: user.email_verified_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'email_not_verified') {
      return res.status(403).json({ error: 'email_not_verified' })
    }
    return res.status(401).json({ error: 'invalid credentials' })
  }
})

bakeryAuthRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies['eg_bakery_rt']

    if (refreshToken) {
      await logoutBakery(pool, refreshToken)
    }

    clearAuthCookies(res, 'bakery')

    return res.status(204).end()
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies['eg_bakery_rt']

    if (!refreshToken) {
      return res.status(401).json({ error: 'no refresh token' })
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken,
      expiresAt,
    } = await refreshBakerySession(pool, refreshToken, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    setAuthCookies(res, {
      accessToken,
      refreshTokenRaw: newRefreshToken,
      csrfToken,
      namespace: 'bakery',
      expiresAt,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    clearAuthCookies(res, 'bakery')
    return res.status(401).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const body = forgotPasswordSchema.parse(req.body)

    await forgotPasswordBakery(pool, body.email)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body)

    await resetPasswordBakery(pool, body)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.post('/verify-email', async (req, res) => {
  try {
    const body = verifyEmailSchema.parse(req.body)

    await verifyEmailBakery(pool, body)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

bakeryAuthRouter.get(
  '/me',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req, res) => {
    try {
      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'unauthorized' })
      }

      const userId = req.auth.sub
      const user = await getBakeryUserById(pool, userId)

      if (!user) {
        return res.status(404).json({ error: 'user not found' })
      }

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          bakery_id: user.bakery_id,
          role: user.role,
          email_verified_at: user.email_verified_at,
        },
      })
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message })
    }
  },
)
