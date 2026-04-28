 
import type { RequestHandler } from 'express'

export const requireSuperAdminContext: RequestHandler = (req, res, next) => {
  if (req.auth?.kind !== 'super_admin') {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}
