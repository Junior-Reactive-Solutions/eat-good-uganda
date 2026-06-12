/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-deprecated */
import { getBakeryProfile, updateBakeryProfile, type UpdateBakeryProfileInput } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

const updateProfileSchema = z.object({
  legal_name: z.string().min(1).max(255).optional(),
  display_name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address_line1: z.string().max(500).optional(),
  address_line2: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  website: z.string().url().optional().nullable(),
  accepts_pickup: z.boolean().optional(),
  accepts_delivery: z.boolean().optional(),
  delivery_fee_minor: z.number().int().nonnegative().optional().nullable(),
  delivery_radius_km: z.number().positive().optional().nullable(),
  min_order_minor: z.number().int().nonnegative().optional().nullable(),
})

export const bakerySettingsRouter = createRouter() as Router

/**
 * GET /
 * Get bakery profile
 */
bakerySettingsRouter.get(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const profile = await getBakeryProfile(req.db, bakeryId)
      if (!profile) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      res.json(profile)
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to get bakery profile',
      )
      res.status(500).json({ error: 'Failed to get bakery profile' })
    }
  },
)

/**
 * PATCH /
 * Update bakery profile
 */
bakerySettingsRouter.patch(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = updateProfileSchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const profile = await updateBakeryProfile(
        req.db,
        bakeryId,
        validatedData as UpdateBakeryProfileInput,
      )

      if (!profile) {
        return res.status(404).json({ error: 'Bakery not found' })
      }

      logger.info({ bakeryId }, 'Bakery profile updated')

      res.json(profile)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: (error as any).errors.map((e: any) => e.message),
        })
      }

      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to update bakery profile',
      )
      res.status(500).json({ error: 'Failed to update bakery profile' })
    }
  },
)
