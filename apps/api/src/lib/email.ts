import {
  pool,
  insertEmailLog,
  markEmailSent,
  markEmailFailed,
  idempotencyKeyExists,
  getRetryableEmails,
} from '@eatgood/db'
import { renderEmail } from '@eatgood/shared'
import type { TemplateName } from '@eatgood/shared'
import { Resend } from 'resend'

import { env } from '../env'

import { logger } from './logger'

// The Resend constructor throws on an empty key, so only construct it when a real
// key is configured. Local dev runs with RESEND_API_KEY='' and sendEmail()/
// retryFailedEmails() skip the network call entirely in that case.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

/** Throws if called without a configured Resend client; callers guard on RESEND_API_KEY first. */
function requireResend(): Resend {
  if (!resend) {
    throw new Error('Resend client not configured (RESEND_API_KEY missing)')
  }
  return resend
}

// Bakery-facing emails use a different From address
const BAKERY_TEMPLATES = new Set<TemplateName>([
  'bakery-verify-email',
  'bakery-approved',
  'bakery-rejected',
  'bakery-staff-invite',
  'bakery-new-order',
  'bakery-bank-proof',
  'bakery-order-cancelled',
  'bakery-weekly-digest',
])

function fromAddress(template: TemplateName): string {
  return BAKERY_TEMPLATES.has(template) ? 'orders@eatgooduganda.com' : env.RESEND_FROM_EMAIL
}

export interface SendEmailOptions {
  to: string
  template: TemplateName
  data: Record<string, unknown>
  idempotencyKey: string
  bakeryId?: string
}

/**
 * Send a transactional email via Resend.
 *
 * - Checks idempotency key first; skips if the email was already sent.
 * - Inserts a row into email_log before attempting the send.
 * - Records the Resend message ID on success, error message on failure.
 * - Never throws; failures are logged and stored for retry.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const { to, template, data, idempotencyKey, bakeryId } = opts

  // Idempotency guard
  const alreadySent = await idempotencyKeyExists(pool, idempotencyKey)
  if (alreadySent) {
    logger.debug({ idempotencyKey, template, to }, 'email skipped — idempotency key exists')
    return
  }

  const rendered = renderEmail(template, data)

  const log = await insertEmailLog(pool, {
    ...(bakeryId !== undefined ? { bakery_id: bakeryId } : {}),
    recipient_email: to,
    subject: rendered.subject,
    template_key: template,
    idempotency_key: idempotencyKey,
    status: 'queued',
  })

  try {
    if (!env.RESEND_API_KEY) {
      await markEmailSent(pool, log.id, 'dev-skipped-no-api-key')
      logger.info({ template, to }, 'RESEND_API_KEY not set — skipping actual send (dev mode)')
      return
    }

    const result = await requireResend().emails.send({
      from: fromAddress(template),
      to,
      replyTo: env.RESEND_REPLY_TO,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    const resendId = result.data.id
    await markEmailSent(pool, log.id, resendId)
    logger.info({ template, to, resendId }, 'email sent')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markEmailFailed(pool, log.id, message)
    logger.error({ template, to, idempotencyKey, err: message }, 'email send failed')
  }
}

/**
 * Retry up to 50 emails that failed and have fewer than 3 attempts.
 * Called every 15 minutes by the keepalive cron.
 */
export async function retryFailedEmails(): Promise<void> {
  if (!env.RESEND_API_KEY) return

  const rows = await getRetryableEmails(pool)
  if (rows.length === 0) return

  logger.info({ count: rows.length }, 'retrying failed emails')

  for (const row of rows) {
    // Re-render is not possible without original data; re-send using stored template_key.
    // We call Resend directly rather than sendEmail() to avoid inserting a second log row.
    try {
      const result = await requireResend().emails.send({
        from: fromAddress(row.template_key as TemplateName),
        to: row.recipient_email,
        replyTo: env.RESEND_REPLY_TO,
        subject: row.subject,
        html: `<p>This is a retry for a previously failed email. Please check your order status at ${env.PUBLIC_CUSTOMER_URL}</p>`,
        text: `Please check your order status at ${env.PUBLIC_CUSTOMER_URL}`,
      })

      if (result.error) throw new Error(result.error.message)

      const resendId = result.data.id
      await markEmailSent(pool, row.id, resendId)
      logger.info({ emailLogId: row.id, template: row.template_key }, 'retry succeeded')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await markEmailFailed(pool, row.id, message)
      logger.warn({ emailLogId: row.id, err: message }, 'retry failed')
    }
  }
}
