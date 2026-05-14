import type { CustomerAddress, CustomerProfile } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export async function getCustomerProfile(
  db: Database,
  userId: string,
): Promise<CustomerProfile | null> {
  const result = await query<CustomerProfile>(
    db,
    sql`SELECT
          id, user_id, first_name, last_name, date_of_birth, bio, avatar_url,
          default_address_id, created_at, updated_at
        FROM customer_profiles
        WHERE user_id = ${userId}`,
  )
  return result.rows[0] ?? null
}

export type UpdateCustomerProfileInput = Partial<
  Pick<
    CustomerProfile,
    'first_name' | 'last_name' | 'date_of_birth' | 'bio' | 'avatar_url' | 'default_address_id'
  >
>

export async function updateCustomerProfile(
  db: Database,
  userId: string,
  input: UpdateCustomerProfileInput,
): Promise<CustomerProfile | null> {
  const result = await query<CustomerProfile>(
    db,
    sql`UPDATE customer_profiles SET
          first_name = COALESCE(${input.first_name ?? null}, first_name),
          last_name = COALESCE(${input.last_name ?? null}, last_name),
          date_of_birth = COALESCE(${input.date_of_birth ?? null}, date_of_birth),
          bio = COALESCE(${input.bio ?? null}, bio),
          avatar_url = COALESCE(${input.avatar_url ?? null}, avatar_url),
          default_address_id = COALESCE(${input.default_address_id ?? null}, default_address_id),
          updated_at = now()
        WHERE user_id = ${userId}
        RETURNING
          id, user_id, first_name, last_name, date_of_birth, bio, avatar_url,
          default_address_id, created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

export async function getCustomerAddresses(
  db: Database,
  userId: string,
): Promise<CustomerAddress[]> {
  const result = await query<CustomerAddress>(
    db,
    sql`SELECT
          id, user_id, street_address, city, district, postal_code,
          is_default, is_delivery_address, is_billing_address,
          created_at, updated_at
        FROM customer_addresses
        WHERE user_id = ${userId}
        ORDER BY is_default DESC, created_at DESC`,
  )
  return result.rows
}

export async function getCustomerAddress(
  db: Database,
  userId: string,
  addressId: string,
): Promise<CustomerAddress | null> {
  const result = await query<CustomerAddress>(
    db,
    sql`SELECT
          id, user_id, street_address, city, district, postal_code,
          is_default, is_delivery_address, is_billing_address,
          created_at, updated_at
        FROM customer_addresses
        WHERE id = ${addressId} AND user_id = ${userId}`,
  )
  return result.rows[0] ?? null
}

export type CreateCustomerAddressInput = Pick<
  CustomerAddress,
  'street_address' | 'city' | 'district' | 'is_delivery_address' | 'is_billing_address'
> & {
  postal_code?: string
  is_default?: boolean
}

export async function createCustomerAddress(
  db: Database,
  userId: string,
  input: CreateCustomerAddressInput,
): Promise<CustomerAddress | null> {
  // If marking as default, unset other defaults first
  if (input.is_default) {
    await query(
      db,
      sql`UPDATE customer_addresses SET is_default = false WHERE user_id = ${userId} AND is_default = true`,
    )
  }

  const result = await query<CustomerAddress>(
    db,
    sql`INSERT INTO customer_addresses (
          user_id, street_address, city, district, postal_code,
          is_default, is_delivery_address, is_billing_address
        ) VALUES (
          ${userId}, ${input.street_address}, ${input.city}, ${input.district},
          ${input.postal_code ?? null}, ${input.is_default ?? false},
          ${input.is_delivery_address}, ${input.is_billing_address}
        )
        RETURNING
          id, user_id, street_address, city, district, postal_code,
          is_default, is_delivery_address, is_billing_address,
          created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

export type UpdateCustomerAddressInput = Partial<
  Pick<
    CustomerAddress,
    | 'street_address'
    | 'city'
    | 'district'
    | 'postal_code'
    | 'is_default'
    | 'is_delivery_address'
    | 'is_billing_address'
  >
>

export async function updateCustomerAddress(
  db: Database,
  userId: string,
  addressId: string,
  input: UpdateCustomerAddressInput,
): Promise<CustomerAddress | null> {
  // If marking as default, unset other defaults first
  if (input.is_default) {
    await query(
      db,
      sql`UPDATE customer_addresses SET is_default = false WHERE user_id = ${userId} AND id != ${addressId}`,
    )
  }

  const result = await query<CustomerAddress>(
    db,
    sql`UPDATE customer_addresses SET
          street_address = COALESCE(${input.street_address ?? null}, street_address),
          city = COALESCE(${input.city ?? null}, city),
          district = COALESCE(${input.district ?? null}, district),
          postal_code = COALESCE(${input.postal_code ?? null}, postal_code),
          is_default = COALESCE(${input.is_default ?? null}, is_default),
          is_delivery_address = COALESCE(${input.is_delivery_address ?? null}, is_delivery_address),
          is_billing_address = COALESCE(${input.is_billing_address ?? null}, is_billing_address),
          updated_at = now()
        WHERE id = ${addressId} AND user_id = ${userId}
        RETURNING
          id, user_id, street_address, city, district, postal_code,
          is_default, is_delivery_address, is_billing_address,
          created_at, updated_at`,
  )
  return result.rows[0] ?? null
}

export async function deleteCustomerAddress(
  db: Database,
  userId: string,
  addressId: string,
): Promise<boolean> {
  const result = await query<{ id: string }>(
    db,
    sql`DELETE FROM customer_addresses
        WHERE id = ${addressId} AND user_id = ${userId}
        RETURNING id`,
  )
  return result.rows.length > 0
}
