 
import type { RequestHandler } from 'express'

export const requireCustomerContext: RequestHandler = (req, res, next) => {
  if (req.auth?.kind !== 'customer') {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}
