import { pool } from '@eatgood/db'
import {
  getTickets,
  getTicketDetail,
  createTicket,
  addMessage,
  updateTicketStatus,
  assignTicketToAdmin,
  updateTicketPriority,
  getTicketById,
} from '@eatgood/db/queries/support'
import { Router as createRouter } from 'express'
import type { Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireSuperAdminContext } from '../../middleware/requireSuperAdminContext'

export const supportRouter = createRouter() as Router

// Validation schemas
const createTicketSchema = z.object({
  bakery_id: z.uuid(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

const addMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
})

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

const assignAdminSchema = z.object({
  admin_id: z.uuid().nullable().optional(),
})

const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
})

const listTicketsQuerySchema = z.object({
  bakery_id: z.uuid().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

// GET /v1/admin/support/tickets - List support tickets
supportRouter.get(
  '/tickets',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = listTicketsQuerySchema.safeParse(req.query)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const { bakery_id, status, priority, limit = 20, offset = 0 } = validation.data

      if (!bakery_id) {
        return res.status(400).json({ error: 'bakery_id is required' })
      }

      const result = await getTickets(pool, {
        bakeryId: bakery_id,
        status,
        priority,
        limit,
        offset,
      })

      const ticketCount = result.tickets.length
      logger.info(`Admin listed ${String(ticketCount)} support tickets for bakery ${bakery_id}`)

      const {tickets, total} = result
      return res.status(200).json({
        data: tickets,
        pagination: {
          total,
          limit,
          offset,
        },
      })
    } catch (error) {
      logger.error(`Error listing support tickets: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/support/tickets - Create new ticket
supportRouter.post(
  '/tickets',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const validation = createTicketSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const ticket = await createTicket(pool, {
        bakery_id: validation.data.bakery_id,
        subject: validation.data.subject,
        description: validation.data.description,
        priority: validation.data.priority,
      })

      logger.info(`Admin created support ticket ${String(ticket.id)} for bakery ${String(validation.data.bakery_id)}`)

      return res.status(201).json({ data: ticket })
    } catch (error) {
      logger.error(`Error creating support ticket: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// GET /v1/admin/support/tickets/:ticketId - Get ticket details
supportRouter.get(
  '/tickets/:ticketId',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { ticketId } = req.params

      if (!ticketId || Array.isArray(ticketId)) {
        return res.status(400).json({ error: 'Ticket ID is required' })
      }

      const detail = await getTicketDetail(pool, ticketId)

      if (!detail) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      logger.info(`Admin retrieved support ticket ${String(ticketId)}`)

      return res.status(200).json({ data: detail })
    } catch (error) {
      logger.error(`Error retrieving support ticket: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// POST /v1/admin/support/tickets/:ticketId/messages - Add message to ticket
supportRouter.post(
  '/tickets/:ticketId/messages',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { ticketId } = req.params

      if (!ticketId || Array.isArray(ticketId)) {
        return res.status(400).json({ error: 'Ticket ID is required' })
      }

      const validation = addMessageSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      // Verify ticket exists
      const ticket = await getTicketById(pool, ticketId)
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      if (!req.auth || !('sub' in req.auth) || typeof req.auth.sub !== 'string') {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const message = await addMessage(pool, {
        ticket_id: ticketId,
        sender_id: req.auth.sub,
        sender_type: 'super_admin',
        message: validation.data.message,
      })

      logger.info(`Admin added message to support ticket ${ticketId}`)

      return res.status(201).json({ data: message })
    } catch (error) {
      logger.error(`Error adding message to ticket: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// PATCH /v1/admin/support/tickets/:ticketId/status - Update ticket status
supportRouter.patch(
  '/tickets/:ticketId/status',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { ticketId } = req.params

      if (!ticketId || Array.isArray(ticketId)) {
        return res.status(400).json({ error: 'Ticket ID is required' })
      }

      const validation = updateStatusSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const ticket = await updateTicketStatus(pool, ticketId, validation.data.status)

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      logger.info(`Admin updated support ticket ${ticketId} status to ${String(validation.data.status)}`)

      return res.status(200).json({ data: ticket })
    } catch (error) {
      logger.error(`Error updating ticket status: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// PATCH /v1/admin/support/tickets/:ticketId/assign - Assign ticket to admin
supportRouter.patch(
  '/tickets/:ticketId/assign',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { ticketId } = req.params

      if (!ticketId || Array.isArray(ticketId)) {
        return res.status(400).json({ error: 'Ticket ID is required' })
      }

      const validation = assignAdminSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const ticket = await assignTicketToAdmin(pool, ticketId, validation.data.admin_id || null)

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      logger.info(
        `Admin ${validation.data.admin_id ? 'assigned' : 'unassigned'} support ticket ${ticketId}`,
      )

      return res.status(200).json({ data: ticket })
    } catch (error) {
      logger.error(`Error assigning ticket: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

// PATCH /v1/admin/support/tickets/:ticketId/priority - Update ticket priority
supportRouter.patch(
  '/tickets/:ticketId/priority',
  authenticateToken('admin'),
  requireSuperAdminContext,
  async (req, res) => {
    try {
      const { ticketId } = req.params

      if (!ticketId || Array.isArray(ticketId)) {
        return res.status(400).json({ error: 'Ticket ID is required' })
      }

      const validation = updatePrioritySchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.issues,
        })
      }

      const ticket = await updateTicketPriority(pool, ticketId, validation.data.priority)

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      logger.info(`Admin updated support ticket ${ticketId} priority to ${validation.data.priority}`)

      return res.status(200).json({ data: ticket })
    } catch (error) {
      logger.error(`Error updating ticket priority: ${error instanceof Error ? error.message : 'unknown error'}`)
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
)

export default supportRouter
