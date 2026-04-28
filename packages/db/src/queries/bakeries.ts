import type { Bakery } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const BAKERY_COLS = sql`
  id, slug, legal_name, display_name, tagline, description,
  logo_url, hero_image_url, primary_color, accent_color,
  phone, whatsapp, email,
  address_line1, address_line2, city, country_code,
  latitude::float8 AS latitude, longitude::float8 AS longitude, timezone,
  status, accepts_pickup, accepts_delivery,
  delivery_fee_minor, delivery_radius_km::float8 AS delivery_radius_km,
  min_order_minor, custom_domain, subdomain,
  created_at, updated_at, deleted_at, approved_at, approved_by
`

export async function getBakeryBySlug(db: Database, slug: string): Promise<Bakery | null> {
  const result = await query<Bakery>(
    db,
    sql`SELECT ${BAKERY_COLS} FROM bakeries
        WHERE slug = ${slug} AND status = 'active' AND deleted_at IS NULL
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getBakeryById(db: Database, bakeryId: string): Promise<Bakery | null> {
  const result = await query<Bakery>(
    db,
    sql`SELECT ${BAKERY_COLS} FROM bakeries
        WHERE id = ${bakeryId} AND deleted_at IS NULL
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function listActiveBakeries(db: Database): Promise<Bakery[]> {
  const result = await query<Bakery>(
    db,
    sql`SELECT ${BAKERY_COLS} FROM bakeries
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY display_name ASC`,
  )
  return result.rows
}

export type CreateBakeryInput = {
  slug: string
  legal_name: string
  display_name: string
  phone: string
  email: string
  address_line1: string
  latitude: number
  longitude: number
  tagline?: string
  description?: string
  primary_color?: string
  accepts_pickup?: boolean
  accepts_delivery?: boolean
}

export async function createBakery(db: Database, input: CreateBakeryInput): Promise<Bakery> {
  const result = await query<Bakery>(
    db,
    sql`INSERT INTO bakeries (
          slug, legal_name, display_name, phone, email,
          address_line1, latitude, longitude,
          tagline, description, primary_color,
          accepts_pickup, accepts_delivery
        ) VALUES (
          ${input.slug}, ${input.legal_name}, ${input.display_name},
          ${input.phone}, ${input.email}, ${input.address_line1},
          ${input.latitude}, ${input.longitude},
          ${input.tagline ?? null}, ${input.description ?? null},
          ${input.primary_color ?? '#8B4513'},
          ${input.accepts_pickup ?? true}, ${input.accepts_delivery ?? false}
        )
        RETURNING ${BAKERY_COLS}`,
  )
  return result.rows[0]!
}

export type PublicBakery = {
  id: string
  slug: string
  display_name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  primary_color: string
  accent_color: string | null
  address_line1: string
  address_line2: string | null
  city: string
  accepts_pickup: boolean
  accepts_delivery: boolean
  delivery_radius_km: number | null
  distance_km: number | null
}

export type ListPublicBakeriesInput = {
  lat?: number | undefined
  lng?: number | undefined
  search?: string | undefined
  page?: number | undefined
  page_size?: number | undefined
}

export async function listPublicBakeries(
  db: Database,
  input: ListPublicBakeriesInput = {},
): Promise<PublicBakery[]> {
  const { search, page = 1, page_size = 20 } = input
  const clampedSize = Math.min(Math.max(1, page_size), 50)
  const offset = (Math.max(1, page) - 1) * clampedSize
  const searchParam = search?.trim() || null

  if (typeof input.lat === 'number' && typeof input.lng === 'number') {
    const result = await query<PublicBakery>(
      db,
      sql`SELECT
            id, slug, display_name, tagline, description,
            logo_url, primary_color, accent_color,
            address_line1, address_line2, city,
            accepts_pickup, accepts_delivery,
            delivery_radius_km::float8 AS delivery_radius_km,
            earth_distance(
              ll_to_earth(latitude::float8, longitude::float8),
              ll_to_earth(${input.lat}::float8, ${input.lng}::float8)
            ) / 1000 AS distance_km
          FROM bakeries
          WHERE status = 'active' AND deleted_at IS NULL
            AND (${searchParam}::text IS NULL
                 OR display_name ILIKE '%' || ${searchParam}::text || '%'
                 OR description ILIKE '%' || ${searchParam}::text || '%')
          ORDER BY
            ll_to_earth(latitude::float8, longitude::float8)
              <-> ll_to_earth(${input.lat}::float8, ${input.lng}::float8)
          LIMIT ${clampedSize} OFFSET ${offset}`,
    )
    return result.rows
  }

  const result = await query<PublicBakery>(
    db,
    sql`SELECT
          id, slug, display_name, tagline, description,
          logo_url, primary_color, accent_color,
          address_line1, address_line2, city,
          accepts_pickup, accepts_delivery,
          delivery_radius_km::float8 AS delivery_radius_km,
          NULL::float8 AS distance_km
        FROM bakeries
        WHERE status = 'active' AND deleted_at IS NULL
          AND (${searchParam}::text IS NULL
               OR display_name ILIKE '%' || ${searchParam}::text || '%'
               OR description ILIKE '%' || ${searchParam}::text || '%')
        ORDER BY display_name ASC
        LIMIT ${clampedSize} OFFSET ${offset}`,
  )
  return result.rows
}

export type UpdateBakeryInput = Partial<Omit<CreateBakeryInput, 'slug'>> & {
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  hero_image_url?: string | null
  accent_color?: string | null
  whatsapp?: string | null
  address_line2?: string | null
  delivery_fee_minor?: number | null
  delivery_radius_km?: number | null
  min_order_minor?: number | null
}

export async function updateBakery(
  db: Database,
  bakeryId: string,
  input: UpdateBakeryInput,
): Promise<Bakery | null> {
  const result = await query<Bakery>(
    db,
    sql`UPDATE bakeries SET
          legal_name        = COALESCE(${input.legal_name ?? null}, legal_name),
          display_name      = COALESCE(${input.display_name ?? null}, display_name),
          tagline           = COALESCE(${input.tagline ?? null}, tagline),
          description       = COALESCE(${input.description ?? null}, description),
          phone             = COALESCE(${input.phone ?? null}, phone),
          whatsapp          = COALESCE(${input.whatsapp ?? null}, whatsapp),
          email             = COALESCE(${input.email ?? null}, email),
          address_line1     = COALESCE(${input.address_line1 ?? null}, address_line1),
          address_line2     = COALESCE(${input.address_line2 ?? null}, address_line2),
          latitude          = COALESCE(${input.latitude ?? null}, latitude),
          longitude         = COALESCE(${input.longitude ?? null}, longitude),
          primary_color     = COALESCE(${input.primary_color ?? null}, primary_color),
          accent_color      = COALESCE(${input.accent_color ?? null}, accent_color),
          logo_url          = COALESCE(${input.logo_url ?? null}, logo_url),
          hero_image_url    = COALESCE(${input.hero_image_url ?? null}, hero_image_url),
          accepts_pickup    = COALESCE(${input.accepts_pickup ?? null}, accepts_pickup),
          accepts_delivery  = COALESCE(${input.accepts_delivery ?? null}, accepts_delivery),
          delivery_fee_minor   = COALESCE(${input.delivery_fee_minor ?? null}, delivery_fee_minor),
          delivery_radius_km   = COALESCE(${input.delivery_radius_km ?? null}, delivery_radius_km),
          min_order_minor      = COALESCE(${input.min_order_minor ?? null}, min_order_minor),
          updated_at        = now()
        WHERE id = ${bakeryId} AND deleted_at IS NULL
        RETURNING ${BAKERY_COLS}`,
  )
  return result.rows[0] ?? null
}
