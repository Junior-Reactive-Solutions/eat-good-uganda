import {
  pool,
  getOpeningHours,
  upsertOpeningHours,
  computeOpenStatus,
  getBakeryById,
} from '@eatgood/db'
import { Router } from 'express'
import { z } from 'zod'

import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

const router = Router()

router.use(authenticateToken('bakery'), requireBakeryContext())

const hoursRowSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  opens_at: z.string().regex(/^\d{2}:\d{2}$/, 'opens_at must be HH:MM'),
  closes_at: z.string().regex(/^\d{2}:\d{2}$/, 'closes_at must be HH:MM'),
  is_closed: z.boolean().default(false),
})

const upsertSchema = z.object({
  hours: z.array(hoursRowSchema).min(1).max(7),
})

/** GET /v1/bakery/opening-hours — return this bakery's schedule + current open status */
router.get('/', async (req, res) => {
  const bakeryId = req.bakery?.id
  if (!bakeryId) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  try {
    const [bakery, hours] = await Promise.all([
      getBakeryById(pool, bakeryId),
      getOpeningHours(pool, bakeryId),
    ])
    if (!bakery) {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }
    const open_status = computeOpenStatus(hours, bakery.timezone)
    res.json({ opening_hours: hours, open_status })
  } catch {
    res.status(500).json({ error: 'Failed to fetch opening hours' })
  }
})

/** PUT /v1/bakery/opening-hours — upsert 1-7 day rows */
router.put('/', async (req, res) => {
  const bakeryId = req.bakery?.id
  if (!bakeryId) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues })
    return
  }
  try {
    const bakery = await getBakeryById(pool, bakeryId)
    if (!bakery) {
      res.status(404).json({ error: 'Bakery not found' })
      return
    }
    await upsertOpeningHours(pool, bakeryId, parsed.data.hours)
    const allHours = await getOpeningHours(pool, bakeryId)
    const open_status = computeOpenStatus(allHours, bakery.timezone)
    res.json({ opening_hours: allHours, open_status })
  } catch {
    res.status(500).json({ error: 'Failed to save opening hours' })
  }
})

export { router as openingHoursRouter }
