import type { Response } from 'express'

import { env } from '../env'

const ACCESS_TOKEN_COOKIE_NAMES = {
  customer: 'eg_customer_at',
  bakery: 'eg_bakery_at',
  admin: 'eg_admin_at',
}

const REFRESH_TOKEN_COOKIE_NAMES = {
  customer: 'eg_customer_rt',
  bakery: 'eg_bakery_rt',
  admin: 'eg_admin_rt',
}

const CSRF_TOKEN_COOKIE_NAME = 'eg_csrf'

const isProduction = env.NODE_ENV === 'production'

// In production the API (onrender.com) and the SPAs (vercel.app) are on
// different sites, so auth cookies must be SameSite=None to be sent on
// cross-site XHR. SameSite=None requires Secure. In dev we stay on Lax.
const crossSite = isProduction
const sameSite: 'none' | 'lax' = crossSite ? 'none' : 'lax'
const cookieSecure = crossSite ? true : isProduction

export function setAuthCookies(
  res: Response,
  opts: {
    accessToken: string
    refreshTokenRaw: string
    csrfToken: string
    namespace: 'customer' | 'bakery' | 'admin'
    expiresAt: Date
  },
): void {
  const accessTokenCookieName = ACCESS_TOKEN_COOKIE_NAMES[opts.namespace]
  const refreshTokenCookieName = REFRESH_TOKEN_COOKIE_NAMES[opts.namespace]

  res.cookie(accessTokenCookieName, opts.accessToken, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite,
    path: '/',
    expires: opts.expiresAt,
  })

  res.cookie(refreshTokenCookieName, opts.refreshTokenRaw, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite,
    path: `/v1/${opts.namespace}/auth/refresh`,
    expires: opts.expiresAt,
  })

  res.cookie(CSRF_TOKEN_COOKIE_NAME, opts.csrfToken, {
    httpOnly: false,
    secure: cookieSecure,
    sameSite,
    path: '/',
    expires: opts.expiresAt,
  })
}

export function clearAuthCookies(res: Response, namespace: 'customer' | 'bakery' | 'admin'): void {
  const accessTokenCookieName = ACCESS_TOKEN_COOKIE_NAMES[namespace]
  const refreshTokenCookieName = REFRESH_TOKEN_COOKIE_NAMES[namespace]

  res.clearCookie(accessTokenCookieName, { path: '/' })
  res.clearCookie(refreshTokenCookieName, { path: `/v1/${namespace}/auth/refresh` })
  res.clearCookie(CSRF_TOKEN_COOKIE_NAME, { path: '/' })
}
