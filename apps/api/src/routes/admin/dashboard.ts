import { adminGetDashboardMetrics, type DashboardMetrics } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const adminDashboardRouter = createRouter() as Router

adminDashboardRouter.get(
  '/',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res): Promise<void> => {
    try {
      if (!req.db) {
        res.status(500).json({ error: 'Database connection unavailable' })
        return
      }

      const metrics: DashboardMetrics = await adminGetDashboardMetrics(req.db)

      res.status(200).json({
        metrics,
      })
      return
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get dashboard metrics',
      })
      return
    }
  },
)
