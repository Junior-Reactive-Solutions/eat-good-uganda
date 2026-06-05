/**
 * seed-bakeries.ts — Phase 3 of the seed plan.
 *
 * Inserts 3 demo bakeries (Kampala Crust, The Golden Whisk, Maison Léa) along
 * with each bakery's owner account, product categories, products, and variants.
 *
 * Idempotent — safe to re-run. Uses ON CONFLICT DO NOTHING for all inserts,
 * then falls back to SELECT to retrieve the existing row's ID.
 *
 * Usage:
 *   cd apps/api
 *   DATABASE_URL="postgres://..." npx tsx src/scripts/seed-bakeries.ts
 */
import { Pool, PoolClient } from 'pg'
import * as argon2 from 'argon2'

import type { BakeryDef, CategoryDef, ProductDef } from './seed-data/bakeries.ts'
import { BAKERIES } from './seed-data/bakeries.ts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrInsert(
  client: PoolClient,
  table: string,
  conflictCol: string,
  insertSql: string,
  values: unknown[],
  conflictValues?: unknown[],
): Promise<string> {
  const res = await client.query(`${insertSql} ON CONFLICT (${conflictCol}) DO NOTHING RETURNING id`, values)
  if (res.rows.length > 0) return res.rows[0].id as string

  const cols = conflictCol.split(',').map((c) => c.trim())
  const cv = conflictValues ?? values.slice(0, cols.length)
  const where = cols.map((c, i) => `${c} = $${i + 1}`).join(' AND ')
  const sel = await client.query(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`, cv)
  if (sel.rows.length === 0) throw new Error(`Row not found in ${table} after conflict on (${conflictCol})`)
  return sel.rows[0].id as string
}

// ─── Per-entity seeders ───────────────────────────────────────────────────────

async function seedBakery(client: PoolClient, bakery: BakeryDef, superAdminId: string): Promise<string> {
  const id = await getOrInsert(
    client,
    'bakeries',
    'slug',
    `INSERT INTO bakeries (
      slug, legal_name, display_name, tagline, description,
      logo_url, hero_image_url, primary_color, accent_color,
      phone, email, address_line1, address_line2, city,
      latitude, longitude,
      accepts_pickup, accepts_delivery, delivery_fee_minor, delivery_radius_km, min_order_minor,
      status, approved_at, approved_by
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,
      $10,$11,$12,$13,$14,
      $15,$16,
      $17,$18,$19,$20,$21,
      'active', now(), $22
    )`,
    [
      bakery.slug,
      bakery.legal_name,
      bakery.display_name,
      bakery.tagline,
      bakery.description,
      bakery.logo_url,
      bakery.hero_image_url,
      bakery.primary_color,
      bakery.accent_color ?? null,
      bakery.phone,
      bakery.email,
      bakery.address_line1,
      bakery.address_line2 ?? null,
      bakery.city,
      bakery.latitude,
      bakery.longitude,
      bakery.accepts_pickup,
      bakery.accepts_delivery,
      bakery.delivery_fee_minor,
      bakery.delivery_radius_km,
      bakery.min_order_minor,
      superAdminId,
    ],
    [bakery.slug],
  )
  return id
}

async function seedOwner(
  client: PoolClient,
  bakeryId: string,
  owner: BakeryDef['owner'],
): Promise<void> {
  const passwordHash = await argon2.hash(owner.password, { type: argon2.argon2id })
  await client.query(
    `INSERT INTO bakery_users (bakery_id, email, password_hash, full_name, role, is_active, email_verified_at)
     VALUES ($1, $2, $3, $4, 'owner', true, now())
     ON CONFLICT (bakery_id, email) DO NOTHING`,
    [bakeryId, owner.email, passwordHash, owner.full_name],
  )
}

async function seedCategory(
  client: PoolClient,
  bakeryId: string,
  cat: CategoryDef,
): Promise<string> {
  return getOrInsert(
    client,
    'product_categories',
    'bakery_id, slug',
    `INSERT INTO product_categories (bakery_id, name, slug, sort_order)
     VALUES ($1, $2, $3, $4)`,
    [bakeryId, cat.name, cat.slug, cat.sort_order],
    [bakeryId, cat.slug],
  )
}

async function seedProduct(
  client: PoolClient,
  bakeryId: string,
  categoryId: string,
  product: ProductDef,
): Promise<string> {
  return getOrInsert(
    client,
    'products',
    'bakery_id, slug',
    `INSERT INTO products (
      bakery_id, category_id, slug, name, description,
      base_price_minor, image_urls, is_published, is_available,
      requires_advance_notice_hours, sort_order, tags
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, true, true,
      $8, $9, $10
    )`,
    [
      bakeryId,
      categoryId,
      product.slug,
      product.name,
      product.description,
      product.base_price_minor,
      product.image_urls,
      product.requires_advance_notice_hours ?? null,
      product.sort_order,
      product.tags,
    ],
    [bakeryId, product.slug],
  )
}

async function seedVariants(
  client: PoolClient,
  bakeryId: string,
  productId: string,
  product: ProductDef,
): Promise<void> {
  if (!product.variants?.length) return

  const { rows } = await client.query(
    'SELECT COUNT(*) AS cnt FROM product_variants WHERE product_id = $1',
    [productId],
  )
  if (parseInt(rows[0].cnt as string, 10) > 0) return

  for (const variant of product.variants) {
    await client.query(
      `INSERT INTO product_variants (product_id, bakery_id, name, price_minor, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, bakeryId, variant.name, variant.price_minor, variant.sort_order],
    )
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    const adminRes = await pool.query(
      `SELECT id FROM super_admin_users WHERE is_active = true ORDER BY created_at LIMIT 1`,
    )
    if (adminRes.rows.length === 0) {
      console.error('No active super admin found. Run db-bootstrap.ts first.')
      process.exitCode = 1
      return
    }
    const superAdminId = adminRes.rows[0].id as string
    console.log(`→ Using super admin: ${superAdminId}`)

    for (const bakery of BAKERIES) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        console.log(`\n→ Seeding "${bakery.display_name}"...`)

        const bakeryId = await seedBakery(client, bakery, superAdminId)
        console.log(`  bakery:  ${bakeryId}`)

        await seedOwner(client, bakeryId, bakery.owner)
        console.log(`  owner:   ${bakery.owner.email}`)

        let productTotal = 0
        for (const category of bakery.categories) {
          const categoryId = await seedCategory(client, bakeryId, category)

          for (const product of category.products) {
            const productId = await seedProduct(client, bakeryId, categoryId, product)
            await seedVariants(client, bakeryId, productId, product)
            productTotal++
          }
        }
        console.log(`  categories: ${bakery.categories.length}, products: ${productTotal}`)

        await client.query('COMMIT')
        console.log(`  ✓ committed`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    }

    console.log('\n=================== SEED COMPLETE ===================')
    console.log('Bakery Admin login URL: https://eat-good-uganda-bakery-admin.vercel.app\n')
    for (const b of BAKERIES) {
      console.log(`${b.display_name}`)
      console.log(`  Email:    ${b.owner.email}`)
      console.log(`  Password: ${b.owner.password}`)
    }
    console.log('=====================================================\n')
  } catch (err) {
    console.error('Seed failed:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

void main()
