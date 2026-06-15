import { query, sql, type Database } from '@eatgood/db'

import { logger } from '../lib/logger'

/**
 * Summary of token cleanup operations in a single run.
 */
export interface TokenCleanupSummary {
  refreshTokensDeleted: number
  emailVerificationTokensDeleted: number
  passwordResetTokensDeleted: number
  totalDeleted: number
}

/**
 * Clean up all expired tokens from the database.
 *
 * Runs every 6 hours. Removes:
 * - Expired refresh tokens (revoked or beyond expires_at)
 * - Expired email verification tokens (unused and beyond expires_at)
 * - Expired password reset tokens (unused and beyond expires_at)
 *
 * NEVER logs credential plaintext, tokens, or PII. We log only counts and
 * timestamps — high-level operational metrics only.
 *
 * Per-table errors are caught and counted so one table failure doesn't abort
 * the whole cleanup job. A fatal error (e.g. initial SELECT throws) propagates
 * to the cron wrapper in `start-jobs.ts`, which logs it without crashing.
 */
export async function cleanupExpiredTokens(db: Database): Promise<TokenCleanupSummary> {
  const summary: TokenCleanupSummary = {
    refreshTokensDeleted: 0,
    emailVerificationTokensDeleted: 0,
    passwordResetTokensDeleted: 0,
    totalDeleted: 0,
  }

  try {
    // Delete expired refresh tokens (either revoked or past expiry)
    const refreshResult = await query<{ count: number }>(
      db,
      sql`DELETE FROM refresh_tokens
          WHERE revoked_at IS NOT NULL OR expires_at < now()
          RETURNING 1`,
    )
    summary.refreshTokensDeleted = refreshResult.rowCount ?? 0
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'cleanup: failed to delete expired refresh tokens',
    )
  }

  try {
    // Delete expired email verification tokens (unused and past expiry)
    const emailResult = await query<{ count: number }>(
      db,
      sql`DELETE FROM email_verification_tokens
          WHERE used_at IS NULL AND expires_at < now()
          RETURNING 1`,
    )
    summary.emailVerificationTokensDeleted = emailResult.rowCount ?? 0
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'cleanup: failed to delete expired email verification tokens',
    )
  }

  try {
    // Delete expired password reset tokens (unused and past expiry)
    const passwordResult = await query<{ count: number }>(
      db,
      sql`DELETE FROM password_reset_tokens
          WHERE used_at IS NULL AND expires_at < now()
          RETURNING 1`,
    )
    summary.passwordResetTokensDeleted = passwordResult.rowCount ?? 0
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'cleanup: failed to delete expired password reset tokens',
    )
  }

  summary.totalDeleted =
    summary.refreshTokensDeleted +
    summary.emailVerificationTokensDeleted +
    summary.passwordResetTokensDeleted

  // Log summary for operations monitoring
  logger.info(
    {
      refreshTokensDeleted: summary.refreshTokensDeleted,
      emailVerificationTokensDeleted: summary.emailVerificationTokensDeleted,
      passwordResetTokensDeleted: summary.passwordResetTokensDeleted,
      totalDeleted: summary.totalDeleted,
    },
    'cleanup: expired token cleanup complete',
  )

  return summary
}
