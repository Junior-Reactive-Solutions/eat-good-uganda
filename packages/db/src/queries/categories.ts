import type { ProductCategory } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const CATEGORY_COLS = sql`
  id, bakery_id, name, slug, sort_order, created_at, updated_at
`

export async function listProductCategories(
  db: Database,
  bakeryId: string,
): Promise<ProductCategory[]> {
  const result = await query<ProductCategory>(
    db,
    sql`SELECT ${CATEGORY_COLS} FROM product_categories
        WHERE bakery_id = ${bakeryId}
        ORDER BY sort_order ASC, name ASC`,
  )
  return result.rows
}

export async function getCategoryBySlug(
  db: Database,
  bakeryId: string,
  slug: string,
): Promise<ProductCategory | null> {
  const result = await query<ProductCategory>(
    db,
    sql`SELECT ${CATEGORY_COLS} FROM product_categories
        WHERE bakery_id = ${bakeryId} AND slug = ${slug}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export type CreateCategoryInput = {
  slug: string
  name: string
  sort_order?: number
}

/**
 * Create a new product category for a bakery
 */
export async function createProductCategory(
  db: Database,
  bakeryId: string,
  input: CreateCategoryInput,
): Promise<ProductCategory> {
  const result = await query<ProductCategory>(
    db,
    sql`INSERT INTO product_categories (bakery_id, slug, name, sort_order)
        VALUES (${bakeryId}, ${input.slug}, ${input.name}, ${input.sort_order ?? 0})
        RETURNING ${CATEGORY_COLS}`,
  )
  const category = result.rows[0]
  if (!category) throw new Error('failed to create category')
  return category
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

/**
 * Update an existing product category
 */
export async function updateProductCategory(
  db: Database,
  bakeryId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<ProductCategory | null> {
  const result = await query<ProductCategory>(
    db,
    sql`UPDATE product_categories SET
          name = COALESCE(${input.name ?? null}, name),
          sort_order = COALESCE(${input.sort_order ?? null}, sort_order),
          updated_at = now()
        WHERE id = ${categoryId} AND bakery_id = ${bakeryId}
        RETURNING ${CATEGORY_COLS}`,
  )
  return result.rows[0] ?? null
}
