 
import type { BakeryUserRole } from '@eatgood/shared'
import type { RequestHandler } from 'express'

const ROLE_HIERARCHY: Record<BakeryUserRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
}

export function requireBakeryContext(requiredRole?: BakeryUserRole): RequestHandler {
  return (req, res, next) => {
    if (req.auth?.kind !== 'bakery_user') {
      return res.status(401).json({ error: 'unauthorized' })
    }

    req.bakeryId = req.auth.bakery_id

    if (requiredRole) {
      const requiredLevel = ROLE_HIERARCHY[requiredRole]
      const userLevel = ROLE_HIERARCHY[req.auth.role]

      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'forbidden' })
      }
    }

    next()
  }
}
