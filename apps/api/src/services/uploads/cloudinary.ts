import { v2 as cloudinary } from 'cloudinary'

import { env } from '../../env'
import { logger } from '../../lib/logger'

// Configure Cloudinary
const cloudinaryConfig = {
  ...(env.CLOUDINARY_CLOUD_NAME && { cloud_name: env.CLOUDINARY_CLOUD_NAME }),
  ...(env.CLOUDINARY_API_KEY && { api_key: env.CLOUDINARY_API_KEY }),
  ...(env.CLOUDINARY_API_SECRET && { api_secret: env.CLOUDINARY_API_SECRET }),
}

if (Object.keys(cloudinaryConfig).length > 0) {
  cloudinary.config(cloudinaryConfig)
}

export interface UploadProductImageInput {
  buffer: Buffer
  filename: string
  mimeType: string
  bakeryId: string
}

export interface UploadProductImageResult {
  url: string
  publicId: string
  width: number
  height: number
  bytes: number
}

/**
 * Validate image file before upload.
 * Checks: MIME type, file size.
 */
export function validateImageFile(
  buffer: Buffer,
  mimeType: string,
): { valid: true } | { valid: false; error: string } {
  // Allowed MIME types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: 'File must be JPEG, PNG, WebP, or GIF',
    }
  }

  // Max file size: 5MB
  const maxSizeBytes = 5 * 1024 * 1024
  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: 'File must be smaller than 5MB',
    }
  }

  return { valid: true }
}

/**
 * Upload a product image to Cloudinary.
 *
 * Images are stored in a folder per bakery for organization.
 * Cloudinary handles transformation (resize, compress, format optimization).
 */
export async function uploadProductImage(
  input: UploadProductImageInput,
): Promise<UploadProductImageResult> {
  // Validate first
  const validation = validateImageFile(input.buffer, input.mimeType)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  try {
    // Upload to Cloudinary with transformations
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `eatgood/bakeries/${input.bakeryId}/products`,
          public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          flags: 'lossy',
          // Transformation: resize to max 1000px wide, maintain aspect ratio
          eager: [
            {
              width: 800,
              height: 600,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
            },
            {
              width: 400,
              height: 300,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
          eager_async: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )

      // Write buffer to stream
      uploadStream.end(input.buffer)
    })

    logger.info(
      {
        public_id: result.public_id,
        url: result.secure_url,
        bakery_id: input.bakeryId,
        size: result.bytes,
        width: result.width,
        height: result.height,
      },
      'Product image uploaded to Cloudinary',
    )

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        bakery_id: input.bakeryId,
        filename: input.filename,
      },
      'Failed to upload product image to Cloudinary',
    )
    throw new Error('Failed to upload image. Please try again.')
  }
}

/**
 * Delete a product image from Cloudinary by public_id.
 */
export async function deleteProductImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info({ public_id: publicId }, 'Product image deleted from Cloudinary')
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        public_id: publicId,
      },
      'Failed to delete product image from Cloudinary',
    )
    // Don't re-throw; deletion failure shouldn't block other operations
  }
}

/**
 * Get optimized image URL with transformations.
 * Useful for building thumbnail URLs, responsive variants, etc.
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale'
    quality?: 'auto' | 'low' | 'default' | 'high'
  },
): string {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    crop: options?.crop || 'fill',
    quality: options?.quality || 'auto',
    fetch_format: 'auto',
    secure: true,
  })
}
