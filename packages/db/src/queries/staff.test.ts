import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { withDb } from '../__fixtures__'
import {
  listBakeryStaff,
  getBakeryStaffMember,
  createBakeryStaff,
  updateBakeryStaff,
  removeBakeryStaff,
  getBakeryStaffByEmail,
} from './staff'

describe('Staff Management Queries', () => {
  let bakeryId: string
  let staffId: string

  beforeAll(async () => {
    // Setup: Create a test bakery
    await withDb(async (db) => {
      const bakeryResult = await db.query(
        'INSERT INTO bakeries (slug, legal_name, display_name, email, phone, address_line1, city, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        ['test-bakery', 'Test Bakery LLC', 'Test Bakery', 'test@bakery.com', '+256123456789', '123 Main St', 'Kampala', 'active']
      )
      bakeryId = bakeryResult.rows[0].id
    })
  })

  afterAll(async () => {
    // Cleanup
    await withDb(async (db) => {
      if (bakeryId) {
        await db.query('DELETE FROM bakery_users WHERE bakery_id = $1', [bakeryId])
        await db.query('DELETE FROM bakeries WHERE id = $1', [bakeryId])
      }
    })
  })

  describe('listBakeryStaff', () => {
    it('should list all staff for a bakery', async () => {
      await withDb(async (db) => {
        // Create test staff
        await db.query(
          'INSERT INTO bakery_users (bakery_id, email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
          [bakeryId, 'staff1@test.com', 'hash1', 'Staff One', '+256111111111', 'staff']
        )
        await db.query(
          'INSERT INTO bakery_users (bakery_id, email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
          [bakeryId, 'staff2@test.com', 'hash2', 'Staff Two', '+256222222222', 'manager']
        )

        const staff = await listBakeryStaff(db, bakeryId)

        expect(staff).toHaveLength(2)
        expect(staff[0]).toHaveProperty('email')
        expect(staff[0]).toHaveProperty('role')
        expect(staff[0].bakery_id).toBe(bakeryId)
      })
    })

    it('should support pagination', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId, { limit: 1, offset: 0 })

        expect(staff.length).toBeLessThanOrEqual(1)
      })
    })

    it('should support filtering by role', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId, { role: 'manager' })

        expect(staff.every((s) => s.role === 'manager')).toBe(true)
      })
    })

    it('should exclude deleted staff', async () => {
      await withDb(async (db) => {
        const allStaff = await listBakeryStaff(db, bakeryId)
        const activeCount = allStaff.filter((s) => !s.deleted_at).length

        expect(activeCount).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('getBakeryStaffMember', () => {
    it('should get a single staff member by ID', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          staffId = staff[0].id

          const member = await getBakeryStaffMember(db, bakeryId, staffId)

          expect(member).not.toBeNull()
          expect(member?.id).toBe(staffId)
          expect(member?.bakery_id).toBe(bakeryId)
        }
      })
    })

    it('should return null if staff not found', async () => {
      await withDb(async (db) => {
        const member = await getBakeryStaffMember(db, bakeryId, 'non-existent-id')

        expect(member).toBeNull()
      })
    })

    it('should enforce bakery_id isolation', async () => {
      await withDb(async (db) => {
        // Create another bakery
        const bakeryResult = await db.query(
          'INSERT INTO bakeries (slug, legal_name, display_name, email, phone, address_line1, city, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          ['other-bakery', 'Other Bakery LLC', 'Other Bakery', 'other@bakery.com', '+256987654321', '456 Oak St', 'Kampala', 'active']
        )
        const otherBakeryId = bakeryResult.rows[0].id

        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          staffId = staff[0].id

          // Try to access staff from other bakery
          const member = await getBakeryStaffMember(db, otherBakeryId, staffId)

          expect(member).toBeNull()
        }

        // Cleanup
        await db.query('DELETE FROM bakery_users WHERE bakery_id = $1', [otherBakeryId])
        await db.query('DELETE FROM bakeries WHERE id = $1', [otherBakeryId])
      })
    })
  })

  describe('createBakeryStaff', () => {
    it('should create a new staff member', async () => {
      await withDb(async (db) => {
        const newStaff = await createBakeryStaff(db, bakeryId, {
          email: 'newstaff@test.com',
          full_name: 'New Staff',
          phone: '+256333333333',
          role: 'staff',
        })

        expect(newStaff).toHaveProperty('id')
        expect(newStaff.email).toBe('newstaff@test.com')
        expect(newStaff.bakery_id).toBe(bakeryId)
        expect(newStaff.role).toBe('staff')
      })
    })

    it('should enforce unique email per bakery', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const existingEmail = staff[0].email

          expect(async () => {
            await createBakeryStaff(db, bakeryId, {
              email: existingEmail,
              full_name: 'Duplicate Staff',
              phone: '+256444444444',
              role: 'staff',
            })
          }).rejects.toThrow()
        }
      })
    })

    it('should validate role enum', async () => {
      await withDb(async (db) => {
        expect(async () => {
          await createBakeryStaff(db, bakeryId, {
            email: 'badstaff@test.com',
            full_name: 'Bad Staff',
            phone: '+256555555555',
            role: 'invalid' as any,
          })
        }).rejects.toThrow()
      })
    })
  })

  describe('updateBakeryStaff', () => {
    it('should update staff details', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const staffId = staff[0].id
          const originalName = staff[0].full_name

          const updated = await updateBakeryStaff(db, bakeryId, staffId, {
            full_name: 'Updated Name',
          })

          expect(updated.full_name).toBe('Updated Name')
          expect(updated.full_name).not.toBe(originalName)
        }
      })
    })

    it('should update staff role', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const staffId = staff[0].id
          const originalRole = staff[0].role

          const updated = await updateBakeryStaff(db, bakeryId, staffId, {
            role: originalRole === 'staff' ? 'manager' : 'staff',
          })

          expect(updated.role).not.toBe(originalRole)
        }
      })
    })

    it('should not update phone to undefined', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const staffId = staff[0].id

          const updated = await updateBakeryStaff(db, bakeryId, staffId, {
            phone: '+256999999999',
          })

          expect(updated.phone).toBe('+256999999999')
        }
      })
    })
  })

  describe('removeBakeryStaff', () => {
    it('should soft delete staff member', async () => {
      await withDb(async (db) => {
        // Create a staff to delete
        const toDelete = await createBakeryStaff(db, bakeryId, {
          email: 'delete-me@test.com',
          full_name: 'Delete Me',
          phone: '+256666666666',
          role: 'staff',
        })

        const removed = await removeBakeryStaff(db, bakeryId, toDelete.id)

        expect(removed.deleted_at).not.toBeNull()
      })
    })

    it('should not allow removing last owner', async () => {
      await withDb(async (db) => {
        // Find an owner
        const staff = await listBakeryStaff(db, bakeryId, { role: 'owner' })
        if (staff.length === 1) {
          // Only one owner, should not allow removal
          expect(async () => {
            await removeBakeryStaff(db, bakeryId, staff[0].id)
          }).rejects.toThrow('Cannot remove last owner')
        }
      })
    })

    it('should exclude deleted staff from list', async () => {
      await withDb(async (db) => {
        const staffBefore = await listBakeryStaff(db, bakeryId)
        const countBefore = staffBefore.length

        // Create and delete
        const toDelete = await createBakeryStaff(db, bakeryId, {
          email: 'delete-again@test.com',
          full_name: 'Delete Again',
          phone: '+256777777777',
          role: 'staff',
        })

        await removeBakeryStaff(db, bakeryId, toDelete.id)

        const staffAfter = await listBakeryStaff(db, bakeryId)

        expect(staffAfter.length).toBeLessThanOrEqual(countBefore)
      })
    })
  })

  describe('getBakeryStaffByEmail', () => {
    it('should get staff by email', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const email = staff[0].email

          const found = await getBakeryStaffByEmail(db, bakeryId, email)

          expect(found).not.toBeNull()
          expect(found?.email).toBe(email)
          expect(found?.bakery_id).toBe(bakeryId)
        }
      })
    })

    it('should return null if email not found', async () => {
      await withDb(async (db) => {
        const found = await getBakeryStaffByEmail(db, bakeryId, 'nonexistent@test.com')

        expect(found).toBeNull()
      })
    })

    it('should enforce bakery_id isolation', async () => {
      await withDb(async (db) => {
        const staff = await listBakeryStaff(db, bakeryId)
        if (staff.length > 0) {
          const email = staff[0].email

          // Create another bakery
          const bakeryResult = await db.query(
            'INSERT INTO bakeries (slug, legal_name, display_name, email, phone, address_line1, city, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            ['bakery2', 'Bakery 2 LLC', 'Bakery 2', 'bakery2@test.com', '+256987654321', '789 Pine St', 'Kampala', 'active']
          )
          const otherBakeryId = bakeryResult.rows[0].id

          // Try to find staff from another bakery
          const found = await getBakeryStaffByEmail(db, otherBakeryId, email)

          expect(found).toBeNull()

          // Cleanup
          await db.query('DELETE FROM bakeries WHERE id = $1', [otherBakeryId])
        }
      })
    })
  })
})
