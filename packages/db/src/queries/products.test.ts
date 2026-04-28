import { describe, expect, it } from 'vitest'

import { seedBakery, seedProduct } from '../fixtures'

describe('products helper smoke test', () => {
  it('seeds fixture rows for products', () => {
    const bakery = seedBakery({ slug: 'fixture-bakery' })
    const product = seedProduct({ bakery_id: bakery.id, name: 'Fixture Cake' })

    expect(product.bakery_id).toBe(bakery.id)
    expect(product.name).toBe('Fixture Cake')
  })
})
