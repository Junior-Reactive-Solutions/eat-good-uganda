import { pool } from '@eatgood/db'
import cron from 'node-cron'

import { logger } from '../lib/logger'

import { reconcilePendingPayments } from './reconcilePendingPayments'

/** Every 15 minutes, on the quarter hour. */
const RECONCILE_SCHEDULE = '*/15 * * * *'

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
}
