/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  createProductCategory,
  listProductCategories,
  updateProductCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'

/**
 * Zod schema for creating/updating categories
 */
const createCategorySchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  sort_order: z.number().int().optional(),
})

const updateCategorySchema = createCategorySchema.partial()

export const bakeryCategoriesRouter = createRouter() as Router

/**
 * GET /
 * List bakery's product categories
 */
bakeryCategoriesRouter.get(
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

      const categories = await listProductCategories(req.db, bakeryId)

      res.json({
        items: categories,
        total: categories.length,
      })
    } catch (error) {
      const bakeryId = (req as any).bakery?.id as string | undefined
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakeryId,
        },
        'Failed to list categories',
      )
      res.status(500).json({ error: 'Failed to list categories' })
    }
  },
)

/**
 * POST /
 * Create a new product category
 */
bakeryCategoriesRouter.post(
  '/',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const validatedData = createCategorySchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const category = await createProductCategory(
        req.db,
        bakeryId,
        validatedData as CreateCategoryInput,
      )

      logger.info(
        {
          bakeryId,
          categoryId: category.id,
          name: category.name,
        },
        'Category created',
      )

      res.status(201).json(category)
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
        'Failed to create category',
      )
      res.status(500).json({ error: 'Failed to create category' })
    }
  },
)

/**
 * PATCH /:categoryId
 * Update an existing product category
 */
bakeryCategoriesRouter.patch(
  '/:categoryId',
  authenticateToken('bakery'),
  requireBakeryContext(),
  async (req: Request, res: Response) => {
    try {
      const bakeryId = (req as any).bakery?.id as string | undefined
      if (!bakeryId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { categoryId } = req.params as any
      const validatedData = updateCategorySchema.parse(req.body)

      if (!req.db) {
        return res.status(500).json({ error: 'Database connection unavailable' })
      }

      const category = await updateProductCategory(
        req.db,
        bakeryId,
        categoryId,
        validatedData as UpdateCategoryInput,
      )
      if (!category) {
        return res.status(404).json({ error: 'Category not found' })
      }

      logger.info(
        {
          bakeryId,
          categoryId,
        },
        'Category updated',
      )

      res.json(category)
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
          categoryId: req.params.categoryId,
        },
        'Failed to update category',
      )
      res.status(500).json({ error: 'Failed to update category' })
    }
  },
)
