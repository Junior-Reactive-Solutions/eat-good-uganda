import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { pool } from '../../client'
import { sql } from '../../sql'
import {
  addMessage,
  assignTicketToAdmin,
  createTicket,
  getTicketById,
  getTicketDetail,
  getTickets,
  updateTicketPriority,
  updateTicketStatus,
} from '../support'

// Helper to seed test data
async function seedBakery(slug: string): Promise<string> {
  const result = await pool.query(sql`
    INSERT INTO bakeries (
      slug, legal_name, display_name, phone, email,
      address_line1, city, latitude, longitude, primary_color
    ) VALUES (
      ${slug}, ${slug}, ${slug}, '+256700000000', 'test@bakery.com',
      'Address 1', 'Kampala', 0.3476, 32.5825, '#8B4513'
    )
    RETURNING id
  `)
  const row = result.rows[0] as { id: string } | undefined
  const id = row?.id
  if (!id) throw new Error('Failed to create test bakery')
  return id
}

async function seedAdmin(): Promise<string> {
  const result = await pool.query(sql`
    INSERT INTO super_admin_users (email, password_hash, full_name)
    VALUES ('admin@test.com', 'hash', 'Test Admin')
    RETURNING id
  `)
  const row = result.rows[0] as { id: string } | undefined
  const id = row?.id
  if (!id) throw new Error('Failed to create test admin')
  return id
}

async function cleanupData() {
  await pool.query(sql`DELETE FROM ticket_messages`)
  await pool.query(sql`DELETE FROM support_tickets`)
  await pool.query(sql`DELETE FROM super_admin_users`)
  await pool.query(sql`DELETE FROM bakeries`)
}

describe('Support Tickets Queries', () => {
  beforeEach(async () => {
    await cleanupData()
  })

  afterEach(async () => {
    await cleanupData()
  })

  describe('createTicket', () => {
    it('creates a new support ticket with default priority', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Test Issue',
        description: 'Test Description',
      })

      expect(ticket).toBeDefined()
      expect(ticket.bakery_id).toBe(bakeryId)
      expect(ticket.subject).toBe('Test Issue')
      expect(ticket.description).toBe('Test Description')
      expect(ticket.status).toBe('open')
      expect(ticket.priority).toBe('medium')
      expect(ticket.admin_id).toBeNull()
      expect(ticket.deleted_at).toBeNull()
    })

    it('creates a new support ticket with specified priority', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Urgent Issue',
        description: 'This is urgent',
        priority: 'high',
      })

      expect(ticket.priority).toBe('high')
    })
  })

  describe('getTickets', () => {
    it('returns empty list when no tickets exist', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const result = await getTickets(pool, { bakeryId })

      expect(result.tickets).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('returns all tickets for bakery with pagination', async () => {
      const bakeryId = await seedBakery('test-bakery')

      // Create 5 tickets
      const issueNumbers = [0, 1, 2, 3, 4]
      for (const i of issueNumbers) {
        await createTicket(pool, {
          bakery_id: bakeryId,
          subject: `Issue ${String(i)}`,
          description: `Description ${String(i)}`,
        })
      }

      const result = await getTickets(pool, { bakeryId, limit: 3, offset: 0 })

      expect(result.tickets).toHaveLength(3)
      expect(result.total).toBe(5)
    })

    it('filters tickets by status', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const ticket1 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Open Issue',
        description: 'Desc',
      })

      const ticket2 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Another Issue',
        description: 'Desc',
      })

      await updateTicketStatus(pool, ticket2.id, 'in_progress')

      const openTickets = await getTickets(pool, { bakeryId, status: 'open' })
      const inProgressTickets = await getTickets(pool, { bakeryId, status: 'in_progress' })

      expect(openTickets.tickets).toHaveLength(1)
      const openTicket = openTickets.tickets[0]
      expect(openTicket).toBeDefined()
      expect(openTicket?.id).toBe(ticket1.id)

      expect(inProgressTickets.tickets).toHaveLength(1)
      const inProgressTicket = inProgressTickets.tickets[0]
      expect(inProgressTicket).toBeDefined()
      expect(inProgressTicket?.id).toBe(ticket2.id)
    })

    it('filters tickets by priority', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const ticket1 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'High Priority',
        description: 'Desc',
        priority: 'high',
      })

      const ticket2 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Low Priority',
        description: 'Desc',
        priority: 'low',
      })

      const highPriority = await getTickets(pool, { bakeryId, priority: 'high' })
      const lowPriority = await getTickets(pool, { bakeryId, priority: 'low' })

      expect(highPriority.tickets).toHaveLength(1)
      const highTicket = highPriority.tickets[0]
      expect(highTicket).toBeDefined()
      expect(highTicket?.id).toBe(ticket1.id)

      expect(lowPriority.tickets).toHaveLength(1)
      const lowTicket = lowPriority.tickets[0]
      expect(lowTicket).toBeDefined()
      expect(lowTicket?.id).toBe(ticket2.id)
    })

    it('respects offset for pagination', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const issueNumbers = [0, 1, 2, 3, 4]
      for (const i of issueNumbers) {
        await createTicket(pool, {
          bakery_id: bakeryId,
          subject: `Issue ${String(i)}`,
          description: 'Desc',
        })
      }

      const page1 = await getTickets(pool, { bakeryId, limit: 2, offset: 0 })
      const page2 = await getTickets(pool, { bakeryId, limit: 2, offset: 2 })

      expect(page1.tickets).toHaveLength(2)
      expect(page2.tickets).toHaveLength(2)
      const page1First = page1.tickets[0]
      const page2First = page2.tickets[0]
      expect(page1First).toBeDefined()
      expect(page2First).toBeDefined()
      expect(page1First?.id).not.toBe(page2First?.id)
    })
  })

  describe('getTicketDetail', () => {
    it('returns null for non-existent ticket', async () => {
      const detail = await getTicketDetail(pool, 'non-existent-id')
      expect(detail).toBeNull()
    })

    it('returns ticket with empty messages array', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      const detail = await getTicketDetail(pool, ticket.id)

      expect(detail).toBeDefined()
      expect(detail?.id).toBe(ticket.id)
      expect(detail?.messages).toHaveLength(0)
    })

    it('returns ticket with all messages', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const adminId = await seedAdmin()
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      await addMessage(pool, {
        ticket_id: ticket.id,
        sender_id: adminId,
        sender_type: 'super_admin',
        message: 'First response',
      })

      await addMessage(pool, {
        ticket_id: ticket.id,
        sender_id: 'some-user-id',
        sender_type: 'bakery_user',
        message: 'Thank you',
      })

      const detail = await getTicketDetail(pool, ticket.id)

      expect(detail?.messages).toHaveLength(2)
      const firstMessage = detail?.messages[0]
      const secondMessage = detail?.messages[1]
      expect(firstMessage?.message).toBe('First response')
      expect(secondMessage?.message).toBe('Thank you')
    })
  })

  describe('addMessage', () => {
    it('adds a message to a ticket', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const adminId = await seedAdmin()
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      const message = await addMessage(pool, {
        ticket_id: ticket.id,
        sender_id: adminId,
        sender_type: 'super_admin',
        message: 'We are looking into this',
      })

      expect(message).toBeDefined()
      expect(message.ticket_id).toBe(ticket.id)
      expect(message.sender_id).toBe(adminId)
      expect(message.sender_type).toBe('super_admin')
      expect(message.message).toBe('We are looking into this')
    })
  })

  describe('updateTicketStatus', () => {
    it('updates ticket status', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      const updated = await updateTicketStatus(pool, ticket.id, 'in_progress')

      expect(updated?.status).toBe('in_progress')
      expect(updated?.updated_at.getTime()).toBeGreaterThan(ticket.updated_at.getTime())
    })

    it('returns null for non-existent ticket', async () => {
      const updated = await updateTicketStatus(pool, 'non-existent', 'in_progress')
      expect(updated).toBeNull()
    })

    it('allows valid status transitions', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      let current = await updateTicketStatus(pool, ticket.id, 'in_progress')
      expect(current?.status).toBe('in_progress')

      current = await updateTicketStatus(pool, ticket.id, 'resolved')
      expect(current?.status).toBe('resolved')

      current = await updateTicketStatus(pool, ticket.id, 'closed')
      expect(current?.status).toBe('closed')
    })
  })

  describe('assignTicketToAdmin', () => {
    it('assigns ticket to admin', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const adminId = await seedAdmin()
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      const updated = await assignTicketToAdmin(pool, ticket.id, adminId)

      expect(updated?.admin_id).toBe(adminId)
    })

    it('clears admin assignment when set to null', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const adminId = await seedAdmin()
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      await assignTicketToAdmin(pool, ticket.id, adminId)
      const updated = await assignTicketToAdmin(pool, ticket.id, null)

      expect(updated?.admin_id).toBeNull()
    })
  })

  describe('updateTicketPriority', () => {
    it('updates ticket priority', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
        priority: 'low',
      })

      const updated = await updateTicketPriority(pool, ticket.id, 'high')

      expect(updated?.priority).toBe('high')
    })
  })

  describe('getTicketById', () => {
    it('returns ticket by id', async () => {
      const bakeryId = await seedBakery('test-bakery')
      const ticket = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Issue',
        description: 'Desc',
      })

      const fetched = await getTicketById(pool, ticket.id)

      expect(fetched?.id).toBe(ticket.id)
      expect(fetched?.subject).toBe('Issue')
    })

    it('returns null for non-existent ticket', async () => {
      const fetched = await getTicketById(pool, 'non-existent')
      expect(fetched).toBeNull()
    })
  })

  describe('soft deletes', () => {
    it('excludes deleted tickets from listing', async () => {
      const bakeryId = await seedBakery('test-bakery')

      const ticket1 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Active Ticket',
        description: 'Desc',
      })

      const ticket2 = await createTicket(pool, {
        bakery_id: bakeryId,
        subject: 'Deleted Ticket',
        description: 'Desc',
      })

      // Soft delete ticket2
      await pool.query(sql`
        UPDATE support_tickets
        SET deleted_at = now()
        WHERE id = ${ticket2.id}
      `)

      const result = await getTickets(pool, { bakeryId })

      expect(result.tickets).toHaveLength(1)
      const activeTicket = result.tickets[0]
      expect(activeTicket).toBeDefined()
      expect(activeTicket?.id).toBe(ticket1.id)
    })
  })
})
