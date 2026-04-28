import { describe, expect, it } from 'vitest'

import { formatUGX } from './money'

describe('money helper', () => {
  it('formats ugx values', () => {
    expect(formatUGX(40000)).toBe('UGX 40,000')
  })
})
