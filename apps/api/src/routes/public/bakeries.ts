import { pool, listPublicBakeries } from '@eatgood/db'
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

export { router as publicBakeriesRouter }
