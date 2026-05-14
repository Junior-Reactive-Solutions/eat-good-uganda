/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-deprecated */
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'
import {
  getCustomerAddresses,
  getCustomerAddress,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type CreateCustomerAddressInput,
  type UpdateCustomerAddressInput,
} from '@eatgood/db'
import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'

const createAddressSchema = z.object({
  street_address: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  postal_code: z.string().max(20).optional(),
  is_delivery_address: z.boolean().optional(),
  is_billing_address: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

const updateAddressSchema = createAddressSchema.partial()

export const customerAddressesRouter = createRouter() as Router

/**
 * GET /
 * List customer addresses
 */
customerAddressesRouter.get(
  '/',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const addresses = await getCustomerAddresses((req as any).db, userId)

      res.json({
        items: addresses,
        total: addresses.length,
      })
    } catch (error) {
      const userId = (req as any).customer?.id as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).error('Failed to list customer addresses', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to list customer addresses' })
    }
  },
)

/**
 * GET /:addressId
 * Get single customer address
 */
customerAddressesRouter.get(
  '/:addressId',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { addressId } = req.params
      const address = await getCustomerAddress((req as any).db, userId, addressId as string)

      if (!address) {
        return res.status(404).json({ error: 'Address not found' })
      }

      res.json(address)
    } catch (error) {
      const userId = (req as any).customer?.id as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).error('Failed to get customer address', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to get customer address' })
    }
  },
)

/**
 * POST /
 * Create customer address
 */
customerAddressesRouter.post(
  '/',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = createAddressSchema.parse(req.body)

      const address = await createCustomerAddress(
        (req as any).db,
        userId,
        validatedData as CreateCustomerAddressInput,
      )

      if (!address) {
        return res.status(500).json({ error: 'Failed to create address' })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).info('Customer address created', { userId, addressId: address.id })

      res.status(201).json(address)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: (error as any).errors })
      }

      const userId = (req as any).customer?.id as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).error('Failed to create customer address', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to create customer address' })
    }
  },
)

/**
 * PATCH /:addressId
 * Update customer address
 */
customerAddressesRouter.patch(
  '/:addressId',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { addressId } = req.params
      const validatedData = updateAddressSchema.parse(req.body)

      const address = await updateCustomerAddress(
        (req as any).db,
        userId,
        addressId as string,
        validatedData as UpdateCustomerAddressInput,
      )

      if (!address) {
        return res.status(404).json({ error: 'Address not found' })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).info('Customer address updated', { userId, addressId })

      res.json(address)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: (error as any).errors })
      }

      const userId = (req as any).customer?.id as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).error('Failed to update customer address', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to update customer address' })
    }
  },
)

/**
 * DELETE /:addressId
 * Delete customer address
 */
customerAddressesRouter.delete(
  '/:addressId',
  authenticateToken('customer'),
  requireCustomerContext,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).customer?.id as string | undefined
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { addressId } = req.params

      const deleted = await deleteCustomerAddress((req as any).db, userId, addressId as string)

      if (!deleted) {
        return res.status(404).json({ error: 'Address not found' })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).info('Customer address deleted', { userId, addressId })

      res.status(204).send()
    } catch (error) {
      const userId = (req as any).customer?.id as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(logger as any).error('Failed to delete customer address', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
      res.status(500).json({ error: 'Failed to delete customer address' })
    }
  },
)
