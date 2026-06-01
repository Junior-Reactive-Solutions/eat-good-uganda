import {
  pool,
  adminListAllBakeries,
  adminUpdateBakeryStatus,
  listBakeryUsersForBakery,
  getBakeryMetrics,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const adminBakeriesRouter = createRouter() as Router

// Validation schemas
const listBakeriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['pending_approval', 'active', 'suspended', 'archived']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'display_name', 'approved_at']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})

const approveBakerySchema = z.object({
  approvalNotes: z.string().max(500).optional(),
})

const suspendBakerySchema = z.object({
  reason: z.string().min(10).max(500),
  notifyBakery: z.boolean().default(true),
})

const reactivateBakerySchema = z.object({
  reactivationNotes: z.string().max(500).optional(),
})

// GET /v1/admin/bakeries - List all bakeries
adminBakeriesRouter.get(
  '/',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const params = listBakeriesQuerySchema.parse(req.query)
      const offset = (params.page - 1) * params.pageSize

      const { bakeries } = await adminListAllBakeries(pool, params.pageSize, offset)

      // Filter by status if provided
      let filtered = bakeries
      if (params.status) {
        filtered = bakeries.filter((b) => b.status === params.status)
      }

      // Filter by search if provided
      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filtered = filtered.filter(
          (b) =>
            b.display_name.toLowerCase().includes(searchLower) ||
            b.slug.toLowerCase().includes(searchLower),
        )
      }

      // Sort
      filtered.sort((a, b) => {
        let aVal: string | number
        let bVal: string | number

        if (params.sortBy === 'created_at') {
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
        } else if (params.sortBy === 'display_name') {
          aVal = a.display_name.toLowerCase()
          bVal = b.display_name.toLowerCase()
        } else {
          // approved_at
          aVal = a.approved_at ? new Date(a.approved_at).getTime() : 0
          bVal = b.approved_at ? new Date(b.approved_at).getTime() : 0
        }

        const compareResult = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return params.sortDirection === 'asc' ? compareResult : -compareResult
      })

      const totalPages = Math.ceil(filtered.length / params.pageSize)
      const paginatedData = filtered.slice(offset, offset + params.pageSize)

      logger.info({}, 'Admin listed bakeries')

      return res.status(200).json({
        data: paginatedData.map((b) => ({
          id: b.id,
          slug: b.slug,
          display_name: b.display_name,
          logo_url: b.logo_url,
          city: b.city,
          status: b.status,
          created_at: b.created_at,
          approved_at: b.approved_at,
          approved_by: b.approved_by,
          phone: b.phone,
          email: b.email,
        })),
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          totalCount: filtered.length,
          totalPages,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters' })
      }
      // Error logged
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// GET /v1/admin/bakeries/:bakeryId - Get bakery detail with staff and metrics
adminBakeriesRouter.get(
  '/:bakeryId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const bakeryId = req.params.bakeryId as string

      // Get bakery and all staff
      const { rows: bakeryRows } = await pool.query<{
        id: string
        slug: string
        legal_name: string
        display_name: string
        tagline: string | null
        description: string | null
        logo_url: string | null
        phone: string
        email: string
        address_line1: string
        address_line2: string | null
        city: string
        latitude: number
        longitude: number
        primary_color: string
        accent_color: string | null
        status: string
        accepts_pickup: boolean
        accepts_delivery: boolean
        delivery_fee_minor: number | null
        delivery_radius_km: number | null
        min_order_minor: number | null
        created_at: string
        updated_at: string
        approved_at: string | null
        approved_by: string | null
      }>('SELECT * FROM bakeries WHERE id = $1 AND deleted_at IS NULL', [bakeryId])

      if (bakeryRows.length === 0) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      const bakery = bakeryRows[0]!

      // Get staff for bakery
      const staff = await listBakeryUsersForBakery(pool, bakeryId)

      // Get metrics for bakery
      const metrics = await getBakeryMetrics(pool, bakeryId)

      logger.info({}, 'Admin viewed bakery details')

      return res.status(200).json({
        bakery: {
          id: bakery.id,
          slug: bakery.slug,
          legal_name: bakery.legal_name,
          display_name: bakery.display_name,
          tagline: bakery.tagline,
          description: bakery.description,
          logo_url: bakery.logo_url,
          phone: bakery.phone,
          email: bakery.email,
          address_line1: bakery.address_line1,
          address_line2: bakery.address_line2,
          city: bakery.city,
          latitude: bakery.latitude,
          longitude: bakery.longitude,
          primary_color: bakery.primary_color,
          accent_color: bakery.accent_color,
          status: bakery.status,
          accepts_pickup: bakery.accepts_pickup,
          accepts_delivery: bakery.accepts_delivery,
          delivery_fee_minor: bakery.delivery_fee_minor,
          delivery_radius_km: bakery.delivery_radius_km,
          min_order_minor: bakery.min_order_minor,
          created_at: bakery.created_at,
          updated_at: bakery.updated_at,
          approved_at: bakery.approved_at,
          approved_by: bakery.approved_by,
        },
        staff: staff.map((s) => ({
          id: s.id,
          email: s.email,
          full_name: s.full_name,
          role: s.role,
          is_active: s.is_active,
          email_verified_at: s.email_verified_at,
          last_login_at: s.last_login_at,
        })),
        metrics: {
          totalOrdersCount: metrics.totalOrdersCount,
          totalRevenueMinor: metrics.totalSalesMinor,
          totalCustomersCount: 0, // Phase 3 will implement customer count
          ordersByStatus: metrics.ordersByStatus,
        },
      })
    } catch {
      logger.error('Error getting bakery detail')
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bakeries/:bakeryId/approve - Approve pending bakery
adminBakeriesRouter.post(
  '/:bakeryId/approve',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const bakeryId = req.params.bakeryId as string
      approveBakerySchema.parse(req.body)

      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const adminId = req.auth.sub

      // Check if bakery exists
      const { rows: bakeryRows } = await pool.query<{ status: string }>(
        'SELECT * FROM bakeries WHERE id = $1 AND deleted_at IS NULL',
        [bakeryId],
      )

      if (bakeryRows.length === 0) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      if (bakeryRows[0]!.status === 'active') {
        return res.status(400).json({ error: 'Bakery is already active' })
      }

      // Update bakery status
      const updatedBakery = await adminUpdateBakeryStatus(pool, bakeryId, {
        status: 'active',
        approved_at: new Date(),
        approved_by: adminId,
      })

      logger.info({}, 'Admin approved bakery')

      return res.status(200).json({
        id: updatedBakery?.id,
        status: updatedBakery?.status,
        approved_at: updatedBakery?.approved_at,
        approved_by: updatedBakery?.approved_by,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request body' })
      }
      logger.error('Error approving bakery')
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bakeries/:bakeryId/suspend - Suspend active bakery
adminBakeriesRouter.post(
  '/:bakeryId/suspend',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const bakeryId = req.params.bakeryId as string
      suspendBakerySchema.parse(req.body)

      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const adminId = req.auth.sub

      // Check if bakery exists
      const { rows: bakeryRows } = await pool.query<{ status: string }>(
        'SELECT * FROM bakeries WHERE id = $1 AND deleted_at IS NULL',
        [bakeryId],
      )

      if (bakeryRows.length === 0) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      if (bakeryRows[0]!.status === 'suspended') {
        return res.status(400).json({ error: 'Bakery is already suspended' })
      }

      // Update bakery status
      const updatedBakery = await adminUpdateBakeryStatus(pool, bakeryId, {
        status: 'suspended',
      })

      logger.info({ adminId }, `Admin suspended bakery`)

      return res.status(200).json({
        id: updatedBakery?.id,
        status: updatedBakery?.status,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request body' })
      }
      logger.error('Error suspending bakery')
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/bakeries/:bakeryId/reactivate - Reactivate suspended bakery
adminBakeriesRouter.post(
  '/:bakeryId/reactivate',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const bakeryId = req.params.bakeryId as string
      reactivateBakerySchema.parse(req.body)

      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const adminId = req.auth.sub

      // Check if bakery exists
      const { rows: bakeryRows } = await pool.query<{ status: string }>(
        'SELECT * FROM bakeries WHERE id = $1 AND deleted_at IS NULL',
        [bakeryId],
      )

      if (bakeryRows.length === 0) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      if (bakeryRows[0]!.status !== 'suspended') {
        return res.status(400).json({ error: 'Bakery is not suspended' })
      }

      // Update bakery status
      const updatedBakery = await adminUpdateBakeryStatus(pool, bakeryId, {
        status: 'active',
      })

      logger.info({ adminId }, `Admin reactivated bakery`)

      return res.status(200).json({
        id: updatedBakery?.id,
        status: updatedBakery?.status,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request body' })
      }
      logger.error('Error reactivating bakery')
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)
