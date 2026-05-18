import { pool, getAuditLogs } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const auditLogsRouter = createRouter() as Router

// Validation schema for query parameters
const auditLogsQuerySchema = z.object({
  adminId: z.string().optional(),
  action: z.string().max(255).optional(),
  bakeryId: z.string().optional(),
  resourceType: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

// GET /v1/admin/audit-logs - List audit logs with filtering and pagination
auditLogsRouter.get(
  '/audit-logs',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = auditLogsQuerySchema.safeParse(req.query)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const { adminId, action, bakeryId, resourceType, startDate, endDate, page, pageSize } =
        validation.data

      // Convert page and pageSize to offset and limit
      const offset = (page - 1) * pageSize
      const limit = pageSize

      // Build filters object
      const filters: Parameters<typeof getAuditLogs>[1] = {
        limit,
        offset,
      }

      if (adminId) filters.adminId = adminId
      if (action) filters.action = action
      if (bakeryId) filters.bakeryId = bakeryId
      if (resourceType) filters.resourceType = resourceType
      if (startDate) filters.startDate = startDate
      if (endDate) filters.endDate = endDate

      const { logs, total } = await getAuditLogs(pool, filters)

      const totalPages = Math.ceil(total / pageSize)

      logger.info(
        `Admin listed ${String(logs.length)} audit logs (page ${String(page)}, total ${String(total)})`,
      )

      return res.status(200).json({
        data: {
          logs,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages,
          },
        },
      })
    } catch (error) {
      logger.error(
        `Error listing audit logs: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

export default auditLogsRouter
