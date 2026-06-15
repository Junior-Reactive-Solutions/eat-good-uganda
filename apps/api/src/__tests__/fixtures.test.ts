/**
 * Test fixtures verification
 * Ensures that the seed functions work correctly and return fresh deterministic data
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  seedBakery,
  seedBakeryUser,
  seedCustomer,
  seedProduct,
  seedOrder,
  seedSuperAdmin,
  resetSeedCounter,
  getSeedCounter,
  pool,
} from '@eatgood/db'
import { cleanupDB } from './test-utils'

describe('Database Fixtures', () => {
  beforeEach(() => {
    resetSeedCounter()
  })

  afterEach(async () => {
    await cleanupDB()
  })

  describe('seedBakery', () => {
    it('creates a bakery with deterministic slug', async () => {
      const bakery = await seedBakery(pool)

      expect(bakery).toBeDefined()
      expect(bakery.id).toBeDefined()
      expect(bakery.slug).toMatch(/^test-bakery-\d+$/)
      expect(bakery.slug).toBeTruthy()
    })

    it('accepts overrides', async () => {
      const bakery = await seedBakery(pool, {
        slug: 'custom-slug',
        legal_name: 'Custom Bakery Inc',
      })

      expect(bakery.slug).toBe('custom-slug')
      expect(bakery.legal_name).toBe('Custom Bakery Inc')
    })

    it('each bakery has a unique slug', async () => {
      const bakery1 = await seedBakery(pool)
      const bakery2 = await seedBakery(pool)

      expect(bakery1.slug).not.toBe(bakery2.slug)
    })

    it('returns UUID id', async () => {
      const bakery = await seedBakery(pool)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(bakery.id).toMatch(uuidRegex)
    })
  })

  describe('seedBakeryUser', () => {
    it('creates a bakery user linked to bakery', async () => {
      const bakery = await seedBakery(pool)
      const user = await seedBakeryUser(pool, bakery.id)

      expect(user).toBeDefined()
      expect(user.bakery_id).toBe(bakery.id)
      expect(user.email).toMatch(/^staff\d+@test\.com$/)
      expect(user.role).toBe('manager')
    })

    it('accepts role override', async () => {
      const bakery = await seedBakery(pool)
      const owner = await seedBakeryUser(pool, bakery.id, { role: 'owner' })
      const staff = await seedBakeryUser(pool, bakery.id, { role: 'staff' })

      expect(owner.role).toBe('owner')
      expect(staff.role).toBe('staff')
    })

    it('generates unique emails', async () => {
      const bakery = await seedBakery(pool)
      const user1 = await seedBakeryUser(pool, bakery.id)
      const user2 = await seedBakeryUser(pool, bakery.id)

      expect(user1.email).not.toBe(user2.email)
    })
  })

  describe('seedCustomer', () => {
    it('creates a customer with email', async () => {
      const customer = await seedCustomer(pool)

      expect(customer).toBeDefined()
      expect(customer.id).toBeDefined()
      expect(customer.email).toMatch(/^customer\d+@test\.com$/)
    })

    it('generates unique emails', async () => {
      const customer1 = await seedCustomer(pool)
      const customer2 = await seedCustomer(pool)

      expect(customer1.email).not.toBe(customer2.email)
    })
  })

  describe('seedProduct', () => {
    it('creates a product in a bakery', async () => {
      const bakery = await seedBakery(pool)
      const product = await seedProduct(pool, bakery.id)

      expect(product).toBeDefined()
      expect(product.bakery_id).toBe(bakery.id)
      expect(product.slug).toMatch(/^product-\d+$/)
      expect(product.name).toMatch(/^Test Product \d+$/)
      expect(product.base_price_minor).toBe(50000)
      expect(product.is_published).toBe(true)
    })

    it('accepts name and price overrides', async () => {
      const bakery = await seedBakery(pool)
      const product = await seedProduct(pool, bakery.id, {
        name: 'Chocolate Cake',
        base_price_minor: 75000,
      })

      expect(product.name).toBe('Chocolate Cake')
      expect(product.base_price_minor).toBe(75000)
    })

    it('creates products with different bakeries isolated', async () => {
      const bakery1 = await seedBakery(pool)
      const bakery2 = await seedBakery(pool)

      const product1 = await seedProduct(pool, bakery1.id)
      const product2 = await seedProduct(pool, bakery2.id)

      expect(product1.bakery_id).toBe(bakery1.id)
      expect(product2.bakery_id).toBe(bakery2.id)
      expect(product1.bakery_id).not.toBe(product2.bakery_id)
    })
  })

  describe('seedOrder', () => {
    it('creates an order for a bakery and customer', async () => {
      const bakery = await seedBakery(pool)
      const customer = await seedCustomer(pool)
      const order = await seedOrder(pool, {
        bakery_id: bakery.id,
        customer_id: customer.id,
      })

      expect(order).toBeDefined()
      expect(order.bakery_id).toBe(bakery.id)
      expect(order.customer_id).toBe(customer.id)
      expect(order.order_number).toMatch(/^EGU-TEST-\d+$/)
      expect(order.status).toBe('pending')
    })

    it('calculates total from subtotal and fees', async () => {
      const bakery = await seedBakery(pool)
      const order = await seedOrder(pool, {
        bakery_id: bakery.id,
        subtotal_minor: 50000,
        tax_minor: 5000,
        delivery_fee_minor: 10000,
      })

      expect(order.subtotal_minor).toBe(50000)
      expect(order.tax_minor).toBe(5000)
      expect(order.delivery_fee_minor).toBe(10000)
      expect(order.total_minor).toBe(65000)
    })
  })

  describe('seedSuperAdmin', () => {
    it('creates a super admin user', async () => {
      const admin = await seedSuperAdmin(pool)

      expect(admin).toBeDefined()
      expect(admin.id).toBeDefined()
      expect(admin.email).toMatch(/^admin\d+@test\.com$/)
      expect(admin.full_name).toMatch(/^Test Admin \d+$/)
    })

    it('accepts email override', async () => {
      const admin = await seedSuperAdmin(pool, {
        email: 'superadmin@platform.com',
      })

      expect(admin.email).toBe('superadmin@platform.com')
    })
  })

  describe('seed counter', () => {
    it('increments with each seed', async () => {
      expect(getSeedCounter()).toBe(0)

      await seedBakery(pool)
      expect(getSeedCounter()).toBe(1)

      await seedBakery(pool)
      expect(getSeedCounter()).toBe(2)

      await seedCustomer(pool)
      expect(getSeedCounter()).toBe(3)
    })

    it('resets when resetSeedCounter is called', async () => {
      await seedBakery(pool)
      expect(getSeedCounter()).toBeGreaterThan(0)

      resetSeedCounter()
      expect(getSeedCounter()).toBe(0)
    })
  })

  describe('fixture interaction', () => {
    it('creates complete relational structure', async () => {
      const bakery = await seedBakery(pool)
      const user = await seedBakeryUser(pool, bakery.id)
      const product = await seedProduct(pool, bakery.id)
      const customer = await seedCustomer(pool)
      const order = await seedOrder(pool, {
        bakery_id: bakery.id,
        customer_id: customer.id,
      })

      // Verify all relationships
      expect(user.bakery_id).toBe(bakery.id)
      expect(product.bakery_id).toBe(bakery.id)
      expect(order.bakery_id).toBe(bakery.id)
      expect(order.customer_id).toBe(customer.id)

      // Verify isolation between bakeries
      const bakery2 = await seedBakery(pool)
      const product2 = await seedProduct(pool, bakery2.id)

      expect(product2.bakery_id).not.toBe(bakery.id)
      expect(product2.bakery_id).toBe(bakery2.id)
    })
  })
})
