import { pool, getCustomerDetails, listCustomers, banCustomer, unbanCustomer } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const usersRouter = createRouter() as Router

// Validation schemas
const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isBanned: z.coerce.boolean().optional(),
  fraudFlag: z.coerce.boolean().optional(),
})

const banCustomerSchema = z.object({
  reason: z
    .string()
    .min(10, 'Ban reason must be at least 10 characters')
    .max(500, 'Ban reason must be at most 500 characters'),
})

// GET /v1/admin/users - List all customers with pagination and filters
usersRouter.get('/', authenticateToken('admin'), requireSuperAdminContext, async (req, res) => {
  try {
    const validation = listUsersQuerySchema.safeParse(req.query)

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.issues,
      })
    }

    const { page, pageSize, search, isBanned, fraudFlag } = validation.data

    const offset = (page - 1) * pageSize

    const listFilters: Parameters<typeof listCustomers>[1] = {
      limit: pageSize,
      offset,
    }

    if (search) {
      listFilters.search = search
    }
    if (isBanned !== undefined) {
      listFilters.isBanned = isBanned
    }
    if (fraudFlag !== undefined) {
      listFilters.fraudFlag = fraudFlag
    }

    const { customers, total } = await listCustomers(pool, listFilters)

    const totalPages = Math.ceil(total / pageSize)

    logger.info(
      `Admin listed customers with filters: search=${String(search)}, isBanned=${String(isBanned)}, fraudFlag=${String(fraudFlag)}`,
    )

    return res.status(200).json({
      data: {
        users: customers,
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
      `Error listing customers: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/users/:customerId - Get customer details with order history
usersRouter.get(
  '/:customerId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { customerId } = req.params

      if (!customerId || Array.isArray(customerId)) {
        return res.status(400).json({ error: 'Customer ID is required' })
      }

      const customer = await getCustomerDetails(pool, customerId)

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      logger.info(`Admin retrieved details for customer ${customerId}`)

      return res.status(200).json({ data: customer })
    } catch (error) {
      logger.error(
        `Error retrieving customer details: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/users/:customerId/ban - Ban customer account
usersRouter.post(
  '/:customerId/ban',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { customerId } = req.params

      if (!customerId || Array.isArray(customerId)) {
        return res.status(400).json({ error: 'Customer ID is required' })
      }

      const validation = banCustomerSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      // Verify customer exists
      const customer = await getCustomerDetails(pool, customerId)

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      await banCustomer(pool, customerId, validation.data.reason)

      logger.info(`Admin banned customer ${customerId} with reason: ${validation.data.reason}`)

      return res.status(200).json({ data: { success: true } })
    } catch (error) {
      logger.error(
        `Error banning customer: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/users/:customerId/unban - Unban customer account
usersRouter.post(
  '/:customerId/unban',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { customerId } = req.params

      if (!customerId || Array.isArray(customerId)) {
        return res.status(400).json({ error: 'Customer ID is required' })
      }

      // Verify customer exists
      const customer = await getCustomerDetails(pool, customerId)

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      await unbanCustomer(pool, customerId)

      logger.info(`Admin unbanned customer ${customerId}`)

      return res.status(200).json({ data: { success: true } })
    } catch (error) {
      logger.error(
        `Error unbanning customer: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

export default usersRouter
