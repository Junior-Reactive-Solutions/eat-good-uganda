import {
  getAdminPlatformMetrics,
  getAdminBakeryAnalytics,
  getAdminMetricsTimeSeries,
  getAdminTopBakeries,
  pool,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'


export const adminAnalyticsRouter = createRouter() as Router

// Zod validation schemas
const bakeryIdSchema = z.string().refine((val) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(val)
}, 'Invalid bakery ID format')

const timeSeriesQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  metric: z.enum(['revenue', 'orders', 'customers']),
  groupBy: z.enum(['day', 'week', 'month']),
})

const topBakeriesQuerySchema = z.object({
  metric: z.enum(['revenue', 'orders', 'customers']),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

// Middleware
adminAnalyticsRouter.use(authenticateToken('admin'))
adminAnalyticsRouter.use(requireSuperAdminContext)

// GET /v1/admin/analytics/metrics - Get platform-wide metrics
adminAnalyticsRouter.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getAdminPlatformMetrics(pool)
    logger.info('Admin retrieved platform metrics')
    return res.status(200).json(metrics)
  } catch {
    logger.error('Error fetching platform metrics')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/analytics/bakeries/:bakeryId - Get bakery analytics
adminAnalyticsRouter.get('/bakeries/:bakeryId', async (req: Request, res: Response) => {
  try {
    const { bakeryId } = req.params

    // Validate bakeryId format
    const validatedBakeryId = bakeryIdSchema.parse(bakeryId)

    const analytics = await getAdminBakeryAnalytics(pool, validatedBakeryId)

    logger.info(`Admin retrieved analytics for bakery ${validatedBakeryId}`)
    return res.status(200).json(analytics)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid bakeryId format' })
    }
    logger.error('Error fetching bakery analytics')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/analytics/timeseries - Get time series data
adminAnalyticsRouter.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const params = timeSeriesQuerySchema.parse(req.query)

    // Validate date range
    const startDate = new Date(params.startDate)
    const endDate = new Date(params.endDate)

    if (endDate < startDate) {
      return res.status(400).json({
        error: 'endDate must be greater than or equal to startDate',
      })
    }

    const timeSeries = await getAdminMetricsTimeSeries(pool, {
      metric: params.metric,
      groupBy: params.groupBy,
      startDate,
      endDate,
    })

    logger.info('Admin retrieved time series data')
    return res.status(200).json(timeSeries)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters' })
    }
    logger.error('Error fetching time series data')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/analytics/top-bakeries - Get top bakeries by metric
adminAnalyticsRouter.get('/top-bakeries', async (req: Request, res: Response) => {
  try {
    const params = topBakeriesQuerySchema.parse(req.query)

    const topBakeries = await getAdminTopBakeries(pool, {
      metric: params.metric,
      limit: params.limit,
    })

    logger.info('Admin retrieved top bakeries')
    return res.status(200).json(topBakeries)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters' })
    }
    logger.error('Error fetching top bakeries')
    return res.status(500).json({ error: 'Internal server error' })
  }
})
