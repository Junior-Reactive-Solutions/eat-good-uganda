import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import multer from 'multer'

import { logger } from '../../lib/logger'
import { authenticateToken } from '../../middleware/authenticateToken'
import { requireBakeryContext } from '../../middleware/requireBakeryContext'
import {
  uploadProductImage,
  validateImageFile,
  getOptimizedImageUrl,
} from '../../services/uploads/cloudinary'

export const bakeryUploadsRouter = createRouter() as Router

// Configure multer for in-memory file upload (avoid disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
})

/**
 * POST /v1/bakery/uploads/product-image
 * Upload a product image to Cloudinary
 *
 * Request: multipart/form-data with 'file' field
 * Response: { url, publicId, width, height }
 */
bakeryUploadsRouter.post(
  '/product-image',
  authenticateToken('bakery'),
  requireBakeryContext(),
  upload.single('file'),
  async (req: Request, res: Response) => {
    const bakeryId = (req as any).bakery?.id as string | undefined

    if (!bakeryId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    try {
      // Validate file
      const validation = validateImageFile(req.file.buffer, req.file.mimetype)
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
      }

      // Upload to Cloudinary
      const result = await uploadProductImage({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        bakeryId,
      })

      // Return upload result with optional thumbnail URL
      return res.status(200).json({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        thumbnailUrl: getOptimizedImageUrl(result.publicId, {
          width: 200,
          height: 200,
          crop: 'fill',
        }),
      })
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          bakery_id: bakeryId,
          filename: req.file?.originalname,
        },
        'Failed to upload product image',
      )

      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload image',
      })
    }
  },
)

/**
 * GET /v1/bakery/uploads/image-url
 * Get an optimized Cloudinary URL for an image
 *
 * Query params:
 *   publicId: The Cloudinary public_id
 *   width: Optional width for transformation
 *   height: Optional height for transformation
 *   crop: Optional crop mode (fill, fit, scale)
 */
bakeryUploadsRouter.get(
  '/image-url',
  authenticateToken('bakery'),
  requireBakeryContext(),
  (req: Request, res: Response) => {
    const publicId = req.query.publicId as string | undefined

    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' })
    }

    try {
      const width = req.query.width ? parseInt(req.query.width as string) : undefined
      const height = req.query.height ? parseInt(req.query.height as string) : undefined
      const crop = (req.query.crop as 'fill' | 'fit' | 'scale') || 'fill'

      const options = {
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        crop,
      } as Parameters<typeof getOptimizedImageUrl>[1]

      const url = getOptimizedImageUrl(publicId, options)

      return res.json({ url })
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to generate image URL',
      )

      return res.status(500).json({ error: 'Failed to generate image URL' })
    }
  },
)
