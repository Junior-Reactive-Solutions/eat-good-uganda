import {
  getPaymentById,
  updateOrderStatus,
  updatePaymentStatus,
} from '@eatgood/db'
import type { Database } from '@eatgood/db'

import { loadBakeryMomoCredentials } from './credentials'
import { MomoClient } from './providers/momo'

/**
 * The three terminal-ish states a payment can present to a caller asking
 * "what happened to this payment?". `pending` is an in-flight state — the
 * provider hasn't told us yet. `paid` carries MTN's settled-side transaction
 * id for reconciliation. `failed` carries a short, log-safe reason.
 *
 * We deliberately collapse a few internal statuses (`initiated`,
 * `awaiting_*`) into `pending` so the public surface is small and stable.
 */
export type PaymentStatusResult =
  | { status: 'pending' }
  | { status: 'paid'; financialTransactionId: string }
  | { status: 'failed'; reason: string }

/**
 * Thrown when the requested payment doesn't exist for the supplied bakery
 * (either it was never created, or it belongs to a different tenant).
 *
 * Carrying a dedicated class lets the HTTP layer translate it to a 404
 * without leaking internal "exists, wrong bakery" detail to the client —
 * both cases produce the same shape, by design.
 */
export class PaymentNotFoundError extends Error {
  override readonly name = 'PaymentNotFoundError'
  readonly statusCode = 404
  constructor(message = 'Payment not found') {
    super(message)
  }
}

/** Stable, user-facing reasons we surface in the `reason` field. */
const USER_FACING_REASONS = {
  PROVIDER_FAILED: 'Payment failed',
  UNKNOWN: 'Payment failed',
  NOT_CONFIGURED: 'MoMo not configured',
  MISSING_REFERENCE: 'Payment failed',
} as const

/**
 * Map an internal `payments.status` value to the public {@link PaymentStatusResult}.
 *
 * Used when we already know the payment is in a terminal state (either it
 * was already settled in the DB, or we just settled it via the provider).
 * For 'paid' rows we need MTN's `financialTransactionId` — when it isn't
 * available (e.g. webhook landed before we had it) we fall back to the
 * provider_reference which is always known by this point.
 */
function resolveTerminalStatus(
  status: string,
  providerReference: string | null,
  failureReason: string | null,
  financialTransactionId?: string,
): PaymentStatusResult {
  if (status === 'paid') {
    const txId =
      financialTransactionId !== undefined && financialTransactionId.length > 0
        ? financialTransactionId
        : (providerReference ?? '')
    return { status: 'paid', financialTransactionId: txId }
  }
  if (status === 'failed' || status === 'cancelled') {
    return {
      status: 'failed',
      reason:
        failureReason !== null && failureReason.length > 0
          ? failureReason
          : USER_FACING_REASONS.PROVIDER_FAILED,
    }
  }
  // Anything else (initiated, awaiting_*, refunded, etc.) — treat as in-flight
  // so the caller polls again. Refunded technically shouldn't surface here
  // since refunds happen post-settlement; if it does the client will see
  // 'pending' once and then the row won't move further, which is harmless.
  return { status: 'pending' }
}

/**
 * Resolve the current status of a MoMo payment for a given bakery+payment.
 *
 * Flow:
 *   1. Load the payment row scoped to the bakery (404 if missing or wrong tenant).
 *   2. If already resolved (paid/failed/cancelled/etc.), return the cached
 *      status without contacting MTN. This avoids an N+1 of pointless polls
 *      for already-settled payments.
 *   3. If still 'pending' (or 'initiated'), load decrypted credentials, build
 *      a {@link MomoClient}, and ask the provider for the current status.
 *   4. Map MTN's tri-state response back to our union:
 *      - 'success' → flip payment to 'paid' (sets paid_at) AND move the
 *        order to 'confirmed' so downstream fulfilment can pick it up.
 *      - 'failed'  → flip payment to 'failed' (sets failed_at) with reason.
 *      - 'pending' → leave the row untouched and return pending.
 *   5. Return the resolved view.
 *
 * NEVER logs, returns, or otherwise exposes credential plaintext, MTN bearer
 * tokens, or raw provider response bodies. Errors from the credential loader
 * are caught and surfaced as a stable "MoMo not configured" reason — the
 * underlying message could include AAD/key detail.
 *
 * Throws {@link PaymentNotFoundError} when the payment doesn't exist or
 * belongs to a different bakery (the two cases are deliberately
 * indistinguishable to the caller, to avoid leaking cross-tenant existence).
 */
export async function checkPaymentStatus(
  db: Database,
  bakeryId: string,
  paymentId: string,
): Promise<PaymentStatusResult> {
  // 1. Load payment scoped to the bakery. getPaymentById already filters by
  // bakery_id, so a cross-tenant probe returns null — same outcome as a
  // missing row.
  const payment = await getPaymentById(db, bakeryId, paymentId)
  if (!payment) {
    throw new PaymentNotFoundError()
  }

  // 2. If the row isn't in a 'pending'/'initiated' state, skip the provider
  // round-trip and return the cached view. This is the hot path for clients
  // that poll past resolution — we never spend a token + status call on a
  // payment we've already settled.
  if (payment.status !== 'pending' && payment.status !== 'initiated') {
    return resolveTerminalStatus(
      payment.status,
      payment.provider_reference,
      payment.failure_reason,
    )
  }

  // 2b. We need a provider_reference to ask MTN anything. If somehow the row
  // is pending without one (e.g. it crashed between createPayment and the
  // first updatePaymentStatus), there's nothing to poll for — return pending
  // so the reconciliation sweep can decide its fate.
  if (
    payment.provider_reference === null ||
    payment.provider_reference.length === 0
  ) {
    return { status: 'pending' }
  }

  // 3. Load decrypted credentials. The MomoClient is constructed with the
  // plaintext in this scope only — we never log it and the variable falls
  // out of scope at function return.
  let credentials: Awaited<ReturnType<typeof loadBakeryMomoCredentials>>
  try {
    credentials = await loadBakeryMomoCredentials(db, bakeryId)
  } catch {
    // Decryption or DB failure — surface a stable reason; do NOT include
    // the underlying message (it may carry key/AAD detail).
    return { status: 'failed', reason: USER_FACING_REASONS.NOT_CONFIGURED }
  }
  if (!credentials) {
    return { status: 'failed', reason: USER_FACING_REASONS.NOT_CONFIGURED }
  }

  // 4. Ask MTN. Any provider-side error (network/timeout/non-2xx) flows
  // through userFacingStatusError into a safe string — we never report the
  // raw response body.
  const client = new MomoClient(credentials)
  let providerStatus: Awaited<ReturnType<MomoClient['getRequestStatus']>>
  try {
    providerStatus = await client.getRequestStatus(payment.provider_reference)
  } catch (err) {
    // We leave the DB row in 'pending' state — a transient provider failure
    // shouldn't move us into a terminal state. The reconciliation sweep can
    // try again later. The caller still gets a definitive answer for *this*
    // request: still pending.
    void err
    return { status: 'pending' }
  }

  // 5. Map MTN's response and persist any terminal transition.
  if (providerStatus.status === 'success') {
    try {
      await updatePaymentStatus(db, bakeryId, paymentId, { status: 'paid' })
    } catch {
      // DB write failed — return the provider's truth anyway so the client
      // sees the right state. The reconciliation sweep will retry the DB
      // write next cycle.
    }

    // Move the order to 'confirmed'. This may legitimately fail (e.g. the
    // order was already cancelled) — we swallow that here because the
    // payment itself genuinely succeeded; resolving the order state is a
    // separate concern handled by the cancellation/refund flow.
    try {
      await updateOrderStatus(db, bakeryId, payment.order_id, 'confirmed')
    } catch {
      // Intentionally ignored — see comment above.
    }

    return {
      status: 'paid',
      financialTransactionId:
        providerStatus.financialTransactionId ?? payment.provider_reference,
    }
  }

  if (providerStatus.status === 'failed') {
    const reason =
      providerStatus.reason !== undefined && providerStatus.reason.length > 0
        ? providerStatus.reason
        : USER_FACING_REASONS.PROVIDER_FAILED
    try {
      await updatePaymentStatus(db, bakeryId, paymentId, {
        status: 'failed',
        failure_reason: reason,
      })
    } catch {
      // See note above — return the provider's truth even if the DB write
      // didn't land.
    }
    return { status: 'failed', reason }
  }

  // Provider still working — leave DB untouched, report pending.
  return { status: 'pending' }
}

// Re-export for callers who want to map errors at the HTTP boundary without
// importing the class through a deep relative path.
export { MomoStatusError } from './providers/momo'
