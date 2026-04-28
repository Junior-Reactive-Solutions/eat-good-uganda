 

import { pool, getCustomerById } from '@eatgood/db'
import {
  customerSignupSchema,
  customerLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import { clearAuthCookies, setAuthCookies } from '../../lib/cookies'
import { authenticateToken } from '../../middleware/authenticateToken'
import { authRateLimit } from '../../middleware/rateLimit'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'
import {
  forgotPasswordCustomer,
  loginCustomer,
  logoutCustomer,
  refreshCustomerSession,
  resetPasswordCustomer,
  signupCustomer,
  verifyEmailCustomer,
} from '../../services/auth/customer'

export const customerAuthRouter = createRouter() as Router

customerAuthRouter.post('/signup', authRateLimit, async (req, res) => {
  try {
    const body = customerSignupSchema.parse(req.body) as {
      email: string
      password: string
      full_name: string
      phone?: string
    }

    const customer = await signupCustomer(pool, body)

    return res.status(201).json({
      user: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        phone: customer.phone,
        email_verified_at: customer.email_verified_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'email already registered') {
      return res.status(409).json({ error: 'email already registered' })
    }
    return res.status(400).json({ error: (error as Error).message })
  }
})

customerAuthRouter.post('/login', authRateLimit, async (req, res) => {
  try {
    const body = customerLoginSchema.parse(req.body)

    const { customer, accessToken, refreshToken, csrfToken, expiresAt } = await loginCustomer(
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
      namespace: 'customer',
      expiresAt,
    })

    return res.status(200).json({
      user: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        phone: customer.phone,
        email_verified_at: customer.email_verified_at,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'email_not_verified') {
      return res.status(403).json({ error: 'email_not_verified' })
    }
    return res.status(401).json({ error: 'invalid credentials' })
  }
})

customerAuthRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = (req.cookies as Record<string, string | undefined>)['eg_customer_rt']

    if (refreshToken) {
      await logoutCustomer(pool, refreshToken)
    }

    clearAuthCookies(res, 'customer')

    return res.status(204).end()
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

customerAuthRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = (req.cookies as Record<string, string | undefined>)['eg_customer_rt']

    if (!refreshToken) {
      return res.status(401).json({ error: 'no refresh token' })
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken,
      expiresAt,
    } = await refreshCustomerSession(pool, refreshToken, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    setAuthCookies(res, {
      accessToken,
      refreshTokenRaw: newRefreshToken,
      csrfToken,
      namespace: 'customer',
      expiresAt,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    clearAuthCookies(res, 'customer')
    return res.status(401).json({ error: (error as Error).message })
  }
})

customerAuthRouter.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const body = forgotPasswordSchema.parse(req.body)

    await forgotPasswordCustomer(pool, body.email)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

customerAuthRouter.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body)

    await resetPasswordCustomer(pool, body)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

customerAuthRouter.post('/verify-email', async (req, res) => {
  try {
    const body = verifyEmailSchema.parse(req.body)

    await verifyEmailCustomer(pool, body)

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

customerAuthRouter.get(
  '/me',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req, res) => {
    try {
      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'unauthorized' })
      }

      const customerId = req.auth.sub
      const customer = await getCustomerById(pool, customerId)

      if (!customer) {
        return res.status(404).json({ error: 'customer not found' })
      }

      return res.status(200).json({
        user: {
          id: customer.id,
          email: customer.email,
          full_name: customer.full_name,
          phone: customer.phone,
          email_verified_at: customer.email_verified_at,
          marketing_opt_in: customer.marketing_opt_in,
        },
      })
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message })
    }
  },
)
