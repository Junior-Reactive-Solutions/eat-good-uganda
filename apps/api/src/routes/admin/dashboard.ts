/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import {
  adminGetDashboardMetrics,
  type DashboardMetrics,
} from '../../../../packages/db/src/queries/admin/dashboard-metrics'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const adminDashboardRouter = createRouter() as Router

adminDashboardRouter.get(
  '/',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res): Promise<void> => {
    try {
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
