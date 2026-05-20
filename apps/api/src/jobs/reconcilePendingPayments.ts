import {
  listStuckPendingMomoPayments,
  markPaymentTimedOut,
} from '@eatgood/db'
import type { Database } from '@eatgood/db'

import { logger } from '../lib/logger'
import { checkPaymentStatus } from '../services/payment/status'

/**
 * A MoMo payment is "stuck" once it has been pending for longer than this and
 * we have not heard a definitive answer from the provider. At that point the
 * sweep starts actively re-polling MTN for it (the webhook may have been lost).
 */
const RESOLVE_AFTER_MINUTES = 30

/**
 * The hard ceiling. A payment that is still pending this long after initiation
 * is treated as dead — the payer almost certainly abandoned the USSD prompt, or
 * MTN never settled it. We fail it with a stable, log-safe reason so the order
 * can be released and the customer can retry, rather than leaving it pending
 * forever.
 *
 * 2 hours (the spec's hard timeout) is comfortably longer than MTN's own
 * collection request lifetime, so we won't fail anything the provider could
 * still legitimately settle.
 */
const TIMEOUT_AFTER_MINUTES = 120

/** Cap on rows pulled per sweep so a large backlog can't blow up a single run. */
const MAX_PER_SWEEP = 500

/** What a single sweep accomplished — returned for observability and tests. */
export interface ReconcileSummary {
  /** Rows inspected this sweep (pending mtn_momo, older than the resolve cutoff). */
  scanned: number
  /** Resolved by the provider this sweep (flipped to paid or failed). */
  resolved: number
  /** Still pending after re-polling — left for the next cycle. */
  stillPending: number
  /** Failed because they crossed the hard timeout without resolving. */
  timedOut: number
  /** Individual rows that threw while being processed (logged, not fatal). */
  errored: number
}

/**
 * Reconcile stuck pending MoMo payments.
 *
 * Runs every 15 minutes (see `start-jobs.ts`). MoMo settlement is normally
 * driven by the inbound webhook, but webhooks get lost, delayed, or never
 * delivered in sandbox. This sweep is the safety net that guarantees no payment
 * sits in 'pending' forever.
 *
 * Algorithm (single pass over the stuck set, so no N+1 across cycles):
 *   1. Pull every `mtn_momo` payment still 'pending' and older than
 *      {@link RESOLVE_AFTER_MINUTES}, across all tenants, oldest first. This is
 *      ONE query; the per-row work below is the only fan-out.
 *   2. For each row, scope all follow-up work to the row's own `bakery_id`
 *      (never a global/ambient tenant):
 *        a. If it has crossed {@link TIMEOUT_AFTER_MINUTES}, attempt to fail it
 *           via `markPaymentTimedOut`. That UPDATE is guarded by
 *           `status = 'pending'`, so if a webhook/status-check resolved it
 *           between our SELECT and now, the update matches nothing and we count
 *           it as resolved-by-someone-else instead of clobbering a paid row.
 *        b. Otherwise re-poll the provider via `checkPaymentStatus`, which
 *           cross-verifies with MTN and persists any terminal transition
 *           (idempotently — it short-circuits already-settled rows). A late
 *           webhook that already settled the row resolves here for free.
 *   3. Tally and log a single summary line for ops.
 *
 * Concurrency safety: two overlapping sweeps can both SELECT the same row, but
 * the actual state transition happens through `markPaymentTimedOut` (guarded by
 * `status = 'pending'`) and `updatePaymentStatus` inside `checkPaymentStatus`.
 * Whichever sweep wins the UPDATE moves the row; the loser's guarded UPDATE
 * matches zero rows. No row is double-failed and no paid row is reverted.
 *
 * NEVER logs credential plaintext, tokens, raw provider bodies, or PII. We log
 * only payment ids, a coarse outcome, and counts — `checkPaymentStatus` already
 * redacts everything sensitive, and we deliberately never log `payer_phone`.
 *
 * Per-row errors are caught and counted so one bad row can't abort the sweep;
 * a fatal error (e.g. the initial SELECT throws) propagates to the cron wrapper
 * in `start-jobs.ts`, which logs it without crashing the process.
 */
export async function reconcilePendingPayments(
  db: Database,
): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = {
    scanned: 0,
    resolved: 0,
    stillPending: 0,
    timedOut: 0,
    errored: 0,
  }

  // 1. Single query for the whole working set. Anything younger than the
  //    resolve cutoff isn't "stuck" yet and is left for the webhook.
  const stuck = await listStuckPendingMomoPayments(
    db,
    RESOLVE_AFTER_MINUTES,
    MAX_PER_SWEEP,
  )
  summary.scanned = stuck.length

  const timeoutCutoff = Date.now() - TIMEOUT_AFTER_MINUTES * 60_000

  for (const payment of stuck) {
    // 2. Scope every follow-up to the row's OWN tenant — never a shared one.
    const bakeryId = payment.bakery_id

    try {
      const initiatedMs = new Date(payment.initiated_at).getTime()
      const pastHardTimeout =
        Number.isFinite(initiatedMs) && initiatedMs < timeoutCutoff

      if (pastHardTimeout) {
        // 2a. Hard timeout. Try to fail it; the status='pending' guard means a
        //     row a webhook resolved in the meantime simply won't match.
        const failed = await markPaymentTimedOut(db, bakeryId, payment.id)
        if (failed) {
          summary.timedOut += 1
        } else {
          // Already moved off 'pending' by a concurrent webhook/status check.
          summary.resolved += 1
        }
        continue
      }

      // 2b. Within the window — re-poll the provider. This persists any
      //     terminal transition itself and is idempotent for settled rows.
      const status = await checkPaymentStatus(db, bakeryId, payment.id)
      if (status.status === 'pending') {
        summary.stillPending += 1
      } else {
        summary.resolved += 1
      }
    } catch (error) {
      // One row failing must not abort the sweep. Log id + message only.
      summary.errored += 1
      logger.error(
        {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'reconcile: failed to process pending payment',
      )
    }
  }

  // 3. One summary line for ops monitoring. Counts and the scanned total only —
  //    no per-row PII, no credentials.
  logger.info(
    {
      scanned: summary.scanned,
      resolved: summary.resolved,
      stillPending: summary.stillPending,
      timedOut: summary.timedOut,
      errored: summary.errored,
    },
    'reconcile: pending MoMo payment sweep complete',
  )

  return summary
}
