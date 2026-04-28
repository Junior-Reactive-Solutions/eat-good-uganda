/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-template-expressions */
import type { RequestHandler } from 'express'

import { TtlCache } from '../lib/cache'

const ONE_HOUR_MS = 60 * 60 * 1000

class RateLimitChecker {
  private cache: TtlCache<string, number>

  constructor(windowMs: number) {
    this.cache = new TtlCache({
      maxSize: 10000,
      ttlMs: windowMs,
    })
  }

  check(key: string, maxRequests: number): boolean {
    const count = this.cache.get(key) ?? 0

    if (count >= maxRequests) {
      return false
    }

    this.cache.set(key, count + 1)
    return true
  }
}

const generalChecker = new RateLimitChecker(ONE_HOUR_MS)
const authChecker = new RateLimitChecker(ONE_HOUR_MS)

export const generalRateLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? 'unknown'
  const key = `${ip}:${req.path}`

  if (!generalChecker.check(key, 300)) {
    return res.status(429).json({ error: 'rate limit exceeded' })
  }

  next()
}

export const authRateLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? 'unknown'
  const email = typeof req.body?.email === 'string' ? req.body.email : ''

  const ipKey = `auth_ip:${ip}`
  const emailKey = `auth_email:${email}`

  const ipOk = authChecker.check(ipKey, 30)
  const emailOk = authChecker.check(emailKey, 10)

  if (!ipOk || !emailOk) {
    return res.status(429).json({ error: 'rate limit exceeded' })
  }

  next()
}
