/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-deprecated */
import {
  getCustomerProfile,
  updateCustomerProfile,
  type UpdateCustomerProfileInput,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'

const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  date_of_birth: z.string().date().optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

export const customerProfileRouter = createRouter() as Router

/**
 * GET /
 * Get customer profile
 */
customerProfileRouter.get(
  '/',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const profile = await getCustomerProfile((req as any).db, userId)
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

      res.json(profile)
    } catch (error) {
      const userId = (req as any).customer?.id as string | undefined
       
      ;(logger as any).error('Failed to get customer profile', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to get customer profile' })
    }
  },
)

/**
 * PATCH /
 * Update customer profile
 */
customerProfileRouter.patch(
  '/',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = updateProfileSchema.parse(req.body)

      const profile = await updateCustomerProfile(
        (req as any).db,
        userId,
        validatedData as UpdateCustomerProfileInput,
      )

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

       
      ;(logger as any).info('Customer profile updated', { userId })

      res.json(profile)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: (error as any).errors })
      }

      const userId = (req as any).customer?.id as string | undefined
       
      ;(logger as any).error('Failed to update customer profile', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to update customer profile' })
    }
  },
)
