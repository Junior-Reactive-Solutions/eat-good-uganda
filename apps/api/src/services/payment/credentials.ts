import type { Database } from '@eatgood/db'
import { query, sql } from '@eatgood/db'

import { aesGcmDecrypt, aesGcmEncrypt } from '../../lib/crypto'

/**
 * Plaintext MTN MoMo credentials for a single bakery.
 *
 * NEVER persist this shape to disk or send it to logs/telemetry. Encrypt at
 * rest via {@link saveBakeryMomoCredentials} and discard the plaintext as
 * soon as the caller is done with it.
 */
export interface BakeryMomoCredentials {
  subscription_key: string
  user_id: string
  api_key: string
  target_environment: 'sandbox' | 'production'
  collection_primary_key?: string
}

/**
 * Public summary of a configured payment method. Safe to return to the
 * dashboard — contains no plaintext secrets.
 */
export interface PaymentMethodSummary {
  method: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  is_enabled: boolean
  target_environment: 'sandbox' | 'production'
  /** Obfuscated hint (e.g. last 4 chars of user_id) — never plaintext. */
  hint?: string
}

const MTN_MOMO_PROVIDER = 'mtn_momo'

/** Build the AAD bound to MoMo credentials for a bakery. */
function momoAad(bakeryId: string): string {
  return `eatgood:bakery:${bakeryId}:mtn_momo`
}

/**
 * Type guard for the parsed JSON of `BakeryMomoCredentials`. We intentionally
 * narrow without echoing values so a malformed payload never gets stringified
 * back into an error message.
 */
function isBakeryMomoCredentials(value: unknown): value is BakeryMomoCredentials {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v['subscription_key'] !== 'string') return false
  if (typeof v['user_id'] !== 'string') return false
  if (typeof v['api_key'] !== 'string') return false
  if (v['target_environment'] !== 'sandbox' && v['target_environment'] !== 'production') {
    return false
  }
  if (
    v['collection_primary_key'] !== undefined &&
    typeof v['collection_primary_key'] !== 'string'
  ) {
    return false
  }
  return true
}

/**
 * Obfuscate a secret-ish identifier for display. Shows only the last 4
 * characters; everything shorter than that is replaced wholesale by `****`.
 */
function obfuscateHint(value: string): string {
  if (value.length <= 4) return '****'
  return `****${value.slice(-4)}`
}

/**
 * Encrypt and upsert MoMo credentials for a bakery.
 *
 * The plaintext credentials never touch the database — only the AES-GCM
 * ciphertext + nonce do, bound to a bakery-scoped AAD so credentials
 * encrypted for one bakery cannot be decrypted against another.
 */
export async function saveBakeryMomoCredentials(
  db: Database,
  bakeryId: string,
  credentials: BakeryMomoCredentials,
): Promise<void> {
  let ciphertextB64: string
  let nonceB64: string
  try {
    const plaintext = JSON.stringify(credentials)
    const result = await aesGcmEncrypt(plaintext, momoAad(bakeryId))
    ciphertextB64 = result.ciphertext
    nonceB64 = result.nonce
  } catch {
    // Do NOT include credential or key material in the error.
    throw new Error('Failed to save payment credentials')
  }

  const encryptedConfig = Buffer.from(ciphertextB64, 'base64')
  const configNonce = Buffer.from(nonceB64, 'base64')

  try {
    await query(
      db,
      sql`INSERT INTO bakery_payment_credentials (
            bakery_id, provider, is_enabled, target_environment,
            encrypted_config, config_nonce
          )
          VALUES (
            ${bakeryId}, ${MTN_MOMO_PROVIDER}, ${false},
            ${credentials.target_environment},
            ${encryptedConfig}, ${configNonce}
          )
          ON CONFLICT (bakery_id, provider) DO UPDATE SET
            target_environment = EXCLUDED.target_environment,
            encrypted_config   = EXCLUDED.encrypted_config,
            config_nonce       = EXCLUDED.config_nonce,
            updated_at         = now()`,
    )
  } catch {
    throw new Error('Failed to save payment credentials')
  }
}

interface CredentialRow {
  encrypted_config: Buffer
  config_nonce: Buffer
}

/**
 * Decrypt and return MoMo credentials for a bakery, or null if none stored.
 *
 * Callers are responsible for discarding the returned plaintext as soon as
 * they're done using it. Never log, cache, or echo the returned object.
 */
export async function loadBakeryMomoCredentials(
  db: Database,
  bakeryId: string,
): Promise<BakeryMomoCredentials | null> {
  let row: CredentialRow | undefined
  try {
    const result = await query<CredentialRow>(
      db,
      sql`SELECT encrypted_config, config_nonce
          FROM bakery_payment_credentials
          WHERE bakery_id = ${bakeryId}
            AND provider = ${MTN_MOMO_PROVIDER}
          LIMIT 1`,
    )
    row = result.rows[0]
  } catch {
    throw new Error('Failed to load payment credentials')
  }

  if (!row) return null

  let plaintext: string
  try {
    const ciphertextB64 = row.encrypted_config.toString('base64')
    const nonceB64 = row.config_nonce.toString('base64')
    plaintext = await aesGcmDecrypt(ciphertextB64, nonceB64, momoAad(bakeryId))
  } catch {
    throw new Error('Failed to decrypt payment credentials')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(plaintext)
  } catch {
    throw new Error('Failed to decrypt payment credentials')
  }

  if (!isBakeryMomoCredentials(parsed)) {
    throw new Error('Failed to decrypt payment credentials')
  }

  return parsed
}

interface SummaryRow {
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  is_enabled: boolean
  target_environment: 'sandbox' | 'production'
  encrypted_config: Buffer
  config_nonce: Buffer
}

/**
 * List configured payment methods for a bakery, without plaintext.
 *
 * For MoMo we decrypt internally to derive an obfuscated `user_id` hint,
 * then discard the plaintext immediately. The hint shows only the last 4
 * characters of `user_id` (e.g. `****abcd`). If decryption fails for any
 * row we still surface the row, just without a hint.
 */
export async function listBakeryPaymentMethods(
  db: Database,
  bakeryId: string,
): Promise<PaymentMethodSummary[]> {
  let rows: SummaryRow[]
  try {
    const result = await query<SummaryRow>(
      db,
      sql`SELECT provider, is_enabled, target_environment, encrypted_config, config_nonce
          FROM bakery_payment_credentials
          WHERE bakery_id = ${bakeryId}
          ORDER BY provider ASC`,
    )
    rows = result.rows
  } catch {
    throw new Error('Failed to list payment methods')
  }

  const summaries: PaymentMethodSummary[] = []
  for (const row of rows) {
    const base: PaymentMethodSummary = {
      method: row.provider,
      is_enabled: row.is_enabled,
      target_environment: row.target_environment,
    }

    if (row.provider === MTN_MOMO_PROVIDER) {
      try {
        const ciphertextB64 = row.encrypted_config.toString('base64')
        const nonceB64 = row.config_nonce.toString('base64')
        const plaintext = await aesGcmDecrypt(ciphertextB64, nonceB64, momoAad(bakeryId))
        const parsed: unknown = JSON.parse(plaintext)
        if (isBakeryMomoCredentials(parsed)) {
          summaries.push({ ...base, hint: obfuscateHint(parsed.user_id) })
          continue
        }
      } catch {
        // Fall through to the hint-less summary below.
      }
    }

    summaries.push(base)
  }

  return summaries
}
