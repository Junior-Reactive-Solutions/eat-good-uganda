/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-deprecated */
import {
  createProduct,
  getProductById,
  listProductsForBakeryAdmin,
  softDeleteProduct,
  updateProduct,
  type CreateProductInput,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

/**
 * Zod schema for creating/updating products
 */
const createProductSchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  base_price_minor: z.number().int().nonnegative(),
  category_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_urls: z.array(z.string().url()),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  is_available: z.boolean().optional(),
  requires_advance_notice_hours: z.number().int().nonnegative().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const updateProductSchema = createProductSchema.partial()

export const bakeryProductsRouter = createRouter() as Router

/**
 * GET /
 * List bakery's products (admin view, includes unpublished)
 * Query params: page, pageSize (defaults: 1, 20)
 */
bakeryProductsRouter.get(
  '/',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20))

      const result = await listProductsForBakeryAdmin(req.db, bakeryId, page, pageSize)

      res.json({
        items: result.products,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      })
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error('Failed to list products', {
        error: error instanceof Error ? error.message : String(error),
        bakeryId,
      })
      res.status(500).json({ error: 'Failed to list products' })
    }
  },
)

/**
 * GET /:productId
 * Get a single product with its variants
 */
bakeryProductsRouter.get(
  '/:productId',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { productId } = req.params

      const product = await getProductById(req.db, bakeryId, productId)
      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      res.json(product)
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error('Failed to get product', {
        error: error instanceof Error ? error.message : String(error),
        bakeryId,
        productId: req.params.productId,
      })
      res.status(500).json({ error: 'Failed to get product' })
    }
  },
)

/**
 * POST /
 * Create a new product
 */
bakeryProductsRouter.post(
  '/',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = createProductSchema.parse(req.body)

      const product = await createProduct(req.db, bakeryId, validatedData as CreateProductInput)

      logger.info('Product created', {
        bakeryId,
        productId: product.id,
        name: product.name,
      })

      res.status(201).json(product)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error('Failed to create product', {
        error: error instanceof Error ? error.message : String(error),
        bakeryId,
      })
      res.status(500).json({ error: 'Failed to create product' })
    }
  },
)

/**
 * PATCH /:productId
 * Update an existing product
 */
bakeryProductsRouter.patch(
  '/:productId',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { productId } = req.params
      const validatedData = updateProductSchema.parse(req.body)

      const product = await updateProduct(req.db, bakeryId, productId, validatedData)
      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      logger.info('Product updated', {
        bakeryId,
        productId,
      })

      res.json(product)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error('Failed to update product', {
        error: error instanceof Error ? error.message : String(error),
        bakeryId,
        productId: req.params.productId,
      })
      res.status(500).json({ error: 'Failed to update product' })
    }
  },
)

/**
 * DELETE /:productId
 * Soft delete a product
 */
bakeryProductsRouter.delete(
  '/:productId',
  authenticateToken,
  requireBakeryContext,
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { productId } = req.params

      const product = await softDeleteProduct(req.db, bakeryId, productId)
      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      logger.info('Product deleted', {
        bakeryId,
        productId,
      })

      res.status(204).send()
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error('Failed to delete product', {
        error: error instanceof Error ? error.message : String(error),
        bakeryId,
        productId: req.params.productId,
      })
      res.status(500).json({ error: 'Failed to delete product' })
    }
  },
)
