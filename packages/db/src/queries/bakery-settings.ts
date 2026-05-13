import type { BakeryPaymentCredential } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

/**
 * BakeryProfile: settings and profile information for a bakery
 * Subset of the Bakery type with only fields editable by bakery staff
 */
export interface BakeryProfile {
  id: string
  slug: string
  legal_name: string
  display_name: string
  phone: string
  email: string
  address_line1: string
  address_line2: string | null
  city: string
  country_code: string
  description: string | null
  logo_url: string | null
  accent_color: string | null
  website: string | null
  primary_color: string
  currency_code: string
  timezone: string
  accepts_pickup: boolean
  accepts_delivery: boolean
  delivery_fee_minor: number | null
  delivery_radius_km: number | null
  min_order_minor: number | null
  created_at: string
  updated_at: string
}

/**
 * Get bakery profile (full settings)
 */
export async function getBakeryProfile(
  db: Database,
  bakeryId: string,
): Promise<BakeryProfile | null> {
  const result = await query<BakeryProfile>(
    db,
    sql`SELECT
          id, slug, legal_name, display_name, phone, email,
          address_line1, address_line2, city, country_code,
          description, logo_url, accent_color, website,
          primary_color, currency_code, timezone,
          accepts_pickup, accepts_delivery,
          delivery_fee_minor, delivery_radius_km::float8 AS delivery_radius_km,
          min_order_minor,
          created_at, updated_at
        FROM bakeries
        WHERE id = ${bakeryId} AND deleted_at IS NULL`,
  )
  return result.rows[0] ?? null
}

export type UpdateBakeryProfileInput = Partial<
  Pick<
    BakeryProfile,
    | 'legal_name'
    | 'display_name'
    | 'phone'
    | 'email'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'description'
    | 'logo_url'
    | 'accent_color'
    | 'website'
    | 'accepts_pickup'
    | 'accepts_delivery'
    | 'delivery_fee_minor'
    | 'delivery_radius_km'
    | 'min_order_minor'
  >
>

/**
 * Update bakery profile
 */
export async function updateBakeryProfile(
  db: Database,
  bakeryId: string,
  input: UpdateBakeryProfileInput,
): Promise<BakeryProfile | null> {
  const result = await query<BakeryProfile>(
    db,
    sql`UPDATE bakeries SET
          legal_name = COALESCE(${input.legal_name ?? null}, legal_name),
          display_name = COALESCE(${input.display_name ?? null}, display_name),
          phone = COALESCE(${input.phone ?? null}, phone),
          email = COALESCE(${input.email ?? null}, email),
          address_line1 = COALESCE(${input.address_line1 ?? null}, address_line1),
          address_line2 = COALESCE(${input.address_line2 ?? null}, address_line2),
          city = COALESCE(${input.city ?? null}, city),
          description = COALESCE(${input.description ?? null}, description),
          logo_url = COALESCE(${input.logo_url ?? null}, logo_url),
          accent_color = COALESCE(${input.accent_color ?? null}, accent_color),
          website = COALESCE(${input.website ?? null}, website),
          accepts_pickup = COALESCE(${input.accepts_pickup ?? null}, accepts_pickup),
          accepts_delivery = COALESCE(${input.accepts_delivery ?? null}, accepts_delivery),
          delivery_fee_minor = COALESCE(${input.delivery_fee_minor ?? null}, delivery_fee_minor),
          delivery_radius_km = COALESCE(${input.delivery_radius_km ?? null}, delivery_radius_km),
          min_order_minor = COALESCE(${input.min_order_minor ?? null}, min_order_minor),
          updated_at = now()
        WHERE id = ${bakeryId} AND deleted_at IS NULL
        RETURNING
          id, slug, legal_name, display_name, phone, email,
          address_line1, address_line2, city, country_code,
          description, logo_url, accent_color, website,
          primary_color, currency_code, timezone,
          accepts_pickup, accepts_delivery,
          delivery_fee_minor, delivery_radius_km::float8 AS delivery_radius_km,
          min_order_minor,
          created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

/**
 * Get payment credentials metadata (provider, created_at, updated_at)
 * Does NOT return encrypted credentials
 */
export async function getPaymentCredentials(
  db: Database,
  bakeryId: string,
  provider?: 'mtn_momo' | 'airtel_money' | 'bank_transfer',
): Promise<BakeryPaymentCredential[]> {
  const result = await query<BakeryPaymentCredential>(
    db,
    sql`SELECT id, bakery_id, provider, is_enabled, target_environment, last_verified_at, created_at, updated_at
        FROM bakery_payment_credentials
        WHERE bakery_id = ${bakeryId}
          ${provider ? sql`AND provider = ${provider}` : sql``}
        ORDER BY created_at DESC`,
  )
  return result.rows
}

export type CreatePaymentCredentialInput = {
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  is_enabled?: boolean
  target_environment?: 'sandbox' | 'production'
  encrypted_config: Buffer
  config_nonce: Buffer
}

/**
 * Create payment credentials (credentials should be encrypted before calling this)
 */
export async function createPaymentCredential(
  db: Database,
  bakeryId: string,
  input: CreatePaymentCredentialInput,
): Promise<BakeryPaymentCredential | null> {
  const result = await query<BakeryPaymentCredential>(
    db,
    sql`INSERT INTO bakery_payment_credentials (bakery_id, provider, is_enabled, target_environment, encrypted_config, config_nonce)
        VALUES (${bakeryId}, ${input.provider}, ${input.is_enabled ?? false}, ${input.target_environment ?? 'sandbox'}, ${input.encrypted_config}, ${input.config_nonce})
        RETURNING id, bakery_id, provider, is_enabled, target_environment, last_verified_at, created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

export type UpdatePaymentCredentialInput = {
  is_enabled?: boolean
  target_environment?: 'sandbox' | 'production'
  encrypted_config?: Buffer
  config_nonce?: Buffer
  last_verified_at?: Date | null
}

/**
 * Update payment credentials (credentials should be encrypted before calling this)
 */
export async function updatePaymentCredential(
  db: Database,
  bakeryId: string,
  credentialId: string,
  input: UpdatePaymentCredentialInput,
): Promise<BakeryPaymentCredential | null> {
  const result = await query<BakeryPaymentCredential>(
    db,
    sql`UPDATE bakery_payment_credentials
        SET
          is_enabled = COALESCE(${input.is_enabled ?? null}, is_enabled),
          target_environment = COALESCE(${input.target_environment ?? null}, target_environment),
          encrypted_config = COALESCE(${input.encrypted_config ?? null}, encrypted_config),
          config_nonce = COALESCE(${input.config_nonce ?? null}, config_nonce),
          last_verified_at = COALESCE(${input.last_verified_at ?? null}, last_verified_at),
          updated_at = now()
        WHERE id = ${credentialId} AND bakery_id = ${bakeryId}
        RETURNING id, bakery_id, provider, is_enabled, target_environment, last_verified_at, created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

/**
 * Delete payment credentials
 */
export async function deletePaymentCredential(
  db: Database,
  bakeryId: string,
  credentialId: string,
): Promise<boolean> {
  const result = await query<{ id: string }>(
    db,
    sql`DELETE FROM bakery_payment_credentials
        WHERE id = ${credentialId} AND bakery_id = ${bakeryId}
        RETURNING id`,
  )
  return result.rows.length > 0
}
