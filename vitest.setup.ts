import { beforeAll, afterEach, vi } from 'vitest'

/**
 * Global test setup file
 * Runs once before all tests
 */

beforeAll(() => {
  // Ensure NODE_ENV is set to test
  process.env.NODE_ENV = 'test'
})

afterEach(() => {
  // Clear all module mocks after each test
  vi.clearAllMocks()
})

// Mock timers if needed globally
// vi.useFakeTimers()
