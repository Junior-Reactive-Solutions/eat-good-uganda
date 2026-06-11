import {
  createPayment,
  getBakeryById,
  getPaymentByProviderRef,
  query,
  sql,
  updatePaymentStatus,
} from '@eatgood/db'
import type { Database } from '@eatgood/db'
import type { Payment } from '@eatgood/shared'
import { normalizeUgandaPhone } from '@eatgood/shared'

import { loadBakeryMomoCredentials } from './credentials'
import {
  MomoClient,
  MomoPaymentError,
  MomoTokenError,
  newMomoProviderReference,
} from './providers/momo'
import { AirtelClient, AirtelPaymentError, newAirtelProviderReference } from './providers/airtel'
import { initiateCodPayment } from './providers/cod'
import { initiateBankTransferPayment } from './providers/bank-transfer'

/**
 * Inputs for {@link initiateMomoPayment}. The caller is responsible for
 * authentication and authorisation (e.g. confirming the customer owns the
 * order) — this service only handles the payment-side concerns once an order
 * is known to be payable.
 */
export interface InitiateMomoPaymentInput {
  orderId: string
  bakeryId: string
  /** Amount in minor units (e.g. 10000 for UGX 10,000). Must be a positive integer. */
  amountMinor: number
  /** ISO-4217 currency code. Only 'UGX' is currently supported by the MoMo provider. */
  currencyCode: string
  /** Payer MSISDN in any accepted Ugandan format — normalised internally. */
  payerPhone: string
  /**
   * Optional client-supplied key to make this call idempotent. If the same
   * key is reused with the same orderId/bakeryId, the same paymentId is
   * returned without contacting the provider a second time.
   */
  idempotencyKey?: string
}

export interface InitiateMomoPaymentResult {
  paymentId: string
  status: 'pending' | 'failed'
  pollUrl?: string
  error?: string
}

/** Strict regex matching the normalised E.164 Ugandan MSISDN we accept. */
const NORMALISED_UG_PHONE_RE = /^\+256\d{9}$/

/** ISO-4217 codes supported for MoMo collections. MTN UG only supports UGX. */
const SUPPORTED_CURRENCIES = new Set(['UGX'])

/** Stable, user-facing reasons we surface in the `error` field. */
const USER_FACING_ERRORS = {
  INVALID_AMOUNT: 'Invalid payment amount',
  INVALID_CURRENCY: 'Unsupported currency',
  INVALID_PHONE: 'Invalid phone number',
  BAKERY_NOT_FOUND: 'Bakery not found',
  NOT_CONFIGURED: 'MoMo not configured',
  PROVIDER_FAILED: 'Payment could not be initiated',
} as const

/**
 * Look up an existing payment by idempotency key for a given bakery+order.
 *
 * The idempotency key is stored in `payments.external_reference`. The
 * combination (bakery_id, order_id, external_reference) uniquely identifies
 * a prior attempt — a second call with the same key never re-charges the
 * customer, it just echoes the prior paymentId and status back.
 */
async function findExistingPaymentByIdempotencyKey(
  db: Database,
  bakeryId: string,
  orderId: string,
  idempotencyKey: string,
): Promise<Payment | null> {
  const result = await query<Payment>(
    db,
    sql`SELECT id, order_id, bakery_id, method, amount_minor, currency_code,
               status, provider_reference, external_reference, payer_phone,
               bank_proof_url, failure_reason, webhook_payload,
               initiated_at, paid_at, failed_at, created_at, updated_at
        FROM payments
        WHERE bakery_id = ${bakeryId}
          AND order_id = ${orderId}
          AND external_reference = ${idempotencyKey}
          AND method = 'mtn_momo'
        ORDER BY created_at DESC
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

/**
 * Map a previously-stored payment row to a result shape. Used by the
 * idempotency short-circuit so repeat callers get the same answer.
 */
function resultFromExistingPayment(payment: Payment): InitiateMomoPaymentResult {
  if (payment.status === 'pending' || payment.status === 'initiated') {
    return {
      paymentId: payment.id,
      status: 'pending',
      pollUrl: `/v1/customer/orders/${payment.order_id}/payment-status`,
    }
  }
  if (payment.status === 'failed' || payment.status === 'cancelled') {
    const result: InitiateMomoPaymentResult = {
      paymentId: payment.id,
      status: 'failed',
    }
    if (payment.failure_reason !== null && payment.failure_reason.length > 0) {
      result.error = payment.failure_reason
    } else {
      result.error = USER_FACING_ERRORS.PROVIDER_FAILED
    }
    return result
  }
  // paid / refunded / awaiting_* → treat as a settled (non-failed) outcome.
  // The caller should re-read the payment via the status endpoint to learn
  // the precise state; we report 'pending' here so the client polls.
  return {
    paymentId: payment.id,
    status: 'pending',
    pollUrl: `/v1/customer/orders/${payment.order_id}/payment-status`,
  }
}

/**
 * Best-effort guard that the same providerReference isn't already in use for
 * a different payment. `randomUUID()` collisions are astronomically unlikely
 * but the unique index on (method, provider_reference) would surface them
 * as a DB error — checking up front lets us regenerate cleanly instead.
 */
async function generateUniqueProviderReference(
  db: Database,
  bakeryId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = newMomoProviderReference()
    const existing = await getPaymentByProviderRef(db, bakeryId, 'mtn_momo', candidate)
    if (!existing) return candidate
  }
  // After three attempts we accept the last fresh UUID — the chance of three
  // collisions in a row is effectively zero, but throwing here would be
  // worse than letting the DB unique-index handle it.
  return newMomoProviderReference()
}

/**
 * Convert a thrown provider error into a stable, user-safe message. We
 * deliberately do NOT echo provider error bodies (they can include payer
 * detail) and we never include credential material.
 */
function userFacingProviderError(err: unknown): string {
  if (err instanceof MomoTokenError || err instanceof MomoPaymentError) {
    // The MomoClient already strips credential material from its errors;
    // surface its short category-style message verbatim.
    return err.message
  }
  return USER_FACING_ERRORS.PROVIDER_FAILED
}

/**
 * Initiate an MTN MoMo collection for an order.
 *
 * Flow:
 *   1. Validate input (amount > 0, supported currency, valid UG phone).
 *   2. Idempotency short-circuit: reuse prior payment for the same key.
 *   3. Confirm bakery exists.
 *   4. Load decrypted MoMo credentials (returns gracefully if missing).
 *   5. Insert a payments row in `initiated` state.
 *   6. Submit request-to-pay to MTN.
 *   7. On success: flip payment → 'pending' and return a poll URL.
 *      On failure: flip payment → 'failed' with the categorised reason.
 *
 * NEVER logs credential plaintext, JWTs, or full provider bodies. The
 * caller is responsible for not echoing the `error` field verbatim to
 * untrusted clients (it is safe by construction here, but defence in depth).
 */
export async function initiateMomoPayment(
  db: Database,
  input: InitiateMomoPaymentInput,
): Promise<InitiateMomoPaymentResult> {
  // 1. Validate amount.
  if (
    !Number.isInteger(input.amountMinor) ||
    input.amountMinor <= 0 ||
    input.amountMinor > Number.MAX_SAFE_INTEGER
  ) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_AMOUNT,
    }
  }

  // 1b. Validate currency.
  if (!SUPPORTED_CURRENCIES.has(input.currencyCode)) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_CURRENCY,
    }
  }

  // 1c. Validate + normalise phone. The MoMo provider expects digits only,
  // but we store and report the canonical "+256XXXXXXXXX" form.
  let normalisedPhone: string
  try {
    normalisedPhone = normalizeUgandaPhone(input.payerPhone)
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_PHONE,
    }
  }
  if (!NORMALISED_UG_PHONE_RE.test(normalisedPhone)) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_PHONE,
    }
  }

  // 2. Idempotency: if the caller supplied a key and we already have a
  // payment for it, echo the prior outcome without contacting MTN again.
  if (input.idempotencyKey !== undefined && input.idempotencyKey.length > 0) {
    const existing = await findExistingPaymentByIdempotencyKey(
      db,
      input.bakeryId,
      input.orderId,
      input.idempotencyKey,
    )
    if (existing) {
      return resultFromExistingPayment(existing)
    }
  }

  // 3. Verify bakery exists. We deliberately do this AFTER input validation
  // so callers don't probe for valid bakery IDs by submitting junk amounts.
  const bakery = await getBakeryById(db, input.bakeryId)
  if (!bakery) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.BAKERY_NOT_FOUND,
    }
  }

  // 4. Load encrypted credentials. If the bakery hasn't configured MoMo, we
  // bail out before creating any payment row — there's nothing to attempt.
  let credentials: Awaited<ReturnType<typeof loadBakeryMomoCredentials>>
  try {
    credentials = await loadBakeryMomoCredentials(db, input.bakeryId)
  } catch {
    // Decryption or DB failure — surface a stable error and do NOT include
    // the underlying message (it may contain key/AAD detail).
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.NOT_CONFIGURED,
    }
  }
  if (!credentials) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.NOT_CONFIGURED,
    }
  }

  // 5. Reserve a provider reference and create the payment row in
  // 'initiated' state. We persist the idempotency key as
  // external_reference so subsequent retries can find it.
  const providerReference = await generateUniqueProviderReference(db, input.bakeryId)

  let payment: Payment
  try {
    payment = await createPayment(db, input.bakeryId, {
      order_id: input.orderId,
      method: 'mtn_momo',
      amount_minor: input.amountMinor,
      currency_code: input.currencyCode,
      payer_phone: normalisedPhone,
      external_reference: input.idempotencyKey ?? null,
    })
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // Persist the provider reference now so a webhook arriving mid-flight can
  // still match the payment row. We don't change status yet — that only
  // moves to 'pending' once MTN accepts the request.
  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'initiated',
      provider_reference: providerReference,
    })
  } catch {
    // If we can't even update our own row, treat this as a provider failure
    // for the caller's purposes; the row stays in 'initiated' state and the
    // reconciliation job will sweep it.
    return {
      paymentId: payment.id,
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // 6. Submit to MTN. The MomoClient is constructed with the plaintext
  // credentials in this scope only — we never log them and the variable
  // falls out of scope at function return.
  const client = new MomoClient(credentials)
  try {
    await client.requestToPay(providerReference, {
      amount: String(input.amountMinor),
      currency: 'UGX',
      externalId: payment.id,
      payerMsisdn: normalisedPhone,
      payerMessage: `Payment for order ${input.orderId}`,
      payeeNote: `Order ${input.orderId}`,
    })
  } catch (err) {
    const reason = userFacingProviderError(err)
    try {
      await updatePaymentStatus(db, input.bakeryId, payment.id, {
        status: 'failed',
        failure_reason: reason,
      })
    } catch {
      // Swallow — we already have the user-facing error to return.
    }
    return {
      paymentId: payment.id,
      status: 'failed',
      error: reason,
    }
  }

  // 7. Provider accepted the request. Move to 'pending' and return the URL
  // the client should poll for the eventual outcome.
  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'pending',
    })
  } catch {
    // The provider has already accepted the request, so don't fail the
    // caller — the reconciliation job will catch any rows stuck in
    // 'initiated'. We still return success here because from the customer's
    // perspective the payment is in flight.
  }

  return {
    paymentId: payment.id,
    status: 'pending',
    pollUrl: `/v1/customer/orders/${input.orderId}/payment-status`,
  }
}

/**
 * Inputs for initiating a payment of any type (MoMo, Airtel, COD, Bank Transfer).
 */
export interface InitiatePaymentInput {
  orderId: string
  bakeryId: string
  amountMinor: number
  currencyCode: string
  method: 'mtn_momo' | 'airtel_money' | 'cash_on_delivery' | 'bank_transfer'
  payerPhone?: string
  idempotencyKey?: string
}

export interface InitiatePaymentResult {
  paymentId: string
  status: 'pending' | 'initiated' | 'awaiting_proof' | 'failed'
  pollUrl?: string
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    branchCode?: string
    swiftCode?: string
  }
  referenceCode?: string
  instructions?: string
  message?: string
  error?: string
}

/**
 * Generic payment initiation that dispatches to the appropriate provider.
 */
export async function initiatePayment(
  db: Database,
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  switch (input.method) {
    case 'mtn_momo':
      if (!input.payerPhone) {
        return {
          paymentId: '',
          status: 'failed',
          error: 'Phone number required for MoMo',
        }
      }
      return initiateMomoPayment(db, {
        orderId: input.orderId,
        bakeryId: input.bakeryId,
        amountMinor: input.amountMinor,
        currencyCode: input.currencyCode,
        payerPhone: input.payerPhone,
        ...(input.idempotencyKey && { idempotencyKey: input.idempotencyKey }),
      })

    case 'airtel_money':
      if (!input.payerPhone) {
        return {
          paymentId: '',
          status: 'failed',
          error: 'Phone number required for Airtel Money',
        }
      }
      return initiateAirtelPayment(db, {
        orderId: input.orderId,
        bakeryId: input.bakeryId,
        amountMinor: input.amountMinor,
        currencyCode: input.currencyCode,
        payerPhone: input.payerPhone,
        ...(input.idempotencyKey && { idempotencyKey: input.idempotencyKey }),
      })

    case 'cash_on_delivery':
      return initiateCodPaymentFlow(db, {
        orderId: input.orderId,
        bakeryId: input.bakeryId,
        amountMinor: input.amountMinor,
      })

    case 'bank_transfer':
      return initiateBankTransferFlow(db, {
        orderId: input.orderId,
        bakeryId: input.bakeryId,
        amountMinor: input.amountMinor,
        currencyCode: input.currencyCode,
      })

    default:
      return {
        paymentId: '',
        status: 'failed',
        error: 'Unsupported payment method',
      }
  }
}

/**
 * Airtel Money payment initiation.
 */
export interface InitiateAirtelPaymentInput {
  orderId: string
  bakeryId: string
  amountMinor: number
  currencyCode: string
  payerPhone: string
  idempotencyKey?: string
}

async function initiateAirtelPayment(
  db: Database,
  input: InitiateAirtelPaymentInput,
): Promise<InitiatePaymentResult> {
  // Validate amount
  if (
    !Number.isInteger(input.amountMinor) ||
    input.amountMinor <= 0 ||
    input.amountMinor > Number.MAX_SAFE_INTEGER
  ) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_AMOUNT,
    }
  }

  // Validate currency
  if (!SUPPORTED_CURRENCIES.has(input.currencyCode)) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_CURRENCY,
    }
  }

  // Validate + normalise phone
  let normalisedPhone: string
  try {
    normalisedPhone = normalizeUgandaPhone(input.payerPhone)
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.INVALID_PHONE,
    }
  }

  // Verify bakery exists
  const bakery = await getBakeryById(db, input.bakeryId)
  if (!bakery) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.BAKERY_NOT_FOUND,
    }
  }

  // Create payment row
  let payment: Payment
  try {
    payment = await createPayment(db, input.bakeryId, {
      order_id: input.orderId,
      method: 'airtel_money',
      amount_minor: input.amountMinor,
      currency_code: input.currencyCode,
      payer_phone: normalisedPhone,
      external_reference: input.idempotencyKey ?? null,
    })
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // Generate provider reference
  const providerReference = newAirtelProviderReference()

  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'initiated',
      provider_reference: providerReference,
    })
  } catch {
    return {
      paymentId: payment.id,
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // Initiate with Airtel (would use credentials from DB in production)
  // For now, mock successful initiation
  try {
    const client = new AirtelClient(
      process.env.AIRTEL_SANDBOX_CLIENT_ID || '',
      process.env.AIRTEL_SANDBOX_CLIENT_SECRET || '',
      'staging',
      'UG',
    )

    await client.requestToPay({
      amount: String(input.amountMinor),
      currency: 'UGX',
      externalId: payment.id,
      payerPhone: normalisedPhone,
      payerMessage: `Payment for order ${input.orderId}`,
      payeeNote: `Order ${input.orderId}`,
    })
  } catch (err) {
    const reason = err instanceof AirtelPaymentError ? err.message : 'Payment failed'
    try {
      await updatePaymentStatus(db, input.bakeryId, payment.id, {
        status: 'failed',
        failure_reason: reason,
      })
    } catch {
      // Swallow
    }
    return {
      paymentId: payment.id,
      status: 'failed',
      error: reason,
    }
  }

  // Mark as pending
  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'pending',
    })
  } catch {
    // Swallow — already submitted to provider
  }

  return {
    paymentId: payment.id,
    status: 'pending',
    pollUrl: `/v1/customer/orders/${input.orderId}/payment-status`,
  }
}

/**
 * Cash on Delivery payment flow.
 */
async function initiateCodPaymentFlow(
  db: Database,
  input: { orderId: string; bakeryId: string; amountMinor: number },
): Promise<InitiatePaymentResult> {
  const bakery = await getBakeryById(db, input.bakeryId)
  if (!bakery) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.BAKERY_NOT_FOUND,
    }
  }

  let payment: Payment
  try {
    payment = await createPayment(db, input.bakeryId, {
      order_id: input.orderId,
      method: 'cash_on_delivery',
      amount_minor: input.amountMinor,
      currency_code: 'UGX',
    })
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // Mark as initiated
  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'initiated',
    })
  } catch {
    // Swallow
  }

  const result = initiateCodPayment(input, payment.id)
  return {
    paymentId: result.paymentId,
    status: result.status,
    message: result.message,
  }
}

/**
 * Bank Transfer payment flow.
 */
async function initiateBankTransferFlow(
  db: Database,
  input: { orderId: string; bakeryId: string; amountMinor: number; currencyCode: string },
): Promise<InitiatePaymentResult> {
  const bakery = await getBakeryById(db, input.bakeryId)
  if (!bakery) {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.BAKERY_NOT_FOUND,
    }
  }

  let payment: Payment
  try {
    payment = await createPayment(db, input.bakeryId, {
      order_id: input.orderId,
      method: 'bank_transfer',
      amount_minor: input.amountMinor,
      currency_code: input.currencyCode,
    })
  } catch {
    return {
      paymentId: '',
      status: 'failed',
      error: USER_FACING_ERRORS.PROVIDER_FAILED,
    }
  }

  // Mark as awaiting proof
  try {
    await updatePaymentStatus(db, input.bakeryId, payment.id, {
      status: 'awaiting_proof',
    })
  } catch {
    // Swallow
  }

  const result = initiateBankTransferPayment(input, payment.id)
  return {
    paymentId: result.paymentId,
    status: result.status,
    bankDetails: result.bankDetails,
    referenceCode: result.referenceCode,
    instructions: result.instructions,
  }
}
