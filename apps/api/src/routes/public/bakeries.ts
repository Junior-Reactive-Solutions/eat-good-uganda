import {
  pool,
  listPublicBakeries,
  getBakeryBySlug,
  listProductCategories,
  listProductsByCategory,
  getProductBySlugWithVariants,
} from '@eatgood/db'
import { Router } from 'express'
import { z } from 'zod'

import { TtlCache } from '../../lib/cache'

const router = Router()

const querySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
})

type CacheBody = { bakeries: Awaited<ReturnType<typeof listPublicBakeries>> }

const cache = new TtlCache<string, CacheBody>({ maxSize: 200, ttlMs: 30_000 })

function buildCacheKey(
  lat: number | undefined,
  lng: number | undefined,
  search: string | undefined,
  page: number,
): string {
  const rlat = lat !== undefined ? (Math.round(lat * 1000) / 1000).toFixed(3) : '_'
  const rlng = lng !== undefined ? (Math.round(lng * 1000) / 1000).toFixed(3) : '_'
  return `${rlat}:${rlng}:${search ?? ''}:${String(page)}`
}

router.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', issues: parsed.error.issues })
    return
  }
  const { lat, lng, search, page, page_size } = parsed.data
  const key = buildCacheKey(lat, lng, search, page)
  const cached = cache.get(key)
  if (cached) {
    res.json(cached)
    return
  }
  try {
    const bakeries = await listPublicBakeries(pool, { lat, lng, search, page, page_size })
    const body: CacheBody = { bakeries }
    cache.set(key, body)
    res.json(body)
  } catch {
    res.status(500).json({ error: 'Failed to fetch bakeries' })
  }
})

router.get('/:slug', async (req, res) => {
  const { slug } = req.params
  try {
    const bakery = await getBakeryBySlug(pool, slug)
    if (!bakery || bakery.status !== 'active') {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }
    res.json({ bakery })
  } catch {
    res.status(500).json({ error: 'Failed to fetch bakery' })
  }
})

const categoriesQuerySchema = z.object({})

router.get('/:slug/categories', async (req, res) => {
  const { slug } = req.params
  const parsed = categoriesQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', issues: parsed.error.issues })
    return
  }

  try {
    const bakery = await getBakeryBySlug(pool, slug)
    if (!bakery || bakery.status !== 'active') {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }

    const categories = await listProductCategories(pool, bakery.id)
    res.json({ categories })
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

const productsQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
})

type ProductsCacheBody = {
  products: Awaited<ReturnType<typeof listProductsByCategory>>['products']
  total: number
  page: number
  pageSize: number
}

const productsCache = new TtlCache<string, ProductsCacheBody>({ maxSize: 500, ttlMs: 120_000 })

function buildProductsCacheKey(
  bakeryId: string,
  categoryId: string | undefined,
  page: number,
  pageSize: number,
): string {
  return `${bakeryId}:${categoryId ?? ''}:${String(page)}:${String(pageSize)}`
}

router.get('/:slug/products', async (req, res) => {
  const { slug } = req.params
  const parsed = productsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', issues: parsed.error.issues })
    return
  }
  const { category, page, page_size } = parsed.data

  try {
    const bakery = await getBakeryBySlug(pool, slug)
    if (!bakery || bakery.status !== 'active') {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }

    const cacheKey = buildProductsCacheKey(bakery.id, category, page, page_size)
    const cached = productsCache.get(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }

    const result = await listProductsByCategory(pool, bakery.id, category, page, page_size)
    const body = {
      products: result.products,
      total: result.total,
      page,
      pageSize: page_size,
    }
    productsCache.set(cacheKey, body)
    res.json(body)
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

router.get('/:slug/products/:productSlug', async (req, res) => {
  const { slug, productSlug } = req.params

  try {
    const bakery = await getBakeryBySlug(pool, slug)
    if (!bakery || bakery.status !== 'active') {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }

    const product = await getProductBySlugWithVariants(pool, bakery.id, productSlug)
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    res.json({ product })
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

export { router as publicBakeriesRouter }
