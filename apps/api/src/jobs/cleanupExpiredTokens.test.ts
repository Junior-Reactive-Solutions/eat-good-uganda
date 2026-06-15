import { describe, expect, it, vi } from 'vitest'

import { cleanupExpiredTokens } from './cleanupExpiredTokens'

// Mock the db module
vi.mock('@eatgood/db', () => ({
  query: vi.fn(),
  sql: vi.fn((strings: string[]) => strings.join('')),
}))

describe('cleanupExpiredTokens', () => {
  it('should return summary with zero deletions when no tokens are expired', async () => {
    const { query } = await import('@eatgood/db')
    const mockQuery = vi.mocked(query)

    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })

    const mockDb = {} as never

    const summary = await cleanupExpiredTokens(mockDb)

    expect(summary.refreshTokensDeleted).toBe(0)
    expect(summary.emailVerificationTokensDeleted).toBe(0)
    expect(summary.passwordResetTokensDeleted).toBe(0)
    expect(summary.totalDeleted).toBe(0)
  })

  it('should sum all deleted tokens correctly', async () => {
    const { query } = await import('@eatgood/db')
    const mockQuery = vi.mocked(query)

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 5,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 3,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 2,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })

    const mockDb = {} as never

    const summary = await cleanupExpiredTokens(mockDb)

    expect(summary.refreshTokensDeleted).toBe(5)
    expect(summary.emailVerificationTokensDeleted).toBe(3)
    expect(summary.passwordResetTokensDeleted).toBe(2)
    expect(summary.totalDeleted).toBe(10)
  })

  it('should handle query failures gracefully', async () => {
    const { query } = await import('@eatgood/db')
    const mockQuery = vi.mocked(query)

    mockQuery.mockRejectedValueOnce(new Error('Database error'))
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 5,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 3,
      command: 'DELETE',
      oid: 0,
      fields: [],
    })

    const mockDb = {} as never

    const summary = await cleanupExpiredTokens(mockDb)

    // Should continue despite first query failure
    expect(summary.refreshTokensDeleted).toBe(0)
    expect(summary.emailVerificationTokensDeleted).toBe(5)
    expect(summary.passwordResetTokensDeleted).toBe(3)
    expect(summary.totalDeleted).toBe(8)
  })
})
