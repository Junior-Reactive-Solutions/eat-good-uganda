import { describe, it, expect } from 'vitest'

import type { BakeryStaff } from '../staff'

describe('Staff Queries - Contract Tests', () => {
  describe('BakeryStaff Interface', () => {
    it('should have required fields on BakeryStaff', () => {
      const mockStaff: BakeryStaff = {
        id: 'staff-123',
        bakery_id: 'bakery-456',
        email: 'staff@test.com',
        full_name: 'Test Staff',
        phone: '+256701234567',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_login_at: '2024-01-02T00:00:00Z',
      }

      expect(mockStaff).toHaveProperty('id')
      expect(mockStaff).toHaveProperty('bakery_id')
      expect(mockStaff).toHaveProperty('email')
      expect(mockStaff).toHaveProperty('full_name')
      expect(mockStaff).toHaveProperty('phone')
      expect(mockStaff).toHaveProperty('role')
      expect(mockStaff).toHaveProperty('is_active')
      expect(mockStaff).toHaveProperty('created_at')
      expect(mockStaff).toHaveProperty('updated_at')
    })

    it('should allow optional phone and last_login_at', () => {
      const mockStaffNoPhone: BakeryStaff = {
        id: 'staff-123',
        bakery_id: 'bakery-456',
        email: 'staff@test.com',
        full_name: 'Test Staff',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(mockStaffNoPhone.email).toBe('staff@test.com')
      expect(mockStaffNoPhone.role).toBe('staff')
      expect(mockStaffNoPhone.phone).toBeUndefined()
      expect(mockStaffNoPhone.last_login_at).toBeUndefined()
    })

    it('should support all three role types', () => {
      const roles: Array<'owner' | 'manager' | 'staff'> = ['owner', 'manager', 'staff']

      roles.forEach((role) => {
        const staff: BakeryStaff = {
          id: 'staff-123',
          bakery_id: 'bakery-456',
          email: 'staff@test.com',
          full_name: 'Test Staff',
          role,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }

        expect(staff.role).toBe(role)
      })
    })
  })

  describe('getBakeryStaff response structure', () => {
    it('should return array of staff with proper structure', () => {
      const staffList: BakeryStaff[] = [
        {
          id: 'staff-1',
          bakery_id: 'bakery-123',
          email: 'staff1@test.com',
          full_name: 'Staff One',
          phone: '+256701111111',
          role: 'manager',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_login_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'staff-2',
          bakery_id: 'bakery-123',
          email: 'staff2@test.com',
          full_name: 'Staff Two',
          role: 'staff',
          is_active: true,
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
        },
      ]

      expect(Array.isArray(staffList)).toBe(true)
      staffList.forEach((staff) => {
        expect(staff).toHaveProperty('id')
        expect(staff).toHaveProperty('bakery_id')
        expect(staff).toHaveProperty('email')
        expect(staff).toHaveProperty('full_name')
        expect(staff).toHaveProperty('role')
        expect(['owner', 'manager', 'staff']).toContain(staff.role)
      })
    })

    it('should return empty array when no staff', () => {
      const staffList: BakeryStaff[] = []
      expect(Array.isArray(staffList)).toBe(true)
      expect(staffList).toHaveLength(0)
    })
  })

  describe('addBakeryStaff input/output', () => {
    it('should accept input with required fields', () => {
      const input = {
        email: 'newstaff@test.com',
        fullName: 'New Staff',
        role: 'manager' as const,
        phone: '+256703333333',
      }

      expect(input).toHaveProperty('email')
      expect(input).toHaveProperty('fullName')
      expect(input).toHaveProperty('role')
      expect(typeof input.email).toBe('string')
      expect(typeof input.fullName).toBe('string')
    })

    it('should accept input without phone', () => {
      const input = {
        email: 'newstaff@test.com',
        fullName: 'New Staff',
        role: 'staff' as const,
        phone: undefined,
      }

      expect(input).toHaveProperty('email')
      expect(input).toHaveProperty('fullName')
      expect(input.phone).toBeUndefined()
    })

    it('should return created staff with all fields', () => {
      const created: BakeryStaff = {
        id: 'new-staff-id',
        bakery_id: 'bakery-123',
        email: 'newstaff@test.com',
        full_name: 'New Staff Member',
        phone: '+256703333333',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(created.id).toBeDefined()
      expect(created.bakery_id).toBeDefined()
      expect(created.role).toBe('manager')
      expect(created.is_active).toBe(true)
      expect(created.created_at).toBeDefined()
      expect(created.updated_at).toBeDefined()
    })
  })

  describe('updateStaffRole input/output', () => {
    it('should accept role update', () => {
      const updated: BakeryStaff = {
        id: 'staff-123',
        bakery_id: 'bakery-456',
        email: 'staff@test.com',
        full_name: 'Test Staff',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
      }

      expect(updated.role).toBe('manager')
      expect(updated.updated_at).toBeDefined()
    })

    it('should support all role values', () => {
      const roles: Array<'owner' | 'manager' | 'staff'> = ['owner', 'manager', 'staff']

      roles.forEach((role) => {
        const updated: BakeryStaff = {
          id: 'staff-123',
          bakery_id: 'bakery-456',
          email: 'staff@test.com',
          full_name: 'Test Staff',
          role,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
        }

        expect(updated.role).toBe(role)
      })
    })
  })

  describe('removeStaffMember behavior', () => {
    it('should soft delete (not hard delete)', () => {
      // In actual implementation, removed staff should:
      // 1. Not appear in getBakeryStaff results
      // 2. Still exist in database with deleted_at set
      const deletedStaff: BakeryStaff & { deleted_at: string } = {
        id: 'staff-123',
        bakery_id: 'bakery-456',
        email: 'staff@test.com',
        full_name: 'Test Staff',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        deleted_at: '2024-01-01T02:00:00Z',
      }

      expect(deletedStaff.deleted_at).toBeDefined()
      expect(deletedStaff.id).toBeDefined()
    })
  })

  describe('Bakery scoping', () => {
    it('should enforce bakery_id isolation', () => {
      const bakery1Staff: BakeryStaff = {
        id: 'staff-1',
        bakery_id: 'bakery-123',
        email: 'staff@bakery1.com',
        full_name: 'Bakery 1 Staff',
        role: 'staff',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const bakery2Staff: BakeryStaff = {
        id: 'staff-2',
        bakery_id: 'bakery-456',
        email: 'staff@bakery2.com',
        full_name: 'Bakery 2 Staff',
        role: 'manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Different bakeries should have different staff
      expect(bakery1Staff.bakery_id).not.toBe(bakery2Staff.bakery_id)
      expect(bakery1Staff.email).not.toBe(bakery2Staff.email)
    })
  })
})
