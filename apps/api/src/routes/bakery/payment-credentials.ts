/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  createPaymentCredential,
  deletePaymentCredential,
  getPaymentCredentials,
  updatePaymentCredential,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

const createCredentialSchema = z.object({
  provider: z.enum(['mtn_momo', 'airtel_money', 'bank_transfer']),
  is_enabled: z.boolean().optional().default(false),
  target_environment: z.enum(['sandbox', 'production']).optional().default('sandbox'),
  encrypted_config: z.string().refine((val) => {
    try {
      Buffer.from(val, 'base64')
      return true
    } catch {
      return false
    }
  }, 'Must be valid base64-encoded encrypted config'),
  config_nonce: z.string().refine((val) => {
    try {
      Buffer.from(val, 'base64')
      return true
    } catch {
      return false
    }
  }, 'Must be valid base64-encoded nonce'),
})

const updateCredentialSchema = z.object({
  is_enabled: z.boolean().optional(),
  target_environment: z.enum(['sandbox', 'production']).optional(),
  encrypted_config: z
    .string()
    .refine((val) => {
      try {
        Buffer.from(val, 'base64')
        return true
      } catch {
        return false
      }
    }, 'Must be valid base64-encoded encrypted config')
    .optional(),
  config_nonce: z
    .string()
    .refine((val) => {
      try {
        Buffer.from(val, 'base64')
        return true
      } catch {
        return false
      }
    }, 'Must be valid base64-encoded nonce')
    .optional(),
})

export const bakeryPaymentCredentialsRouter = createRouter() as Router

/**
 * GET /
 * List payment credentials metadata (not the actual credentials)
 */
bakeryPaymentCredentialsRouter.get(
  '/',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const credentials = await getPaymentCredentials(req.db, bakeryId)

      res.json({
        items: credentials,
        total: credentials.length,
      })
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to list payment credentials',
      )
      res.status(500).json({ error: 'Failed to list payment credentials' })
    }
  },
)

/**
 * GET /:provider
 * Get payment credential for specific provider
 */
bakeryPaymentCredentialsRouter.get(
  '/:provider',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { provider } = req.params as any
      if (!['mtn_momo', 'airtel_money', 'bank_transfer'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' })
      }

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const credentials = await getPaymentCredentials(
        req.db,
        bakeryId,
        provider as 'mtn_momo' | 'airtel_money' | 'bank_transfer',
      )

      if (credentials.length === 0) {
        return res.status(404).json({ error: 'Credentials not found' })
      }

      res.json(credentials[0])
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to get payment credentials',
      )
      res.status(500).json({ error: 'Failed to get payment credentials' })
    }
  },
)

/**
 * POST /
 * Create payment credentials
 */
bakeryPaymentCredentialsRouter.post(
  '/',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = createCredentialSchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const credential = await createPaymentCredential(req.db, bakeryId, {
        provider: validatedData.provider,
        is_enabled: validatedData.is_enabled,
        target_environment: validatedData.target_environment,
        encrypted_config: Buffer.from(validatedData.encrypted_config, 'base64'),
        config_nonce: Buffer.from(validatedData.config_nonce, 'base64'),
      })

      if (!credential) {
        return res.status(500).json({ error: 'Failed to create credentials' })
      }

      logger.info(
        {
          bakeryId,
          provider: validatedData.provider,
        },
        'Payment credentials created',
      )

      res.status(201).json(credential)
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
        'Failed to create payment credentials',
      )
      res.status(500).json({ error: 'Failed to create payment credentials' })
    }
  },
)

/**
 * PATCH /:credentialId
 * Update payment credentials
 */
bakeryPaymentCredentialsRouter.patch(
  '/:credentialId',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { credentialId } = req.params as any
      const validatedData = updateCredentialSchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const updateInput: any = {}
      if (validatedData.is_enabled !== undefined) updateInput.is_enabled = validatedData.is_enabled
      if (validatedData.target_environment !== undefined) {
        updateInput.target_environment = validatedData.target_environment
      }
      if (validatedData.encrypted_config !== undefined) {
        updateInput.encrypted_config = Buffer.from(validatedData.encrypted_config, 'base64')
      }
      if (validatedData.config_nonce !== undefined) {
        updateInput.config_nonce = Buffer.from(validatedData.config_nonce, 'base64')
      }

      const credential = await updatePaymentCredential(req.db, bakeryId, credentialId, updateInput)

      if (!credential) {
        return res.status(404).json({ error: 'Credentials not found' })
      }

      logger.info(
        {
          bakeryId,
          credentialId,
        },
        'Payment credentials updated',
      )

      res.json(credential)
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
        'Failed to update payment credentials',
      )
      res.status(500).json({ error: 'Failed to update payment credentials' })
    }
  },
)

/**
 * DELETE /:credentialId
 * Delete payment credentials
 */
bakeryPaymentCredentialsRouter.delete(
  '/:credentialId',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { credentialId } = req.params as any

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const deleted = await deletePaymentCredential(req.db, bakeryId, credentialId)

      if (!deleted) {
        return res.status(404).json({ error: 'Credentials not found' })
      }

      logger.info(
        {
          bakeryId,
          credentialId,
        },
        'Payment credentials deleted',
      )

      res.status(204).send()
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to delete payment credentials',
      )
      res.status(500).json({ error: 'Failed to delete payment credentials' })
    }
  },
)
