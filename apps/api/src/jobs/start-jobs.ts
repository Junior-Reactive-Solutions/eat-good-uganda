import { pool } from '@eatgood/db'
import cron from 'node-cron'

import { logger } from '../lib/logger'

import { cleanupExpiredTokens } from './cleanupExpiredTokens'
import { reconcilePendingPayments } from './reconcilePendingPayments'
import { sendWeeklyDigests } from './sendWeeklyDigests'

/** Every 15 minutes: reconcile stuck pending payments. */
const RECONCILE_SCHEDULE = '*/15 * * * *'

/** Every 6 hours: clean up expired tokens. */
const CLEANUP_SCHEDULE = '0 */6 * * *'

/** Every Sunday at 9am Africa/Kampala: send weekly digests. */
const DIGEST_SCHEDULE = '0 9 * * 0'

/**
 * Register all background jobs. Called once from `server.ts` at process start
 * (NOT from `app.ts`, which is imported by the test suite via supertest —
 * scheduling timers there would leave dangling cron handles in every test run).
 *
 * Every scheduled callback wraps its work in try/catch and logs failures rather
 * than throwing: an unhandled rejection in a cron tick would otherwise take
 * down the API process. A failed sweep is fine — the next tick retries.
 */
export function startJobs(): void {
  // Reconcile pending payments every 15 minutes
  cron.schedule(RECONCILE_SCHEDULE, () => {
    void reconcilePendingPayments(pool).catch((error: unknown) => {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Reconciliation job failed',
      )
    })
  })
  logger.info(
    { schedule: RECONCILE_SCHEDULE },
    'registered pending-payment reconciliation job',
  )

  // Clean up expired tokens every 6 hours
  cron.schedule(CLEANUP_SCHEDULE, () => {
    void cleanupExpiredTokens(pool).catch((error: unknown) => {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Token cleanup job failed',
      )
    })
  })
  logger.info(
    { schedule: CLEANUP_SCHEDULE },
    'registered token cleanup job',
  )

  // Send weekly digests every Sunday at 9am Africa/Kampala
  cron.schedule(DIGEST_SCHEDULE, () => {
    void sendWeeklyDigests(pool).catch((error: unknown) => {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Weekly digest job failed',
      )
    })
  }, { timezone: 'Africa/Kampala' })
  logger.info(
    { schedule: DIGEST_SCHEDULE, timezone: 'Africa/Kampala' },
    'registered weekly digest job',
  )
}
