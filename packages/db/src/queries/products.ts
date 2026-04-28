import type { Product } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const PRODUCT_COLS = sql`
  id, bakery_id, category_id, slug, name, description,
  base_price_minor, currency_code, image_urls,
  is_published, is_available, requires_advance_notice_hours,
  sort_order, tags, created_at, updated_at, deleted_at
`

export async function listProductsForBakery(
  db: Database,
  bakeryId: string,
): Promise<Product[]> {
  const result = await query<Product>(
    db,
    sql`SELECT ${PRODUCT_COLS} FROM products
        WHERE bakery_id = ${bakeryId} AND deleted_at IS NULL
        ORDER BY sort_order ASC, name ASC`,
  )
  return result.rows
}

export async function getProductById(
  db: Database,
  bakeryId: string,
  productId: string,
): Promise<Product | null> {
  const result = await query<Product>(
    db,
    sql`SELECT ${PRODUCT_COLS} FROM products
        WHERE id = ${productId} AND bakery_id = ${bakeryId} AND deleted_at IS NULL
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getPublishedProductBySlug(
  db: Database,
  bakeryId: string,
  slug: string,
): Promise<Product | null> {
  const result = await query<Product>(
    db,
    sql`SELECT ${PRODUCT_COLS} FROM products
        WHERE slug = ${slug}
          AND bakery_id = ${bakeryId}
          AND is_published = true
          AND deleted_at IS NULL
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export type CreateProductInput = {
  slug: string
  name: string
  base_price_minor: number
  category_id?: string | null
  description?: string | null
  image_urls?: string[]
  tags?: string[]
  is_published?: boolean
  is_available?: boolean
  requires_advance_notice_hours?: number | null
  sort_order?: number
}

export async function createProduct(
  db: Database,
  bakeryId: string,
  input: CreateProductInput,
): Promise<Product> {
  const result = await query<Product>(
    db,
    sql`INSERT INTO products (
          bakery_id, slug, name, base_price_minor, category_id,
          description, image_urls, tags,
          is_published, is_available,
          requires_advance_notice_hours, sort_order
        ) VALUES (
          ${bakeryId}, ${input.slug}, ${input.name}, ${input.base_price_minor},
          ${input.category_id ?? null}, ${input.description ?? null},
          ${input.image_urls ?? []}, ${input.tags ?? []},
          ${input.is_published ?? false}, ${input.is_available ?? true},
          ${input.requires_advance_notice_hours ?? null},
          ${input.sort_order ?? 0}
        )
        RETURNING ${PRODUCT_COLS}`,
  )
  return result.rows[0]!
}

export type UpdateProductInput = Partial<CreateProductInput>

export async function updateProduct(
  db: Database,
  bakeryId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<Product | null> {
  const result = await query<Product>(
    db,
    sql`UPDATE products SET
          name           = COALESCE(${input.name ?? null}, name),
          description    = COALESCE(${input.description ?? null}, description),
          base_price_minor = COALESCE(${input.base_price_minor ?? null}, base_price_minor),
          category_id    = COALESCE(${input.category_id ?? null}, category_id),
          image_urls     = COALESCE(${input.image_urls ?? null}, image_urls),
          tags           = COALESCE(${input.tags ?? null}, tags),
          is_published   = COALESCE(${input.is_published ?? null}, is_published),
          is_available   = COALESCE(${input.is_available ?? null}, is_available),
          requires_advance_notice_hours = COALESCE(
            ${input.requires_advance_notice_hours ?? null},
            requires_advance_notice_hours
          ),
          sort_order     = COALESCE(${input.sort_order ?? null}, sort_order),
          updated_at     = now()
        WHERE id = ${productId} AND bakery_id = ${bakeryId} AND deleted_at IS NULL
        RETURNING ${PRODUCT_COLS}`,
  )
  return result.rows[0] ?? null
}
