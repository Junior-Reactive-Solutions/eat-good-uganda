import { pool, adminListAllBakeries, listCustomers, listOrdersForBakery } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const exportsRouter = createRouter() as Router

// In-memory storage for exports (keep last 100 exports)
interface StoredExport {
  id: string
  resource: 'bakeries' | 'customers' | 'orders'
  status: 'completed' | 'processing' | 'failed'
  createdAt: string
  rowCount: number
  csvContent: string
}

const exportStorage: Map<string, StoredExport> = new Map()

// Helper: Generate UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper: Format date for CSV
function formatDate(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

// Helper: Escape CSV value
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str: string
  if (typeof value === 'string') {
    str = value
  } else if (typeof value === 'number') {
    str = String(value)
  } else if (typeof value === 'boolean') {
    str = String(value)
  } else {
    str = JSON.stringify(value)
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Helper: Generate bakeries CSV
async function generateBakeriesCSV(): Promise<{ csv: string; rowCount: number }> {
  const { bakeries } = await adminListAllBakeries(pool, 10000, 0)

  const headers = [
    'id',
    'slug',
    'display_name',
    'legal_name',
    'city',
    'email',
    'phone',
    'status',
    'created_at',
    'approved_at',
  ]
  const headerRow = headers.map(escapeCsvValue).join(',')

  const dataRows = bakeries.map((bakery) => {
    return [
      bakery.id,
      bakery.slug,
      bakery.display_name,
      bakery.legal_name,
      bakery.city,
      bakery.email,
      bakery.phone,
      bakery.status,
      formatDate(bakery.created_at),
      formatDate(bakery.approved_at),
    ]
      .map(escapeCsvValue)
      .join(',')
  })

  const csv = [headerRow, ...dataRows].join('\n')
  return { csv, rowCount: bakeries.length }
}

// Helper: Generate customers CSV
async function generateCustomersCSV(): Promise<{ csv: string; rowCount: number }> {
  const { customers } = await listCustomers(pool, { limit: 10000, offset: 0 })

  const headers = [
    'id',
    'email',
    'full_name',
    'phone',
    'is_banned',
    'ban_reason',
    'total_orders',
    'total_spent',
  ]
  const headerRow = headers.map(escapeCsvValue).join(',')

  const dataRows = customers.map((customer) => {
    return [
      customer.id,
      customer.email,
      customer.full_name,
      customer.phone || '',
      customer.is_banned ? 'true' : 'false',
      customer.ban_reason || '',
      customer.total_orders,
      (customer.total_spent_minor / 100).toFixed(2),
    ]
      .map(escapeCsvValue)
      .join(',')
  })

  const csv = [headerRow, ...dataRows].join('\n')
  return { csv, rowCount: customers.length }
}

// Helper: Generate orders CSV
async function generateOrdersCSV(): Promise<{ csv: string; rowCount: number }> {
  // Get all orders for all bakeries (simplified approach - in production, would paginate)
  const { bakeries } = await adminListAllBakeries(pool, 10000, 0)
  const allOrders: Array<{
    id: string
    order_number: string
    guest_name: string
    bakery_id: string
    status: string
    total_minor: number
    created_at: string
  }> = []

  // Fetch orders for each bakery
  for (const bakery of bakeries) {
    const orders = await listOrdersForBakery(pool, bakery.id, 10000, 0)
    allOrders.push(
      ...orders.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        guest_name: order.guest_name || '',
        bakery_id: bakery.display_name,
        status: order.status,
        total_minor: order.total_minor,
        created_at:
          typeof order.created_at === 'string' ? order.created_at : order.created_at.toISOString(),
      })),
    )
  }

  const headers = [
    'id',
    'order_number',
    'customer_name',
    'bakery_name',
    'status',
    'total_amount',
    'created_at',
  ]
  const headerRow = headers.map(escapeCsvValue).join(',')

  const dataRows = allOrders.map((order) => {
    return [
      order.id,
      order.order_number,
      order.guest_name,
      order.bakery_id,
      order.status,
      (order.total_minor / 100).toFixed(2),
      formatDate(order.created_at),
    ]
      .map(escapeCsvValue)
      .join(',')
  })

  const csv = [headerRow, ...dataRows].join('\n')
  return { csv, rowCount: allOrders.length }
}

// Helper: Keep only last N exports in memory
function pruneOldExports(maxCount: number = 100): void {
  if (exportStorage.size <= maxCount) return

  const sorted = Array.from(exportStorage.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const toRemove = sorted.slice(maxCount)
  toRemove.forEach((exp) => {
    exportStorage.delete(exp.id)
  })
}

// Validation schemas
const triggerExportSchema = z.object({
  resource: z.enum(['bakeries', 'customers', 'orders']),
  format: z.enum(['csv']).default('csv'),
  dateRange: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
})

const listExportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  resource: z.enum(['bakeries', 'customers', 'orders']).optional(),
})

// POST /v1/admin/exports - Trigger export job
exportsRouter.post('/', authenticateToken('admin'), requireSuperAdminContext, async (req, res) => {
  try {
    const validation = triggerExportSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.issues,
      })
    }

    const { resource } = validation.data
    const exportId = generateId()

    // Generate CSV based on resource type
    let csvData: { csv: string; rowCount: number }
    try {
      if (resource === 'bakeries') {
        csvData = await generateBakeriesCSV()
      } else if (resource === 'customers') {
        csvData = await generateCustomersCSV()
      } else {
        csvData = await generateOrdersCSV()
      }
    } catch (error) {
      logger.error(
        `Error generating ${resource} CSV: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Failed to generate export' })
    }

    // Store export
    const exportRecord: StoredExport = {
      id: exportId,
      resource,
      status: 'completed',
      createdAt: new Date().toISOString(),
      rowCount: csvData.rowCount,
      csvContent: csvData.csv,
    }
    exportStorage.set(exportId, exportRecord)
    pruneOldExports()

    const rowCountStr = String(csvData.rowCount)
    logger.info(`Admin created ${resource} export: ${exportId} with ${rowCountStr} rows`)

    return res.status(200).json({
      data: {
        exportId,
        status: 'completed',
        url: `/v1/admin/exports/${exportId}/download`,
      },
    })
  } catch (error) {
    logger.error(
      `Error triggering export: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/exports - List recent exports
exportsRouter.get('/', authenticateToken('admin'), requireSuperAdminContext, (req, res) => {
  try {
    const validation = listExportsQuerySchema.safeParse(req.query)

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.issues,
      })
    }

    const { page, pageSize, resource } = validation.data
    const offset = (page - 1) * pageSize

    // Get all exports and filter
    let exports = Array.from(exportStorage.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    if (resource) {
      exports = exports.filter((exp) => exp.resource === resource)
    }

    const total = exports.length
    const paginated = exports.slice(offset, offset + pageSize)

    const totalPages = Math.ceil(total / pageSize)

    const result = paginated.map((exp) => ({
      id: exp.id,
      resource: exp.resource,
      createdAt: exp.createdAt,
      rowCount: exp.rowCount,
      status: exp.status,
    }))

    const pageStr = String(page)
    const resourceStr = resource ?? 'all'
    logger.info(`Admin listed exports: page=${pageStr}, resource=${resourceStr}`)

    return res.status(200).json({
      data: {
        exports: result,
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
      `Error listing exports: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /v1/admin/exports/:exportId/download - Download CSV file
exportsRouter.get(
  '/:exportId/download',
  authenticateToken('admin'),
  requireSuperAdminContext,
  (req, res) => {
    try {
      const { exportId } = req.params

      if (!exportId || Array.isArray(exportId)) {
        return res.status(400).json({ error: 'Export ID is required' })
      }

      const exportRecord = exportStorage.get(exportId)

      if (!exportRecord) {
        return res.status(404).json({ error: 'Export not found' })
      }

      const timestamp = new Date().getTime().toString()
      const filename = `${exportRecord.resource}_export_${timestamp}.csv`

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      const contentLength = Buffer.byteLength(exportRecord.csvContent, 'utf-8')
      res.setHeader('Content-Length', contentLength.toString())

      logger.info(`Admin downloaded export ${exportId}`)

      return res.status(200).send(exportRecord.csvContent)
    } catch (error) {
      logger.error(
        `Error downloading export: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)
