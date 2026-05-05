/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import type { RequestHandler } from 'express'

import { verifyAccessToken } from '../lib/tokens'

const COOKIE_NAMES = {
  customer: 'eg_customer_at',
  bakery: 'eg_bakery_at',
  admin: 'eg_admin_at',
}

const TOKEN_KIND_MAP = {
  customer: 'customer' as const,
  bakery: 'bakery_user' as const,
  admin: 'super_admin' as const,
}

export function authenticateToken(namespace: 'customer' | 'bakery' | 'admin'): RequestHandler {
  return (req, res, next) => {
    const cookieName = COOKIE_NAMES[namespace]
    const token = req.cookies[cookieName]

    if (!token) {
      req.auth = null
      next()
      return
    }

    try {
      const tokenKind = TOKEN_KIND_MAP[namespace]
      const decoded = verifyAccessToken(tokenKind, token as string)
      req.auth = decoded
    } catch {
      req.auth = null
    }

    next()
  }
}
