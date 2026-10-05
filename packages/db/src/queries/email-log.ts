import type { Database } from '../client'
import { query } from '../client'
import { sql } from '../sql'

export type EmailLogStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'

export type EmailLogRow = {
  id: string
  bakery_id: string | null
  recipient_email: string
  subject: string
  template_key: string
  idempotency_key: string
  provider_message_id: string | null
  status: EmailLogStatus
  error_message: string | null
  attempt_count: number
  created_at: Date
  updated_at: Date
}

export type InsertEmailLogInput = {
  bakery_id?: string
  recipient_email: string
  subject: string
  template_key: string
  idempotency_key: string
  status?: EmailLogStatus
}

export async function insertEmailLog(
  db: Database,
  input: InsertEmailLogInput,
): Promise<EmailLogRow> {
  const result = await query<EmailLogRow>(
    db,
    sql`INSERT INTO email_log
          (bakery_id, recipient_email, subject, template_key, idempotency_key, status)
        VALUES
          (${input.bakery_id ?? null}, ${input.recipient_email}, ${input.subject},
           ${input.template_key}, ${input.idempotency_key}, ${input.status ?? 'queued'})
        RETURNING *`,
  )
  const row = result.rows[0]
  if (!row) throw new Error('insertEmailLog: no row returned')
  return row
}

export async function markEmailSent(
  db: Database,
  id: string,
  providerMessageId: string,
): Promise<void> {
  await query(
    db,
    sql`UPDATE email_log
        SET status = 'sent', provider_message_id = ${providerMessageId},
            attempt_count = attempt_count + 1
        WHERE id = ${id}`,
  )
}

export async function markEmailFailed(
  db: Database,
  id: string,
  errorMessage: string,
): Promise<void> {
  await query(
    db,
    sql`UPDATE email_log
        SET status = 'failed', error_message = ${errorMessage},
            attempt_count = attempt_count + 1
        WHERE id = ${id}`,
  )
}

export async function idempotencyKeyExists(db: Database, idempotencyKey: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    db,
    sql`SELECT EXISTS (
          SELECT 1 FROM email_log WHERE idempotency_key = ${idempotencyKey}
        ) AS exists`,
  )
  return result.rows[0]?.exists ?? false
}

/** Returns rows eligible for retry: failed with attempt_count < 3, updated > 15 min ago. */
export async function getRetryableEmails(db: Database): Promise<EmailLogRow[]> {
  const result = await query<EmailLogRow>(
    db,
    sql`SELECT * FROM email_log
        WHERE status = 'failed'
          AND attempt_count < 3
          AND updated_at < now() - interval '15 minutes'
        ORDER BY updated_at ASC
        LIMIT 50`,
  )
  return result.rows
}
