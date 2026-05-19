import type { Database } from '../client'
import { query } from '../client'
import { sql } from '../sql'

// Type definitions
export interface SupportTicket {
  id: string
  bakery_id: string
  admin_id: string | null
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'bakery_user' | 'super_admin' | 'system'
  message: string
  created_at: Date
}

export interface TicketDetail extends SupportTicket {
  messages: TicketMessage[]
}

// Column selections
const TICKET_COLS = sql`
  id, bakery_id, admin_id, subject, description,
  status, priority, created_at, updated_at, deleted_at
`

const MESSAGE_COLS = sql`
  id, ticket_id, sender_id, sender_type, message, created_at
`

// Query interfaces
export interface GetTicketsFilters {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  bakeryId: string
  priority?: 'low' | 'medium' | 'high'
  limit?: number
  offset?: number
}

export interface GetTicketsResult {
  tickets: SupportTicket[]
  total: number
}

/**
 * List support tickets with pagination and filtering
 */
export async function getTickets(
  db: Database,
  filters: GetTicketsFilters,
): Promise<GetTicketsResult> {
  const { bakeryId, status, priority, limit = 20, offset = 0 } = filters

  // Build WHERE clause
  let whereClause = sql`WHERE bakery_id = ${bakeryId} AND deleted_at IS NULL`

  if (status) {
    whereClause = sql`${whereClause} AND status = ${status}`
  }

  if (priority) {
    whereClause = sql`${whereClause} AND priority = ${priority}`
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    db,
    sql`SELECT COUNT(*) as count FROM support_tickets ${whereClause}`,
  )
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10)

  // Get paginated results
  const result = await query<SupportTicket>(
    db,
    sql`SELECT ${TICKET_COLS} FROM support_tickets
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}`,
  )

  return {
    tickets: result.rows,
    total,
  }
}

/**
 * Get a single ticket with all its messages
 */
export async function getTicketDetail(db: Database, ticketId: string): Promise<TicketDetail | null> {
  // Get ticket
  const ticketResult = await query<SupportTicket>(
    db,
    sql`SELECT ${TICKET_COLS} FROM support_tickets
        WHERE id = ${ticketId} AND deleted_at IS NULL
        LIMIT 1`,
  )

  const ticket = ticketResult.rows[0]
  if (!ticket) return null

  // Get messages
  const messagesResult = await query<TicketMessage>(
    db,
    sql`SELECT ${MESSAGE_COLS} FROM ticket_messages
        WHERE ticket_id = ${ticketId}
        ORDER BY created_at ASC`,
  )

  return {
    ...ticket,
    messages: messagesResult.rows,
  }
}

/**
 * Create a new support ticket
 */
export interface CreateTicketInput {
  bakery_id: string
  subject: string
  description: string
  priority?: 'low' | 'medium' | 'high'
}

export async function createTicket(db: Database, input: CreateTicketInput): Promise<SupportTicket> {
  const { bakery_id, subject, description, priority = 'medium' } = input

  const result = await query<SupportTicket>(
    db,
    sql`INSERT INTO support_tickets (bakery_id, subject, description, priority, status)
        VALUES (${bakery_id}, ${subject}, ${description}, ${priority}, 'open')
        RETURNING ${TICKET_COLS}`,
  )

  const ticket = result.rows[0]
  if (!ticket) throw new Error('Failed to create support ticket')

  return ticket
}

/**
 * Add a message to a ticket
 */
export interface AddMessageInput {
  ticket_id: string
  sender_id: string
  sender_type: 'bakery_user' | 'super_admin' | 'system'
  message: string
}

export async function addMessage(db: Database, input: AddMessageInput): Promise<TicketMessage> {
  const { ticket_id, sender_id, sender_type, message } = input

  const result = await query<TicketMessage>(
    db,
    sql`INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message)
        VALUES (${ticket_id}, ${sender_id}, ${sender_type}, ${message})
        RETURNING ${MESSAGE_COLS}`,
  )

  const msg = result.rows[0]
  if (!msg) throw new Error('Failed to add message to ticket')

  return msg
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  db: Database,
  ticketId: string,
  newStatus: 'open' | 'in_progress' | 'resolved' | 'closed',
): Promise<SupportTicket | null> {
  const result = await query<SupportTicket>(
    db,
    sql`UPDATE support_tickets
        SET status = ${newStatus}, updated_at = now()
        WHERE id = ${ticketId} AND deleted_at IS NULL
        RETURNING ${TICKET_COLS}`,
  )

  return result.rows[0] ?? null
}

/**
 * Assign ticket to admin
 */
export async function assignTicketToAdmin(
  db: Database,
  ticketId: string,
  adminId: string | null,
): Promise<SupportTicket | null> {
  const result = await query<SupportTicket>(
    db,
    sql`UPDATE support_tickets
        SET admin_id = ${adminId}, updated_at = now()
        WHERE id = ${ticketId} AND deleted_at IS NULL
        RETURNING ${TICKET_COLS}`,
  )

  return result.rows[0] ?? null
}

/**
 * Update ticket priority
 */
export async function updateTicketPriority(
  db: Database,
  ticketId: string,
  priority: 'low' | 'medium' | 'high',
): Promise<SupportTicket | null> {
  const result = await query<SupportTicket>(
    db,
    sql`UPDATE support_tickets
        SET priority = ${priority}, updated_at = now()
        WHERE id = ${ticketId} AND deleted_at IS NULL
        RETURNING ${TICKET_COLS}`,
  )

  return result.rows[0] ?? null
}

/**
 * Get ticket by ID (admin access)
 */
export async function getTicketById(db: Database, ticketId: string): Promise<SupportTicket | null> {
  const result = await query<SupportTicket>(
    db,
    sql`SELECT ${TICKET_COLS} FROM support_tickets
        WHERE id = ${ticketId} AND deleted_at IS NULL
        LIMIT 1`,
  )

  return result.rows[0] ?? null
}
