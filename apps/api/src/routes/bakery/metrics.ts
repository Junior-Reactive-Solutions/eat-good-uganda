/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { getBakeryActionQueue, getBakeryMetrics, pool } from '@eatgood/db'
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
      const metrics = await getBakeryMetrics(pool, bakeryId)

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


/**
 * GET /action-queue
 * Everything the bakery operator needs to act on right now: unconfirmed
 * orders (with wait time), orders due soon, out-of-stock published
 * products, and whether a payment method is enabled.
 */
bakeryMetricsRouter.get(
  '/action-queue',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const queue = await getBakeryActionQueue(pool, bakeryId)

      res.json(queue)
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get action queue',
      )
      res.status(500).json({ error: 'Failed to get action queue' })
    }
  },
)
