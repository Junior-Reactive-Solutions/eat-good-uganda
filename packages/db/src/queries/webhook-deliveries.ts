import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

/**
 * A persisted inbound webhook attempt. We log every webhook we receive — even
 * ones we ignore (bad reference, wrong tenant) — so ops can replay and audit
 * provider callbacks after the fact. The `raw_body` column carries the full
 * provider payload for forensics; it MUST NOT contain credential material
 * (provider bodies never do, but the caller is responsible for not stuffing
 * secrets into it).
 *
 * Shape mirrors the `webhook_deliveries` table (migration 0015):
 *   provider, bakery_id, external_reference, signature_header,
 *   is_signature_valid, raw_body, received_at, processed_at, processing_error
 */
export interface WebhookDelivery {
  id: string
  provider: string
  bakery_id: string | null
  external_reference: string | null
  signature_header: string | null
  is_signature_valid: boolean
  raw_body: Record<string, unknown> | null
  received_at: Date
  processed_at: Date | null
  processing_error: string | null
}

export interface RecordWebhookDeliveryInput {
  /** Provider slug, e.g. 'mtn_momo'. */
  provider: string
  /**
   * Tenant the webhook resolved to, if known. Null when the reference could
   * not be matched to a payment (so we never had a bakery context).
   */
  bakeryId?: string | null
  /** The provider reference / external id the callback carried, if any. */
  externalReference?: string | null
  /** Full provider payload, stored verbatim for forensics. Never secrets. */
  rawBody?: Record<string, unknown> | null
  /**
   * When we finished processing the webhook. Set to `now()` for synchronous
   * handlers that resolve before responding.
   */
  processed?: boolean
  /** A short, log-safe processing error, if any. Never credential material. */
  processingError?: string | null
}

/**
 * Insert a single webhook-delivery record. Best-effort — callers should treat
 * a thrown error as non-fatal for the webhook response itself (the provider
 * must still receive a 200), but should log it for ops.
 */
export async function recordWebhookDelivery(
  db: Database,
  input: RecordWebhookDeliveryInput,
): Promise<WebhookDelivery | null> {
  const processedAt = input.processed === true ? sql`now()` : sql`NULL`

  const result = await query<WebhookDelivery>(
    db,
    sql`INSERT INTO webhook_deliveries (
          provider, bakery_id, external_reference,
          raw_body, received_at, processed_at, processing_error
        ) VALUES (
          ${input.provider},
          ${input.bakeryId ?? null},
          ${input.externalReference ?? null},
          ${input.rawBody ? JSON.stringify(input.rawBody) : null},
          now(),
          ${processedAt},
          ${input.processingError ?? null}
        )
        RETURNING
          id, provider, bakery_id, external_reference,
          signature_header, is_signature_valid, raw_body,
          received_at, processed_at, processing_error`,
  )
  return result.rows[0] ?? null
}
