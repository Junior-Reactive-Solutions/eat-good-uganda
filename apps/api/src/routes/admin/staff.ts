import { pool, getBakeryStaff, addBakeryStaff, updateStaffRole, removeStaffMember, getStaffMemberById } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const staffRouter = createRouter() as Router

// Validation schemas
const addStaffSchema = z.object({
  email: z.email(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'staff']),
})

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'manager', 'staff']),
})

// GET /v1/admin/bakeries/:bakeryId/staff - List all staff for bakery
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

      const staff = await getBakeryStaff(pool, bakeryId)

      logger.info(`Admin listed ${String(staff.length)} staff for bakery ${bakeryId}`)

      return res.status(200).json({ data: staff })
    } catch (error) {
      logger.error(`Error listing bakery staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bakeries/:bakeryId/staff - Add new staff member
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

      const validation = addStaffSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const input: Parameters<typeof addBakeryStaff>[2] = {
        email: validation.data.email,
        fullName: validation.data.fullName,
        role: validation.data.role,
      }

      if (validation.data.phone) {
        input.phone = validation.data.phone
      }

      const staff = await addBakeryStaff(pool, bakeryId, input)

      logger.info(`Admin added staff member ${staff.id} to bakery ${bakeryId}`)

      return res.status(201).json({ data: staff })
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Staff member with this email already exists in bakery' })
      }
      logger.error(`Error adding bakery staff: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// PATCH /v1/admin/staff/:staffId/role - Update staff role
staffRouter.patch(
  '/staff/:staffId/role',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { staffId } = req.params

      if (!staffId || Array.isArray(staffId)) {
        return res.status(400).json({ error: 'Staff ID is required' })
      }

      const validation = updateRoleSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const staff = await updateStaffRole(pool, staffId, validation.data.role)

      logger.info(`Admin updated staff ${staffId} role to ${validation.data.role}`)

      return res.status(200).json({ data: staff })
    } catch (error) {
      if (error instanceof Error && error.message === 'Staff member not found') {
        return res.status(404).json({ error: 'Staff member not found' })
      }
      logger.error(`Error updating staff role: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// DELETE /v1/admin/staff/:staffId - Remove staff member
staffRouter.delete(
  '/staff/:staffId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { staffId } = req.params

      if (!staffId || Array.isArray(staffId)) {
        return res.status(400).json({ error: 'Staff ID is required' })
      }

      // Verify staff member exists
      const staff = await getStaffMemberById(pool, staffId)

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' })
      }

      await removeStaffMember(pool, staffId)

      logger.info(`Admin removed staff member ${staffId}`)

      return res.status(200).json({ success: true })
    } catch (error) {
      logger.error(`Error removing staff member: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

export default staffRouter
