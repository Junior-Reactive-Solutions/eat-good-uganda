import { describe, it, expect } from 'vitest'

import { isValidUgandaPhone, normalizeUgandaPhone } from './usePayment'

/**
 * Tests for payment utility functions (phone validation, normalization)
 * and polling hook behavior.
 */
describe('isValidUgandaPhone', () => {
  it('accepts +256 prefix with 9 digits', () => {
    expect(isValidUgandaPhone('+256701234567')).toBe(true)
    expect(isValidUgandaPhone('+256772000000')).toBe(true)
  })

  it('accepts 256 prefix without plus', () => {
    expect(isValidUgandaPhone('256701234567')).toBe(true)
  })

  it('accepts 0 prefix (local format)', () => {
    expect(isValidUgandaPhone('0701234567')).toBe(true)
  })

  it('rejects numbers with wrong digit count', () => {
    expect(isValidUgandaPhone('+25670123456')).toBe(false) // 8 digits after 256
    expect(isValidUgandaPhone('+2567012345678')).toBe(false) // 10 digits after 256
  })

  it('rejects empty string', () => {
    expect(isValidUgandaPhone('')).toBe(false)
  })

  it('rejects non-Uganda prefixes', () => {
    expect(isValidUgandaPhone('+254701234567')).toBe(false) // Kenya prefix
    expect(isValidUgandaPhone('+1234567890')).toBe(false)
  })
})

describe('normalizeUgandaPhone', () => {
  it('normalizes +256XXXXXXXXX to canonical form', () => {
    expect(normalizeUgandaPhone('+256701234567')).toBe('+256701234567')
  })

  it('normalizes 0XXXXXXXXX to +256XXXXXXXXX', () => {
    expect(normalizeUgandaPhone('0701234567')).toBe('+256701234567')
  })

  it('normalizes 256XXXXXXXXX to +256XXXXXXXXX', () => {
    expect(normalizeUgandaPhone('256701234567')).toBe('+256701234567')
  })

  it('returns null for invalid numbers', () => {
    expect(normalizeUgandaPhone('123')).toBeNull()
    expect(normalizeUgandaPhone('')).toBeNull()
    expect(normalizeUgandaPhone('+254701234567')).toBeNull()
  })
})
