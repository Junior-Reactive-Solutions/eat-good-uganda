import { pool } from '@eatgood/db'
import type { PoolClient } from 'pg'
import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { app } from '../../app'


describe('Public Bakeries API', () => {
  let client: PoolClient
  let testBakeryId: string
  let testCategoryId: string
  let testProductId: string
  let testVariantId: string

  beforeAll(async () => {
    client = await pool.connect()

    // Create test bakery
    const bakeryRes = await client.query(
      `INSERT INTO bakeries (
        id, slug, legal_name, display_name, status,
        phone, email, address_line1, city, country_code,
        latitude, longitude, timezone, primary_color
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id`,
      [
        'test-bakery-1',
        'test-bakery-slug',
        'Test Bakery Legal',
        'Test Bakery',
        'active',
        '+256123456789',
        'test@example.com',
        '123 Main Street',
        'Kampala',
        'UG',
        0.3476,
        32.5825,
        'Africa/Kampala',
        '#FF6B6B',
      ],
    )
    testBakeryId = bakeryRes.rows[0].id

    // Create test category
    const categoryRes = await client.query(
      `INSERT INTO product_categories (id, bakery_id, name, slug, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['test-category-1', testBakeryId, 'Test Category', 'test-category', 1],
    )
    testCategoryId = categoryRes.rows[0].id

    // Create test product (published)
    const productRes = await client.query(
      `INSERT INTO products (
        id, bakery_id, category_id, slug, name, base_price_minor,
        currency_code, is_published, is_available, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        'test-product-1',
        testBakeryId,
        testCategoryId,
        'test-product',
        'Test Product',
        50000,
        'UGX',
        true,
        true,
        1,
      ],
    )
    testProductId = productRes.rows[0].id

    // Create test variant
    const variantRes = await client.query(
      `INSERT INTO product_variants (
        id, product_id, bakery_id, name, price_minor, sort_order, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'test-variant-1',
        testProductId,
        testBakeryId,
        'Small',
        45000,
        1,
        true,
      ],
    )
    testVariantId = variantRes.rows[0].id

    // Create unpublished product for testing
    await client.query(
      `INSERT INTO products (
        id, bakery_id, category_id, slug, name, base_price_minor,
        currency_code, is_published, is_available, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'test-product-unpublished',
        testBakeryId,
        testCategoryId,
        'unpublished-product',
        'Unpublished Product',
        30000,
        'UGX',
        false,
        true,
        2,
      ],
    )

    // Create inactive bakery for testing
    await client.query(
      `INSERT INTO bakeries (
        id, slug, legal_name, display_name, status,
        phone, email, address_line1, city, country_code,
        latitude, longitude, timezone, primary_color
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )`,
      [
        'test-bakery-inactive',
        'inactive-bakery',
        'Inactive Bakery Legal',
        'Inactive Bakery',
        'suspended',
        '+256123456789',
        'inactive@example.com',
        '456 Side Street',
        'Kampala',
        'UG',
        0.3476,
        32.5825,
        'Africa/Kampala',
        '#FF6B6B',
      ],
    )
  })

  afterAll(async () => {
    // Clean up test data
    await client.query('DELETE FROM product_variants WHERE bakery_id = $1', [testBakeryId])
    await client.query('DELETE FROM products WHERE bakery_id = $1', [testBakeryId])
    await client.query('DELETE FROM product_categories WHERE bakery_id = $1', [testBakeryId])
    await client.query('DELETE FROM bakeries WHERE id = $1', [testBakeryId])
    await client.query('DELETE FROM bakeries WHERE slug = $1', ['inactive-bakery'])
    client.release()
  })

  describe('GET /v1/public/bakeries/:slug', () => {
    it('should return bakery details for active bakery', async () => {
      const res = await request(app).get(`/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}`)

      expect(res.status).toBe(200)
      expect(res.body.bakery).toBeDefined()
      expect(res.body.bakery.id).toBe(testBakeryId)
      expect(res.body.bakery.display_name).toBe('Test Bakery')
      expect(res.body.bakery.primary_color).toBe('#FF6B6B')
    })

    it('should return 404 for inactive bakery', async () => {
      const res = await request(app).get(`/v1/public/bakeries/${encodeURIComponent('inactive-bakery')}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBeDefined()
    })

    it('should return 404 for non-existent bakery', async () => {
      const res = await request(app).get(`/v1/public/bakeries/${encodeURIComponent('non-existent')}`)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /v1/public/bakeries/:slug/categories', () => {
    it('should return categories for bakery', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/categories`,
      )

      expect(res.status).toBe(200)
      expect(res.body.categories).toBeDefined()
      expect(Array.isArray(res.body.categories)).toBe(true)
      expect(res.body.categories.length).toBeGreaterThan(0)
      expect(res.body.categories[0].name).toBe('Test Category')
    })

    it('should return 404 for inactive bakery', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('inactive-bakery')}/categories`,
      )

      expect(res.status).toBe(404)
    })
  })

  describe('GET /v1/public/bakeries/:slug/products', () => {
    it('should return products with default pagination', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products`,
      )

      expect(res.status).toBe(200)
      expect(res.body.products).toBeDefined()
      expect(res.body.total).toBeDefined()
      expect(res.body.page).toBe(1)
      expect(res.body.pageSize).toBe(20)
    })

    it('should filter products by category', async () => {
      const res = await request(app)
        .get(`/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products`)
        .query({ category: 'test-category' })

      expect(res.status).toBe(200)
      expect(res.body.products).toBeDefined()
      // Should only return published products in this category
      res.body.products.forEach((product: any) => {
        expect(product.category_id).toBe(testCategoryId)
        expect(product.is_published).toBe(true)
      })
    })

    it('should only include published and available products', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products`,
      )

      expect(res.status).toBe(200)
      res.body.products.forEach((product: any) => {
        expect(product.is_published).toBe(true)
        expect(product.is_available).toBe(true)
      })
    })

    it('should respect pagination limits', async () => {
      const res = await request(app)
        .get(`/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products`)
        .query({ page_size: 100 })

      expect(res.status).toBe(200)
      // Should be clamped to max 50
      expect(res.body.pageSize).toBeLessThanOrEqual(50)
    })

    it('should return 404 for inactive bakery', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('inactive-bakery')}/products`,
      )

      expect(res.status).toBe(404)
    })
  })

  describe('GET /v1/public/bakeries/:slug/products/:productSlug', () => {
    it('should return published product with variants', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products/${encodeURIComponent('test-product')}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.product).toBeDefined()
      expect(res.body.product.id).toBe(testProductId)
      expect(res.body.product.name).toBe('Test Product')
      expect(res.body.product.variants).toBeDefined()
      expect(Array.isArray(res.body.product.variants)).toBe(true)
      expect(res.body.product.variants.length).toBeGreaterThan(0)
    })

    it('should return 404 for unpublished product', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products/${encodeURIComponent('unpublished-product')}`,
      )

      expect(res.status).toBe(404)
    })

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('test-bakery-slug')}/products/${encodeURIComponent('non-existent')}`,
      )

      expect(res.status).toBe(404)
    })

    it('should return 404 if product belongs to different bakery', async () => {
      // Try to access a product from a different bakery
      const res = await request(app).get(
        `/v1/public/bakeries/${encodeURIComponent('inactive-bakery')}/products/${encodeURIComponent('test-product')}`,
      )

      expect(res.status).toBe(404)
    })
  })
})
