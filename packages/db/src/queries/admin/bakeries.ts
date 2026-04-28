import type { Bakery } from '@eatgood/shared'

import { query } from '../../client'
import type { Database } from '../../client'
import { sql } from '../../sql'

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

export async function adminListAllBakeries(
  db: Database,
  _reason: string,
): Promise<Bakery[]> {
  const result = await query<Bakery>(
    db,
    sql`SELECT ${BAKERY_COLS} FROM bakeries
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC`,
  )
  return result.rows
}

export async function adminListPendingBakeries(
  db: Database,
  _reason: string,
): Promise<Bakery[]> {
  const result = await query<Bakery>(
    db,
    sql`SELECT ${BAKERY_COLS} FROM bakeries
        WHERE status = 'pending_approval' AND deleted_at IS NULL
        ORDER BY created_at ASC`,
  )
  return result.rows
}

export async function adminApproveBakery(
  db: Database,
  bakeryId: string,
  approvedBy: string,
  _reason: string,
): Promise<Bakery | null> {
  const result = await query<Bakery>(
    db,
    sql`UPDATE bakeries
        SET status = 'active', approved_at = now(), approved_by = ${approvedBy}, updated_at = now()
        WHERE id = ${bakeryId} AND status = 'pending_approval' AND deleted_at IS NULL
        RETURNING ${BAKERY_COLS}`,
  )
  return result.rows[0] ?? null
}
