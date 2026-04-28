 

import { pool, getSuperAdminById } from '@eatgood/db'
import { adminLoginSchema } from '@eatgood/shared'
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import { clearAuthCookies, setAuthCookies } from '../../lib/cookies'
import { authenticateToken } from '../../middleware/authenticateToken'
import { authRateLimit } from '../../middleware/rateLimit'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'
import { loginAdmin, logoutAdmin, refreshAdminSession } from '../../services/auth/admin'

export const adminAuthRouter = createRouter() as Router

adminAuthRouter.post('/login', authRateLimit, async (req, res) => {
  try {
    const body = adminLoginSchema.parse(req.body)

    const { accessToken, refreshToken, csrfToken, expiresAt } = await loginAdmin(pool, body, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    setAuthCookies(res, {
      accessToken,
      refreshTokenRaw: refreshToken,
      csrfToken,
      namespace: 'admin',
      expiresAt,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid totp code') {
      return res.status(401).json({ error: 'invalid totp code' })
    }
    return res.status(401).json({ error: 'invalid credentials' })
  }
})

adminAuthRouter.post('/logout', async (req, res) => {
  try {
    const refreshToken = (req.cookies as Record<string, string | undefined>)['eg_admin_rt']

    if (refreshToken) {
      await logoutAdmin(pool, refreshToken)
    }

    clearAuthCookies(res, 'admin')

    return res.status(204).end()
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

adminAuthRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = (req.cookies as Record<string, string | undefined>)['eg_admin_rt']

    if (!refreshToken) {
      return res.status(401).json({ error: 'no refresh token' })
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken,
      expiresAt,
    } = await refreshAdminSession(pool, refreshToken, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    setAuthCookies(res, {
      accessToken,
      refreshTokenRaw: newRefreshToken,
      csrfToken,
      namespace: 'admin',
      expiresAt,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    clearAuthCookies(res, 'admin')
    return res.status(401).json({ error: (error as Error).message })
  }
})

adminAuthRouter.get(
  '/me',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'unauthorized' })
      }

      const adminId = req.auth.sub
      const admin = await getSuperAdminById(pool, adminId)

      if (!admin) {
        return res.status(404).json({ error: 'admin not found' })
      }

      return res.status(200).json({
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
        },
      })
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message })
    }
  },
)
