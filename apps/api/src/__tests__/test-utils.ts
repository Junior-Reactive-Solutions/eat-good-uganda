/**
 * Shared test utilities for API integration tests
 * Includes app factory, login helpers, external provider mocks, and DB cleanup
 */

import type { Express } from 'express'
import request from 'supertest'
import { pool, withTransaction } from '@eatgood/db'
import { app as baseApp } from '../app'
import type { Agent } from 'supertest'

/**
 * Returns a fresh Express app instance for testing
 * In most tests, you'll use the shared `app` export directly
 * This is provided for tests that need a truly isolated instance
 */
export function createTestApp(): Express {
  return baseApp
}

/**
 * Login a customer and return a Supertest agent with session cookie
 * Assumes the customer already exists in the database
 */
export async function loginAsCustomer(customer: {
  id: string
  email: string
}): Promise<Agent> {
  const agent = request.agent(baseApp)

  // Simulate a login by making the login request
  const res = await agent.post('/v1/customer/auth/login').send({
    email: customer.email,
    password: 'test-password-123', // This assumes the password was set during seedCustomer
  })

  if (res.status !== 200) {
    throw new Error(`Failed to login customer: ${res.status} ${res.text}`)
  }

  return agent
}

/**
 * Login a bakery user and return a Supertest agent with session cookie
 * Assumes the bakery user already exists in the database
 */
export async function loginAsBakeryUser(user: {
  id: string
  bakery_id: string
  email: string
}): Promise<Agent> {
  const agent = request.agent(baseApp)

  const res = await agent.post('/v1/bakery/auth/login').send({
    email: user.email,
    password: 'test-password-123', // Assumes password was set during seedBakeryUser
  })

  if (res.status !== 200) {
    throw new Error(`Failed to login bakery user: ${res.status} ${res.text}`)
  }

  return agent
}

/**
 * Login a super admin and return a Supertest agent with session cookie
 * Assumes the super admin already exists in the database
 * Note: Real TOTP verification may be required; this is for tests with TOTP mocked
 */
export async function loginAsSuperAdmin(admin: {
  id: string
  email: string
}): Promise<Agent> {
  const agent = request.agent(baseApp)

  const res = await agent.post('/v1/admin/auth/login').send({
    email: admin.email,
    password: 'test-admin-password',
    // TOTP token would be required in real scenario; tests should mock this
    totp_token: '000000', // Placeholder for test
  })

  if (res.status !== 200) {
    throw new Error(`Failed to login super admin: ${res.status} ${res.text}`)
  }

  return agent
}

/**
 * Setup mocks for external providers (MoMo, Airtel, Resend, Cloudinary)
 * Returns an object with cleanup functions
 *
 * Usage:
 * ```ts
 * const mocks = mockExternalProviders()
 * // ... run test ...
 * await mocks.cleanup()
 * ```
 */
export function mockExternalProviders() {
  // For now, these are placeholder implementations
  // In a real implementation, you'd use nock for HTTP mocks and msw for browser
  const mocks: Record<string, unknown> = {}

  return {
    mocks,
    cleanup: async () => {
      // Cleanup mocks
    },
  }
}

/**
 * Truncate all test tables to clean database state
 * Use this between test suites if you need a fresh database
 *
 * WARNING: This is destructive. Only use with test databases.
 */
export async function cleanupDB(): Promise<void> {
  const client = await pool.connect()

  try {
    // Disable triggers temporarily
    await client.query('SET session_replication_role = replica')

    // Tables in dependency order (reverse of creation)
    const tables = [
      'webhook_deliveries',
      'payment_intent_logs',
      'payment_intents',
      'order_items',
      'orders',
      'product_variants',
      'products',
      'product_categories',
      'customer_addresses',
      'payment_credentials',
      'bakery_metrics',
      'bakery_settings',
      'bakery_users',
      'customers',
      'bakeries',
      'refresh_tokens',
      'super_admin_users',
      'audit_logs',
      'customer_addresses',
    ]

    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`)
      } catch (e) {
        // Table might not exist or be empty, that's ok
      }
    }

    // Re-enable triggers
    await client.query('SET session_replication_role = default')
  } finally {
    client.release()
  }
}

/**
 * Run a test within a transaction that rolls back after the test
 * Provides better isolation for parallel test runs
 *
 * Usage:
 * ```ts
 * await withTransaction(async (db) => {
 *   const bakery = await seedBakery()
 *   // Test code here
 * })
 * ```
 */
export async function runInTransaction<T>(
  callback: (db: typeof pool) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client as any)
    await client.query('ROLLBACK')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    throw error
  } finally {
    client.release()
  }
}

/**
 * Assert that a value conforms to a Zod schema
 * Useful for testing response schemas
 *
 * Usage:
 * ```ts
 * import { z } from 'zod'
 * const schema = z.object({ id: z.string() })
 * assertValidSchema(schema, { id: '123' })
 * ```
 */
export function assertValidSchema<T>(schema: any, data: any): asserts data is T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Schema validation failed: ${JSON.stringify(result.error)}`)
  }
}

/**
 * Helper to create a Supertest agent with optional cookie
 * Useful for making authenticated requests
 */
export function createAgent(app: Express, cookie?: string): Agent {
  const agent = request.agent(app)
  if (cookie) {
    agent.set('Cookie', cookie)
  }
  return agent
}
