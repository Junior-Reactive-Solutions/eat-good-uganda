import {
  pool,
  listBakeryStaff,
  getBakeryStaffMember,
  createBakeryStaff,
  updateBakeryStaff,
  removeBakeryStaff,
  createAuditLog,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const staffRouter = createRouter() as Router

// Validation schemas
const createStaffSchema = z.object({
  email: z.string().email('Invalid email format'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone format').optional(),
  role: z.enum(['owner', 'manager', 'staff']),
})

const updateStaffSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone format').optional(),
  role: z.enum(['owner', 'manager', 'staff']).optional(),
})

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  role: z.enum(['owner', 'manager', 'staff']).optional(),
})

// GET /v1/admin/bakeries/:bakeryId/staff - List all staff for bakery with pagination
staffRouter.get(
  '/bakeries/:bakeryId/staff',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { bakeryId } = req.params

      if (!bakeryId || Array.isArray(bakeryId)) {
        return res.status(400).json({ error: 'Bakery ID is required' })
      }

      const queryValidation = listQuerySchema.safeParse(req.query)
      if (!queryValidation.success) {
        return res.status(400).json({ error: 'Invalid query parameters' })
      }

      const options = queryValidation.data.limit || queryValidation.data.offset || queryValidation.data.role
        ? {
            ...(queryValidation.data.limit !== undefined && { limit: queryValidation.data.limit }),
            ...(queryValidation.data.offset !== undefined && { offset: queryValidation.data.offset }),
            ...(queryValidation.data.role !== undefined && { role: queryValidation.data.role }),
          }
        : undefined

      const result = await listBakeryStaff(pool, bakeryId, options)

      logger.info(`Admin listed staff for bakery ${bakeryId}`)

      return res.status(200).json({
        staff: result,
        total: result.length,
        page: 1,
        pageSize: queryValidation.data.limit ?? 20,
      })
    } catch (error) {
      logger.error(`Error listing bakery staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// GET /v1/admin/bakeries/:bakeryId/staff/:staffId - Get single staff member
staffRouter.get(
  '/bakeries/:bakeryId/staff/:staffId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { bakeryId, staffId } = req.params

      if (!bakeryId || Array.isArray(bakeryId) || !staffId || Array.isArray(staffId)) {
        return res.status(400).json({ error: 'Bakery ID and Staff ID are required' })
      }

      const staff = await getBakeryStaffMember(pool, bakeryId, staffId)

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' })
      }

      logger.info(`Admin retrieved staff ${staffId} from bakery ${bakeryId}`)

      return res.status(200).json(staff)
    } catch (error) {
      logger.error(`Error retrieving staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bakeries/:bakeryId/staff - Create new staff member
staffRouter.post(
  '/bakeries/:bakeryId/staff',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { bakeryId } = req.params

      if (!bakeryId || Array.isArray(bakeryId)) {
        return res.status(400).json({ error: 'Bakery ID is required' })
      }

      const validation = createStaffSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const createInput: Parameters<typeof createBakeryStaff>[2] = {
        email: validation.data.email,
        full_name: validation.data.full_name,
        role: validation.data.role,
      }
      if (validation.data.phone !== undefined) createInput.phone = validation.data.phone

      const staff = await createBakeryStaff(pool, bakeryId, createInput)

      // Log audit event
      await createAuditLog(pool, {
        adminId: (req.auth as Record<string, unknown>)?.id as string,
        action: 'CREATE_STAFF',
        bakeryId,
        resourceType: 'bakery_user',
        resourceId: staff.id,
        changes: { after: staff },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })

      logger.info(`Admin created staff member ${staff.id} for bakery ${bakeryId}`)

      return res.status(201).json(staff)
    } catch (error) {
      if (error instanceof Error && error.message.includes('email unique')) {
        return res.status(409).json({ error: 'Staff member with this email already exists in bakery' })
      }
      logger.error(`Error creating staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// PATCH /v1/admin/bakeries/:bakeryId/staff/:staffId - Update staff member
staffRouter.patch(
  '/bakeries/:bakeryId/staff/:staffId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { bakeryId, staffId } = req.params

      if (!bakeryId || Array.isArray(bakeryId) || !staffId || Array.isArray(staffId)) {
        return res.status(400).json({ error: 'Bakery ID and Staff ID are required' })
      }

      const validation = updateStaffSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const updateInput: Parameters<typeof updateBakeryStaff>[3] = {}
      if (validation.data.full_name !== undefined) updateInput.full_name = validation.data.full_name
      if (validation.data.phone !== undefined) updateInput.phone = validation.data.phone
      if (validation.data.role !== undefined) updateInput.role = validation.data.role

      const staff = await updateBakeryStaff(pool, bakeryId, staffId, updateInput)

      // Log audit event
      await createAuditLog(pool, {
        adminId: (req.auth as Record<string, unknown>)?.id as string,
        action: 'UPDATE_STAFF',
        bakeryId,
        resourceType: 'bakery_user',
        resourceId: staffId,
        changes: { after: staff, before: req.body },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })

      logger.info(`Admin updated staff ${staffId} for bakery ${bakeryId}`)

      return res.status(200).json(staff)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot remove the last owner')) {
        return res.status(409).json({ error: 'Cannot remove the last owner of a bakery' })
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: 'Staff member not found' })
      }
      logger.error(`Error updating staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// DELETE /v1/admin/bakeries/:bakeryId/staff/:staffId - Remove staff member
staffRouter.delete(
  '/bakeries/:bakeryId/staff/:staffId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { bakeryId, staffId } = req.params

      if (!bakeryId || Array.isArray(bakeryId) || !staffId || Array.isArray(staffId)) {
        return res.status(400).json({ error: 'Bakery ID and Staff ID are required' })
      }

      const staff = await removeBakeryStaff(pool, bakeryId, staffId)

      // Log audit event
      await createAuditLog(pool, {
        adminId: (req.auth as Record<string, unknown>)?.id as string,
        action: 'DELETE_STAFF',
        bakeryId,
        resourceType: 'bakery_user',
        resourceId: staffId,
        changes: { before: staff },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })

      logger.info(`Admin removed staff member ${staffId} from bakery ${bakeryId}`)

      return res.status(200).json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot remove the last owner')) {
        return res.status(409).json({ error: 'Cannot remove the last owner of a bakery' })
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: 'Staff member not found' })
      }
      logger.error(`Error removing staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

export default staffRouter
