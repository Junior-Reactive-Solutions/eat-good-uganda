/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import type { RequestHandler } from 'express'

const PROTECTED_METHODS = ['POST', 'PATCH', 'DELETE', 'PUT']
const EXEMPT_PATHS_PATTERNS = [
  /^\/v1\/webhooks\//,
  /^\/v1\/internal\//,
  /^\/v1\/public\//,
  // Auth bootstrap endpoints (login/signup/refresh/logout/verify/reset) cannot
  // carry a CSRF token on the first request — they are protected by credentials
  // and httpOnly refresh tokens instead.
  /^\/v1\/(admin|bakery|customer)\/auth\//,
]

function isExempt(path: string): boolean {
  return EXEMPT_PATHS_PATTERNS.some((pattern) => pattern.test(path))
}

export const csrf: RequestHandler = (req, res, next) => {
  if (!PROTECTED_METHODS.includes(req.method) || isExempt(req.path)) {
    next()
    return
  }

  const cookieToken = req.cookies['eg_csrf']
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'csrf token mismatch' })
  }

  next()
}
