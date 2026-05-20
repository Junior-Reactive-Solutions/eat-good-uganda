/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import {
  getPaymentByProviderRefUnscoped,
  pool,
  recordWebhookDelivery,
} from '@eatgood/db'
import type { Database } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'

import { logger } from '../../lib/logger'
import { checkPaymentStatus } from '../../services/payment/status'

export const mtnMomoWebhookRouter = createRouter() as Router

const PROVIDER = 'mtn_momo'

/**
 * Resolve the DB handle attached by the request pipeline, falling back to the
 * shared pool. Keeps tests able to inject a stub `req.db` while production
 * code uses the application-wide pool.
 */
function getDb(req: Request): Database {
  return ((req as any).db as Database | undefined) ?? pool
}

/**
 * Extract the MoMo reference id from the request. MTN sends the reference in
 * the `X-Reference-Id` header (preferred); some configurations only echo it in
 * the JSON body as `referenceId`. We accept either, header first.
 */
function extractReferenceId(req: Request): string | null {
  const header = req.headers['x-reference-id']
  if (typeof header === 'string' && header.length > 0) {
    return header
  }
  if (Array.isArray(header) && header.length > 0 && header[0]) {
    return header[0]
  }
  const body = req.body as unknown
  if (typeof body === 'object' && body !== null) {
    const ref = (body as Record<string, unknown>)['referenceId']
    if (typeof ref === 'string' && ref.length > 0) {
      return ref
    }
  }
  return null
}

/**
 * Coerce the parsed JSON body into a plain object suitable for forensic
 * storage. Anything that isn't an object (empty body, array, string) is
 * stored as null — we never persist arbitrary scalars.
 */
function rawBodyForStorage(req: Request): Record<string, unknown> | null {
  const body = req.body as unknown
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  return null
}

/**
 * POST /v1/webhooks/mtn-momo
 *
 * Inbound callback from MTN MoMo when a collection settles or fails. The
 * webhook body is treated as a NOTIFICATION ONLY — never as ground truth. We
 * always cross-verify the real state with the provider before mutating any of
 * our own rows, which defeats spoofed/replayed callbacks.
 *
 * Flow:
 *   1. Extract referenceId (X-Reference-Id header preferred, body fallback).
 *   2. Missing reference → log + 200 (MoMo retries; nothing to do).
 *   3. Load the payment by provider_reference (unscoped — the webhook has no
 *      session, and the reference is an unguessable UUID that already
 *      identifies the tenant).
 *   4. No matching payment → log (bad/forged reference) + 200.
 *   5. Read bakery_id off the payment row (NEVER trust a body-supplied one).
 *   6-9. Delegate to `checkPaymentStatus()`, which loads the bakery's MoMo
 *      credentials, calls `getRequestStatus(referenceId)` to cross-verify, and
 *      persists the resulting terminal state (payment → paid/failed, and on
 *      success order → confirmed). Reusing that service keeps the
 *      verification + state-machine logic in one place.
 *   11. Record the delivery in `webhook_deliveries` for forensics.
 *   12. Always respond 200 — even on error — within the provider's timeout.
 *
 * Security:
 *   - Returns 200 to EVERY caller, including on internal failure, so MoMo
 *     never learns whether a reference exists or what went wrong.
 *   - Never logs or echoes credential plaintext, tokens, or provider bodies.
 *     `checkPaymentStatus` already redacts those; we only ever log the
 *     reference id and a short outcome string.
 */
mtnMomoWebhookRouter.post('/', async (req: Request, res: Response) => {
  // 1-2. We need a reference to do anything. If it's absent, acknowledge and
  // let MoMo retry — there's nothing actionable here.
  const referenceId = extractReferenceId(req)
  if (!referenceId) {
    logger.warn(
      { provider: PROVIDER },
      'MoMo webhook received without a reference id',
    )
    return res.status(200).json({ received: true })
  }

  const db = getDb(req)
  const rawBody = rawBodyForStorage(req)

  try {
    // 3. Resolve the payment from the reference. This is the only place we
    //    query a tenant-scoped table without a bakery filter; see the query's
    //    docstring for why that's safe for an unauthenticated webhook.
    const payment = await getPaymentByProviderRefUnscoped(
      db,
      PROVIDER,
      referenceId,
    )

    // 4. Unknown reference — could be stale, forged, or for another
    //    environment. Record it for forensics and acknowledge silently.
    if (!payment) {
      logger.warn(
        { provider: PROVIDER, referenceId },
        'MoMo webhook for unknown payment reference',
      )
      await safeRecordDelivery(db, {
        provider: PROVIDER,
        externalReference: referenceId,
        rawBody,
        processed: true,
        processingError: 'payment_not_found',
      })
      return res.status(200).json({ received: true })
    }

    // 5. The tenant comes from OUR row, never from the request body.
    const bakeryId = payment.bakery_id

    // 6-10. Cross-verify with the provider and persist any terminal
    //        transition. checkPaymentStatus short-circuits already-settled
    //        rows (so concurrent/duplicate webhooks are idempotent), and only
    //        calls MTN for rows still pending/initiated.
    let outcome = 'pending'
    let processingError: string | null = null
    try {
      const status = await checkPaymentStatus(db, bakeryId, payment.id)
      outcome = status.status
    } catch (err) {
      // A verification failure must not turn into a non-200 response. Capture
      // a short, log-safe marker for forensics and move on.
      processingError = 'verification_failed'
      logger.error(
        {
          provider: PROVIDER,
          referenceId,
          error: err instanceof Error ? err.message : String(err),
        },
        'MoMo webhook cross-verification failed',
      )
    }

    // 11. Record the delivery for forensics regardless of outcome.
    await safeRecordDelivery(db, {
      provider: PROVIDER,
      bakeryId,
      externalReference: referenceId,
      rawBody,
      processed: true,
      processingError,
    })

    logger.info(
      { provider: PROVIDER, referenceId, outcome },
      'MoMo webhook processed',
    )

    // 12. Always 200.
    return res.status(200).json({ received: true })
  } catch (err) {
    // Catch-all: any unexpected error (DB down, etc.) must still ack with 200
    // so MoMo doesn't hammer us with retries on a problem we can't fix
    // synchronously. Log for ops; never expose internals to the caller.
    logger.error(
      {
        provider: PROVIDER,
        referenceId,
        error: err instanceof Error ? err.message : String(err),
      },
      'MoMo webhook handler error',
    )
    return res.status(200).json({ received: true })
  }
})

/**
 * Insert a webhook-delivery row, swallowing any error. Recording is a
 * forensic best-effort; it must never break the 200 contract or surface a DB
 * error to the provider.
 */
async function safeRecordDelivery(
  db: Database,
  input: Parameters<typeof recordWebhookDelivery>[1],
): Promise<void> {
  try {
    await recordWebhookDelivery(db, input)
  } catch (err) {
    logger.error(
      {
        provider: input.provider,
        error: err instanceof Error ? err.message : String(err),
      },
      'Failed to record MoMo webhook delivery',
    )
  }
}
