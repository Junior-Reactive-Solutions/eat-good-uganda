import { describe, expect, it } from 'vitest'

import { sql } from './sql'

describe('sql helper', () => {
  it('returns text and values', () => {
    const query = sql`SELECT ${1}`

    expect(query.text).toBe('SELECT $1')
    expect(query.values).toEqual([1])
  })
})
