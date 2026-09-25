import {
  adminGetDashboardMetrics,
  getPlatformActionQueue,
  pool,
  type DashboardMetrics,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'

import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const adminDashboardRouter = createRouter() as Router

/**
 * GET /
 * Platform-wide dashboard metrics.
 *
 * Uses the shared pool directly. This route previously read `req.db`, which no
 * middleware in this codebase ever populates, so it returned a 500
 * ("Database connection unavailable") on every request.
 */
adminDashboardRouter.get(
  '/',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (_req, res): Promise<void> => {
    try {
      const metrics: DashboardMetrics = await adminGetDashboardMetrics(pool)

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

/**
 * GET /action-queue
 * Everything the platform operator needs to act on right now: bakeries
 * awaiting approval (oldest first), support tickets past the response SLA,
 * active bakeries with no enabled payment method, and active bakeries that
 * have never published a product.
 */
adminDashboardRouter.get(
  '/action-queue',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (_req, res): Promise<void> => {
    try {
      const queue = await getPlatformActionQueue(pool)
      res.status(200).json(queue)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get action queue',
      })
    }
  },
)
