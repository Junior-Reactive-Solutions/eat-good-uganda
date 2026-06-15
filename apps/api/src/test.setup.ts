import { afterEach, beforeEach, vi } from 'vitest'
import { pool } from '@eatgood/db'

/**
 * API-specific test setup
 * Runs before each test in the API workspace
 */

beforeEach(() => {
  // Reset modules and mocks
  vi.clearAllMocks()
})

afterEach(async () => {
  // Clean up any pending connections
  // Do not drain the pool here as tests may run in parallel
})

// Ensure database connection is available during tests
if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DIRECT) {
  throw new Error('DATABASE_URL or DATABASE_URL_DIRECT must be set for tests')
}

// Configure pool for test environment
pool.options = {
  ...pool.options,
  // Use a test-specific timeout
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
}
