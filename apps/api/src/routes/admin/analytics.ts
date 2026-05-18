import {
  getAdminPlatformMetrics,
  getAdminBakeryAnalytics,
  getAdminMetricsTimeSeries,
  getAdminTopBakeries,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { pool } from '@eatgood/db'
import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const adminAnalyticsRouter = createRouter() as Router

const timeSeriesQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  metric: z.enum(['revenue', 'orders', 'customers']).default('revenue'),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
})

const topBakeriesQuerySchema = z.object({
  metric: z.enum(['revenue', 'orders', 'customers']).default('revenue'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// GET /v1/admin/analytics/metrics - Get platform-wide metrics
adminAnalyticsRouter.get(
  '/metrics',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const metrics = await getAdminPlatformMetrics(pool)
      logger.info('Admin retrieved platform metrics')
      return res.status(200).json(metrics)
    } catch {
      logger.error('Error fetching platform metrics')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /v1/admin/analytics/bakeries/:bakeryId - Get bakery analytics
adminAnalyticsRouter.get(
  '/bakeries/:bakeryId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const bakeryId = req.params.bakeryId as string
      const analytics = await getAdminBakeryAnalytics(pool, bakeryId)
      logger.info(`Admin retrieved analytics for bakery ${bakeryId}`)
      return res.status(200).json(analytics)
    } catch {
      logger.error('Error fetching bakery analytics')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /v1/admin/analytics/timeseries - Get time series data
adminAnalyticsRouter.get(
  '/timeseries',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const params = timeSeriesQuerySchema.parse(req.query)
      const timeSeries = await getAdminMetricsTimeSeries(pool, params)
      logger.info('Admin retrieved time series data')
      return res.status(200).json(timeSeries)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters' })
      }
      logger.error('Error fetching time series data')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /v1/admin/analytics/top-bakeries - Get top bakeries by metric
adminAnalyticsRouter.get(
  '/top-bakeries',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const params = topBakeriesQuerySchema.parse(req.query)
      const topBakeries = await getAdminTopBakeries(pool, params)
      logger.info('Admin retrieved top bakeries')
      return res.status(200).json(topBakeries)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters' })
      }
      logger.error('Error fetching top bakeries')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
)
