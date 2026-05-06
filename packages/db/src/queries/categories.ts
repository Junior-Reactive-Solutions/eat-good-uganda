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
