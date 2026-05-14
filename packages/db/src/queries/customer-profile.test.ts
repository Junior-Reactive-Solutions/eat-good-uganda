import { beforeEach, describe, expect, it } from 'vitest'

import { pool } from '../client'

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddress,
  getCustomerAddresses,
  getCustomerProfile,
  updateCustomerAddress,
  updateCustomerProfile,
} from './customer-profile'

// Helper to create test customer
async function createTestCustomer(userId: string): Promise<{ id: string } | undefined> {
  const result = await pool.query(
    `INSERT INTO customers (id, email, full_name)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, `test-${userId}@example.com`, 'Test Customer'],
  )
  return result.rows[0] as { id: string } | undefined
}

// Helper to create test profile
async function createTestProfile(userId: string): Promise<{ id: string } | undefined> {
  const result = await pool.query(
    `INSERT INTO customer_profiles (user_id, first_name, last_name)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, 'John', 'Doe'],
  )
  return result.rows[0] as { id: string } | undefined
}

describe('Customer Profile Queries', () => {
  const userId = 'user-test-123'

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM customer_profiles WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM customers WHERE id = $1', [userId])
  })

  describe('getCustomerProfile', () => {
    it('returns complete profile when it exists', async () => {
      await createTestCustomer(userId)
      await createTestProfile(userId)

      const profile = await getCustomerProfile(pool, userId)

      expect(profile).not.toBeNull()
      expect(profile?.user_id).toBe(userId)
      expect(profile?.first_name).toBe('John')
      expect(profile?.last_name).toBe('Doe')
    })

    it('returns null when profile does not exist', async () => {
      const profile = await getCustomerProfile(pool, 'nonexistent-user')

      expect(profile).toBeNull()
    })
  })

  describe('updateCustomerProfile', () => {
    it('updates specified fields only', async () => {
      await createTestCustomer(userId)
      await createTestProfile(userId)

      const updated = await updateCustomerProfile(pool, userId, {
        first_name: 'Jane',
      })

      expect(updated?.first_name).toBe('Jane')
      expect(updated?.last_name).toBe('Doe') // unchanged
    })

    it('updates bio and avatar', async () => {
      await createTestCustomer(userId)
      await createTestProfile(userId)

      const updated = await updateCustomerProfile(pool, userId, {
        bio: 'I love baking',
        avatar_url: 'https://example.com/avatar.jpg',
      })

      expect(updated?.bio).toBe('I love baking')
      expect(updated?.avatar_url).toBe('https://example.com/avatar.jpg')
    })

    it('returns null when profile does not exist', async () => {
      const updated = await updateCustomerProfile(pool, 'nonexistent', {
        first_name: 'Test',
      })

      expect(updated).toBeNull()
    })
  })
})

describe('Customer Address Queries', () => {
  const userId = 'user-addr-123'

  beforeEach(async () => {
    await pool.query('DELETE FROM customer_addresses WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM customers WHERE id = $1', [userId])
  })

  describe('getCustomerAddresses', () => {
    it('returns all addresses sorted by default and creation time', async () => {
      await createTestCustomer(userId)

      // Create multiple addresses
      const addr1Result = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district, is_default, is_delivery_address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, '123 Main St', 'Kampala', 'Makindye', false, true],
      )
      const addr1 = addr1Result.rows[0] as { id: string } | undefined

      const addr2Result = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district, is_default, is_delivery_address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, '456 Oak Ave', 'Entebbe', 'Entebbe', true, false],
      )
      const addr2 = addr2Result.rows[0] as { id: string } | undefined

      const addresses = await getCustomerAddresses(pool, userId)

      expect(addresses).toHaveLength(2)
      // Default address should come first
      expect(addresses[0]?.id).toBe(addr2?.id)
      expect(addresses[0]?.is_default).toBe(true)
      expect(addresses[1]?.id).toBe(addr1?.id)
    })

    it('returns empty array when no addresses exist', async () => {
      const addresses = await getCustomerAddresses(pool, 'nonexistent-user')

      expect(addresses).toEqual([])
    })
  })

  describe('getCustomerAddress', () => {
    it('returns single address for authorized user', async () => {
      await createTestCustomer(userId)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district, is_delivery_address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, '789 Elm St', 'Makindye', 'Makindye', true],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      const address = await getCustomerAddress(pool, userId, addressId)

      expect(address).not.toBeNull()
      expect(address?.id).toBe(addressId)
      expect(address?.street_address).toBe('789 Elm St')
    })

    it('returns null when address does not belong to user', async () => {
      const address = await getCustomerAddress(pool, userId, 'wrong-address-id')

      expect(address).toBeNull()
    })
  })

  describe('createCustomerAddress', () => {
    it('creates new address', async () => {
      await createTestCustomer(userId)

      const address = await createCustomerAddress(pool, userId, {
        street_address: 'New Street 123',
        city: 'Kampala',
        district: 'Nakawa',
        is_delivery_address: true,
        is_billing_address: false,
      })

      expect(address).not.toBeNull()
      expect(address?.street_address).toBe('New Street 123')
      expect(address?.city).toBe('Kampala')
      expect(address?.is_default).toBe(false)
    })

    it('creates address as default and unsets other defaults', async () => {
      await createTestCustomer(userId)

      // Create first address as default
      const addr1 = await createCustomerAddress(pool, userId, {
        street_address: '1st St',
        city: 'Kampala',
        district: 'Makindye',
        is_delivery_address: true,
        is_billing_address: false,
        is_default: true,
      })

      expect(addr1?.is_default).toBe(true)

      // Create second address as default
      const addr2 = await createCustomerAddress(pool, userId, {
        street_address: '2nd St',
        city: 'Entebbe',
        district: 'Entebbe',
        is_delivery_address: false,
        is_billing_address: true,
        is_default: true,
      })

      expect(addr2?.is_default).toBe(true)

      // Check that first address is no longer default
      const updatedAddr1 = await getCustomerAddress(pool, userId, (addr1 as { id: string }).id)
      expect(updatedAddr1?.is_default).toBe(false)
    })
  })

  describe('updateCustomerAddress', () => {
    it('updates address fields', async () => {
      await createTestCustomer(userId)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, 'Old Street', 'Kampala', 'Makindye'],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      const updated = await updateCustomerAddress(pool, userId, addressId, {
        street_address: 'New Street',
        postal_code: '12345',
      })

      expect(updated?.street_address).toBe('New Street')
      expect(updated?.postal_code).toBe('12345')
      expect(updated?.city).toBe('Kampala') // unchanged
    })

    it('sets address as default and unsets other defaults', async () => {
      await createTestCustomer(userId)

      const addr1Result = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district, is_default)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, '1st St', 'Kampala', 'Makindye', true],
      )
      const addr1Id = (addr1Result.rows[0] as { id: string }).id

      const addr2Result = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district, is_default)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, '2nd St', 'Entebbe', 'Entebbe', false],
      )
      const addr2Id = (addr2Result.rows[0] as { id: string }).id

      // Set second address as default
      const updated = await updateCustomerAddress(pool, userId, addr2Id, {
        is_default: true,
      })

      expect(updated?.is_default).toBe(true)

      // Verify first address is no longer default
      const addr1 = await getCustomerAddress(pool, userId, addr1Id)
      expect(addr1?.is_default).toBe(false)
    })

    it('returns null when address does not belong to user', async () => {
      const updated = await updateCustomerAddress(pool, userId, 'wrong-id', {
        street_address: 'New Street',
      })

      expect(updated).toBeNull()
    })
  })

  describe('deleteCustomerAddress', () => {
    it('deletes address', async () => {
      await createTestCustomer(userId)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, 'Delete Me', 'Kampala', 'Makindye'],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      const deleted = await deleteCustomerAddress(pool, userId, addressId)

      expect(deleted).toBe(true)

      const address = await getCustomerAddress(pool, userId, addressId)
      expect(address).toBeNull()
    })

    it('returns false when address does not belong to user', async () => {
      const deleted = await deleteCustomerAddress(pool, userId, 'nonexistent-id')

      expect(deleted).toBe(false)
    })
  })

  describe('User isolation', () => {
    const user2Id = 'user-addr-456'

    beforeEach(async () => {
      await pool.query('DELETE FROM customer_addresses WHERE user_id = $1', [user2Id])
      await pool.query('DELETE FROM customers WHERE id = $1', [user2Id])
    })

    it('cannot access another users addresses', async () => {
      await createTestCustomer(userId)
      await createTestCustomer(user2Id)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, 'User 1 Address', 'Kampala', 'Makindye'],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      // User 2 tries to access User 1's address
      const address = await getCustomerAddress(pool, user2Id, addressId)

      expect(address).toBeNull()
    })

    it('cannot update another users addresses', async () => {
      await createTestCustomer(userId)
      await createTestCustomer(user2Id)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, 'User 1 Address', 'Kampala', 'Makindye'],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      // User 2 tries to update User 1's address
      const updated = await updateCustomerAddress(pool, user2Id, addressId, {
        street_address: 'Hacked Address',
      })

      expect(updated).toBeNull()
    })

    it('cannot delete another users addresses', async () => {
      await createTestCustomer(userId)
      await createTestCustomer(user2Id)

      const addrResult = await pool.query(
        `INSERT INTO customer_addresses
         (user_id, street_address, city, district)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, 'User 1 Address', 'Kampala', 'Makindye'],
      )
      const addressId = (addrResult.rows[0] as { id: string }).id

      // User 2 tries to delete User 1's address
      const deleted = await deleteCustomerAddress(pool, user2Id, addressId)

      expect(deleted).toBe(false)

      // Address should still exist
      const address = await getCustomerAddress(pool, userId, addressId)
      expect(address).not.toBeNull()
    })
  })
})
