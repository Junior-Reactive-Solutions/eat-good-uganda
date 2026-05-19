import { pool, adminUpdateBakeryStatus, banCustomer, unbanCustomer } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const bulkOperationsRouter = createRouter() as Router

// Validation schemas
const approveBakeriesSchema = z.object({
  bakeryIds: z.array(z.uuid()).min(1, 'bakeryIds must be a non-empty array'),
})

const banUsersSchema = z.object({
  userIds: z.array(z.uuid()).min(1, 'userIds must be a non-empty array'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
})

const unbanUsersSchema = z.object({
  userIds: z.array(z.uuid()).min(1, 'userIds must be a non-empty array'),
})

// POST /v1/admin/bulk/bakeries/approve - Approve multiple bakeries
bulkOperationsRouter.post(
  '/bakeries/approve',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = approveBakeriesSchema.safeParse(req.body)

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: 'Invalid request body', details: validation.error.issues })
      }

      if (validation.data.bakeryIds.length === 0) {
        return res.status(400).json({ error: 'bakeryIds must be a non-empty array' })
      }

      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const adminId = req.auth.sub
      const { bakeryIds } = validation.data
      let approved = 0
      let failed = 0
      const errors: { bakeryId: string; error: string }[] = []

      for (const bakeryId of bakeryIds) {
        try {
          const result = await adminUpdateBakeryStatus(pool, bakeryId, {
            status: 'active',
            approved_at: new Date(),
            approved_by: adminId,
          })
          if (result) {
            approved++
          } else {
            failed++
            errors.push({ bakeryId, error: 'Bakery not found' })
          }
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ bakeryId, error: errorMessage })
          logger.error(`Error approving bakery ${bakeryId}: ${errorMessage}`)
        }
      }

      logger.info(`Admin bulk approved ${String(approved)} bakeries, ${String(failed)} failed`)

      return res.status(200).json({
        data: {
          approved,
          failed,
          ...(errors.length > 0 && { errors }),
        },
      })
    } catch (error) {
      logger.error(
        `Error in bulk approve bakeries: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bulk/users/ban - Ban multiple users
bulkOperationsRouter.post(
  '/users/ban',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = banUsersSchema.safeParse(req.body)

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: 'Invalid request body', details: validation.error.issues })
      }

      if (validation.data.userIds.length === 0) {
        return res.status(400).json({ error: 'userIds must be a non-empty array' })
      }

      const { userIds, reason } = validation.data
      let banned = 0
      let failed = 0
      const errors: { userId: string; error: string }[] = []

      for (const userId of userIds) {
        try {
          await banCustomer(pool, userId, reason)
          banned++
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ userId, error: errorMessage })
          logger.error(`Error banning user ${userId}: ${errorMessage}`)
        }
      }

      logger.info(`Admin bulk banned ${String(banned)} users, ${String(failed)} failed`)

      return res.status(200).json({
        data: {
          banned,
          failed,
          ...(errors.length > 0 && { errors }),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request body' })
      }
      logger.error(
        `Error in bulk ban users: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bulk/users/unban - Unban multiple users
bulkOperationsRouter.post(
  '/users/unban',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = unbanUsersSchema.safeParse(req.body)

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: 'Invalid request body', details: validation.error.issues })
      }

      if (validation.data.userIds.length === 0) {
        return res.status(400).json({ error: 'userIds must be a non-empty array' })
      }

      const { userIds } = validation.data
      let unbanned = 0
      let failed = 0
      const errors: { userId: string; error: string }[] = []

      for (const userId of userIds) {
        try {
          await unbanCustomer(pool, userId)
          unbanned++
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ userId, error: errorMessage })
          logger.error(`Error unbanning user ${userId}: ${errorMessage}`)
        }
      }

      logger.info(`Admin bulk unbanned ${String(unbanned)} users, ${String(failed)} failed`)

      return res.status(200).json({
        data: {
          unbanned,
          failed,
          ...(errors.length > 0 && { errors }),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request body' })
      }
      logger.error(
        `Error in bulk unban users: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)
