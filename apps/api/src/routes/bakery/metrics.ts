/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { getBakeryMetrics } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

export const bakeryMetricsRouter = createRouter() as Router

/**
 * GET /
 * Get bakery metrics for current month
 * Returns: total sales, order counts by status, top products, daily revenue
 */
bakeryMetricsRouter.get(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const metrics = await getBakeryMetrics((req as any).db, bakeryId)

      logger.info({}, 'Metrics retrieved')

      res.json(metrics)
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get metrics',
      )
      res.status(500).json({ error: 'Failed to get metrics' })
    }
  },
)
