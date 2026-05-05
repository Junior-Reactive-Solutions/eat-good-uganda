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
