import {
  createPaymentCredential,
  deletePaymentCredential,
  getPaymentCredentials,
  updatePaymentCredential,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { aesGcmEncrypt } from '../../lib/crypto'
import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

const createCredentialSchema = z.object({
  provider: z.enum(['mtn_momo', 'airtel_money', 'bank_transfer']),
  account_number: z.string().min(1, 'Account number is required'),
  account_holder: z.string().min(1, 'Account holder name is required'),
  api_key: z.string().optional().nullable(),
})

const updateCredentialSchema = z.object({
  account_number: z.string().min(1, 'Account number is required').optional(),
  account_holder: z.string().min(1, 'Account holder name is required').optional(),
  api_key: z.string().optional().nullable(),
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider
      const validProviders = ['mtn_momo', 'airtel_money', 'bank_transfer']
      if (!provider || !validProviders.includes(provider)) {
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = createCredentialSchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      // Encrypt credentials server-side using AES-256-GCM
      const configJson = JSON.stringify({
        account_number: validatedData.account_number,
        account_holder: validatedData.account_holder,
        api_key: validatedData.api_key ?? '',
      })

      const encryptionResult = await aesGcmEncrypt(configJson, bakeryId)

      const credential = await createPaymentCredential(req.db, bakeryId, {
        provider: validatedData.provider,
        is_enabled: false,
        target_environment: 'production',
        encrypted_config: Buffer.from(encryptionResult.ciphertext, 'base64'),
        config_nonce: Buffer.from(encryptionResult.nonce, 'base64'),
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
    } catch (err) {
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: err.issues,
        })
      }

      logger.error(
        {
          error: err instanceof Error ? err.message : String(err),
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { credentialId } = req.params
      const validatedData = updateCredentialSchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      // Build update object with encryption if needed
      interface UpdateInput {
        encrypted_config?: Buffer
        config_nonce?: Buffer
      }
      const updateInput: UpdateInput = {}

      if (validatedData.account_number !== undefined || validatedData.account_holder !== undefined || validatedData.api_key !== undefined) {
        // If any credential fields are provided, re-encrypt the entire config
        const configJson = JSON.stringify({
          account_number: validatedData.account_number ?? '',
          account_holder: validatedData.account_holder ?? '',
          api_key: validatedData.api_key ?? '',
        })

        const encryptionResult = await aesGcmEncrypt(configJson, bakeryId)
        updateInput.encrypted_config = Buffer.from(encryptionResult.ciphertext, 'base64')
        updateInput.config_nonce = Buffer.from(encryptionResult.nonce, 'base64')
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
    } catch (err) {
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: err.issues,
        })
      }

      logger.error(
        {
          error: err instanceof Error ? err.message : String(err),
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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { credentialId } = req.params

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
      const bakeryId = (req as unknown as { bakery?: { id: string } }).bakery?.id
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
