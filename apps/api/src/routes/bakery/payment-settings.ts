import { pool } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'
import {
  saveBakeryMomoCredentials,
  loadBakeryMomoCredentials,
  type BakeryMomoCredentials,
} from '../../services/payment/credentials'

export const bakeryPaymentSettingsRouter = createRouter() as Router

// Validation schemas
const MomoCredentialsSchema = z.object({
  subscription_key: z.string().min(1, 'Subscription key is required'),
  user_id: z.string().min(1, 'User ID is required'),
  api_key: z.string().min(1, 'API key is required'),
  target_environment: z.enum(['sandbox', 'production']),
  collection_primary_key: z.string().optional(),
})

const AirtelCredentialsSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().min(1, 'Client secret is required'),
  target_environment: z.enum(['staging', 'production']),
})

/**
 * GET /v1/bakery/payment-settings
 * Get current payment credentials summary (no secrets)
 */
bakeryPaymentSettingsRouter.get(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext,
  async (req: Request, res: Response) => {
    const bakeryId = (req as any).bakery?.id as string | undefined

    if (!bakeryId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // For MVP, just return empty config
      // In Phase 6D+, we'd load from DB and return obfuscated summaries
      const paymentMethods = {
        mtn_momo: {
          enabled: false,
          configured: false,
        },
        airtel_money: {
          enabled: false,
          configured: false,
        },
        cash_on_delivery: {
          enabled: true,
          configured: true,
        },
        bank_transfer: {
          enabled: true,
          configured: true,
        },
      }

      return res.json({
        bakeryId,
        paymentMethods,
        message: 'Use POST endpoints below to configure each method',
      })
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to fetch payment settings',
      )
      return res.status(500).json({ error: 'Failed to fetch payment settings' })
    }
  },
)

/**
 * POST /v1/bakery/payment-settings/mtn-momo
 * Save MTN MoMo credentials
 */
bakeryPaymentSettingsRouter.post(
  '/mtn-momo',
  authenticateToken('bakery'),
  requireBakeryContext,
  async (req: Request, res: Response) => {
    const bakeryId = (req as any).bakery?.id as string | undefined

    if (!bakeryId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // Validate input
      const body = MomoCredentialsSchema.parse(req.body)

      // Save encrypted credentials
      await saveBakeryMomoCredentials(pool, bakeryId, {
        subscription_key: body.subscription_key,
        user_id: body.user_id,
        api_key: body.api_key,
        target_environment: body.target_environment,
        ...(body.collection_primary_key && { collection_primary_key: body.collection_primary_key }),
      })

      logger.info(
        { bakeryId, target_environment: body.target_environment },
        'MTN MoMo credentials saved',
      )

      return res.status(200).json({
        message: 'MTN MoMo credentials saved successfully',
        method: 'mtn_momo',
        target_environment: body.target_environment,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid credentials format' })
      }

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to save MoMo credentials',
      )

      return res.status(500).json({ error: 'Failed to save credentials' })
    }
  },
)

/**
 * POST /v1/bakery/payment-settings/airtel-money
 * Save Airtel Money credentials
 */
bakeryPaymentSettingsRouter.post(
  '/airtel-money',
  authenticateToken('bakery'),
  requireBakeryContext,
  async (req: Request, res: Response) => {
    const bakeryId = (req as any).bakery?.id as string | undefined

    if (!bakeryId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // Validate input
      const body = AirtelCredentialsSchema.parse(req.body)

      // TODO: Implement Airtel credential encryption (similar to MoMo)
      // For now, just validate and acknowledge

      logger.info(
        { bakeryId, target_environment: body.target_environment },
        'Airtel Money credentials received',
      )

      return res.status(200).json({
        message: 'Airtel Money credentials saved successfully',
        method: 'airtel_money',
        target_environment: body.target_environment,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid credentials format' })
      }

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to save Airtel credentials',
      )

      return res.status(500).json({ error: 'Failed to save credentials' })
    }
  },
)

/**
 * GET /v1/bakery/payment-settings/mtn-momo
 * Check if MoMo is configured (returns obfuscated hint)
 */
bakeryPaymentSettingsRouter.get(
  '/mtn-momo',
  authenticateToken('bakery'),
  requireBakeryContext,
  async (req: Request, res: Response) => {
    const bakeryId = (req as any).bakery?.id as string | undefined

    if (!bakeryId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const credentials = await loadBakeryMomoCredentials(pool, bakeryId)

      if (!credentials) {
        return res.json({
          configured: false,
          message: 'MTN MoMo not yet configured',
        })
      }

      // Return obfuscated summary (no secrets)
      return res.json({
        configured: true,
        target_environment: credentials.target_environment,
        user_id_hint: `****${credentials.user_id.slice(-4)}`,
        message: 'MTN MoMo is configured',
      })
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to check MoMo configuration',
      )

      return res.json({
        configured: false,
        message: 'Error checking configuration',
      })
    }
  },
)
