import type { Payment, PaymentMethod, PaymentStatus } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const PAYMENT_COLS = sql`
  id, order_id, bakery_id, method, amount_minor, currency_code,
  status, provider_reference, external_reference, payer_phone,
  bank_proof_url, failure_reason, webhook_payload,
  initiated_at, paid_at, failed_at, created_at, updated_at
`

export type CreatePaymentInput = {
  order_id: string
  method: PaymentMethod
  amount_minor: number
  currency_code?: string
  payer_phone?: string | null
  external_reference?: string | null
}

export async function createPayment(
  db: Database,
  bakeryId: string,
  input: CreatePaymentInput,
): Promise<Payment> {
  const result = await query<Payment>(
    db,
    sql`INSERT INTO payments (
          order_id, bakery_id, method, amount_minor, currency_code,
          status, payer_phone, external_reference
        ) VALUES (
          ${input.order_id}, ${bakeryId}, ${input.method},
          ${input.amount_minor}, ${input.currency_code ?? 'UGX'},
          'initiated',
          ${input.payer_phone ?? null},
          ${input.external_reference ?? null}
        )
        RETURNING ${PAYMENT_COLS}`,
  )
  const payment = result.rows[0]
  if (!payment) throw new Error('failed to create payment')
  return payment
}

export async function getPaymentById(
  db: Database,
  bakeryId: string,
  paymentId: string,
): Promise<Payment | null> {
  const result = await query<Payment>(
    db,
    sql`SELECT ${PAYMENT_COLS} FROM payments
        WHERE id = ${paymentId} AND bakery_id = ${bakeryId}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getPaymentByProviderRef(
  db: Database,
  bakeryId: string,
  method: PaymentMethod,
  providerReference: string,
): Promise<Payment | null> {
  const result = await query<Payment>(
    db,
    sql`SELECT ${PAYMENT_COLS} FROM payments
        WHERE method = ${method}
          AND provider_reference = ${providerReference}
          AND bakery_id = ${bakeryId}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

/**
 * Look up a payment by its provider reference WITHOUT a bakery_id filter.
 *
 * This is the one sanctioned exception to the "always scope by bakery_id"
 * rule, and it exists solely for the inbound payment webhook receiver. A
 * webhook arrives unauthenticated — there is no session and therefore no
 * bakery context — yet it must resolve to exactly one payment row before we
 * can learn which tenant it belongs to.
 *
 * This is safe because:
 *   - `provider_reference` is a fresh `randomUUID()` minted per initiation
 *     (see `newMomoProviderReference`). It is unguessable and globally unique
 *     under the `(method, provider_reference)` unique index, so it already
 *     uniquely identifies the tenant.
 *   - The caller MUST read `bakery_id` off the returned row and use it to
 *     scope every subsequent query (status check, order update, etc.). The
 *     webhook never trusts a bakery_id supplied in the request body.
 *
 * Returns null when no payment matches — the webhook treats this as a
 * stale/forged reference and acknowledges with 200 without acting.
 */
export async function getPaymentByProviderRefUnscoped(
  db: Database,
  method: PaymentMethod,
  providerReference: string,
): Promise<Payment | null> {
  const result = await query<Payment>(
    db,
    sql`SELECT ${PAYMENT_COLS} FROM payments
        WHERE method = ${method}
          AND provider_reference = ${providerReference}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export type UpdatePaymentStatusInput = {
  status: PaymentStatus
  provider_reference?: string | null
  failure_reason?: string | null
  bank_proof_url?: string | null
  webhook_payload?: Record<string, unknown> | null
}

export async function updatePaymentStatus(
  db: Database,
  bakeryId: string,
  paymentId: string,
  input: UpdatePaymentStatusInput,
): Promise<Payment | null> {
  const paidTimestamp = input.status === 'paid' ? sql`, paid_at = now()` : sql``
  const failedTimestamp = input.status === 'failed' ? sql`, failed_at = now()` : sql``

  const result = await query<Payment>(
    db,
    sql`UPDATE payments SET
          status             = ${input.status},
          provider_reference = COALESCE(${input.provider_reference ?? null}, provider_reference),
          failure_reason     = COALESCE(${input.failure_reason ?? null}, failure_reason),
          bank_proof_url     = COALESCE(${input.bank_proof_url ?? null}, bank_proof_url),
          webhook_payload    = COALESCE(${input.webhook_payload ? JSON.stringify(input.webhook_payload) : null}, webhook_payload),
          updated_at         = now()
          ${paidTimestamp}
          ${failedTimestamp}
        WHERE id = ${paymentId} AND bakery_id = ${bakeryId}
        RETURNING ${PAYMENT_COLS}`,
  )
  return result.rows[0] ?? null
}

export async function listPaymentsForOrder(
  db: Database,
  bakeryId: string,
  orderId: string,
): Promise<Payment[]> {
  const result = await query<Payment>(
    db,
    sql`SELECT ${PAYMENT_COLS} FROM payments
        WHERE order_id = ${orderId} AND bakery_id = ${bakeryId}
        ORDER BY created_at DESC`,
  )
  return result.rows
}

/**
 * List MoMo payments stuck in 'pending' for longer than `olderThanMinutes`,
 * ACROSS ALL TENANTS, oldest first.
 *
 * This is the second (and final) sanctioned exception to the "always scope by
 * bakery_id" rule, alongside {@link getPaymentByProviderRefUnscoped}. It exists
 * solely for the system reconciliation sweep
 * (`apps/api/src/jobs/reconcilePendingPayments.ts`), which has no session and
 * therefore no single tenant context — it must inspect stuck payments for every
 * bakery.
 *
 * This is safe because:
 *   - The caller is a trusted in-process background job, never a request
 *     handler reachable by an authenticated tenant.
 *   - Every returned row carries its own `bakery_id`. The reconciliation job
 *     MUST read that off the row and use it to scope every follow-up write
 *     (`checkPaymentStatus`, `markPaymentTimedOut`) — exactly as the webhook
 *     receiver does. It never assumes a single tenant.
 *   - The job only ever reads/writes the payment's own row; it never joins or
 *     leaks one tenant's data into another's.
 *
 * The cutoff is computed in SQL (`now() - interval`) rather than passed as a
 * JS timestamp, so it is immune to clock skew between the app server and the
 * database. `LIMIT` caps the working set so a backlog can't blow up memory or
 * a single sweep's runtime.
 */
export async function listStuckPendingMomoPayments(
  db: Database,
  olderThanMinutes: number,
  limit = 500,
): Promise<Payment[]> {
  // Guard against a negative/NaN interval silently selecting everything.
  const minutes = Number.isFinite(olderThanMinutes)
    ? Math.max(0, Math.trunc(olderThanMinutes))
    : 0
  const cappedLimit = Number.isFinite(limit)
    ? Math.min(Math.max(1, Math.trunc(limit)), 5000)
    : 500

  const result = await query<Payment>(
    db,
    sql`SELECT ${PAYMENT_COLS} FROM payments
        WHERE status = 'pending'
          AND method = 'mtn_momo'
          AND initiated_at < now() - (${minutes} * interval '1 minute')
        ORDER BY initiated_at ASC
        LIMIT ${cappedLimit}`,
  )
  return result.rows
}

/**
 * Mark a single payment as failed because the reconciliation sweep gave up on
 * it (it sat in 'pending' past the hard timeout without the provider ever
 * resolving it).
 *
 * Scoped by `bakery_id` (read off the row by the caller) per the tenancy rules,
 * and additionally guarded by `status = 'pending'` so we never clobber a row
 * that a concurrent webhook / status check has already moved to a terminal
 * state. Returns the updated row, or null if nothing matched (already resolved
 * or wrong tenant) — which lets the caller distinguish "I timed it out" from
 * "someone else resolved it first" without double-counting.
 */
export async function markPaymentTimedOut(
  db: Database,
  bakeryId: string,
  paymentId: string,
  reason = 'reconciliation_timeout',
): Promise<Payment | null> {
  const result = await query<Payment>(
    db,
    sql`UPDATE payments SET
          status         = 'failed',
          failure_reason = ${reason},
          failed_at      = now(),
          updated_at     = now()
        WHERE id = ${paymentId}
          AND bakery_id = ${bakeryId}
          AND status = 'pending'
        RETURNING ${PAYMENT_COLS}`,
  )
  return result.rows[0] ?? null
}
