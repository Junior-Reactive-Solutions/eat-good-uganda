import type { QueryResultRow } from 'pg'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

// ─── Refresh tokens ──────────────────────────────────────────────────────────

export interface RefreshTokenRow extends QueryResultRow {
  id: string
  token_hash: string
  subject_type: 'customer' | 'bakery_user' | 'super_admin'
  subject_id: string
  bakery_id: string | null
  issued_at: Date
  expires_at: Date
  revoked_at: Date | null
  ip_address: string | null
  user_agent: string | null
}

export async function insertRefreshToken(
  db: Database,
  input: {
    token_hash: string
    subject_type: 'customer' | 'bakery_user' | 'super_admin'
    subject_id: string
    bakery_id?: string | null
    ip_address?: string | null
    user_agent?: string | null
    expires_at: Date
  },
): Promise<RefreshTokenRow> {
  const result = await query<RefreshTokenRow>(
    db,
    sql`INSERT INTO refresh_tokens (token_hash, subject_type, subject_id, bakery_id, ip_address, user_agent, issued_at, expires_at)
        VALUES (${input.token_hash}, ${input.subject_type}, ${input.subject_id}, ${input.bakery_id ?? null}, ${input.ip_address ?? null}, ${input.user_agent ?? null}, now(), ${input.expires_at})
        RETURNING *`,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to insert refresh token')
  }
  return row
}

export async function getRefreshToken(
  db: Database,
  token_hash: string,
): Promise<RefreshTokenRow | null> {
  const result = await query<RefreshTokenRow>(
    db,
    sql`SELECT * FROM refresh_tokens WHERE token_hash = ${token_hash} AND revoked_at IS NULL LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function revokeRefreshToken(db: Database, token_hash: string): Promise<void> {
  await query<RefreshTokenRow>(
    db,
    sql`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = ${token_hash}`,
  )
}

export async function revokeAllRefreshTokens(
  db: Database,
  subject_type: string,
  subject_id: string,
): Promise<void> {
  await query<RefreshTokenRow>(
    db,
    sql`UPDATE refresh_tokens SET revoked_at = now()
        WHERE subject_type = ${subject_type} AND subject_id = ${subject_id} AND revoked_at IS NULL`,
  )
}

// ─── Password reset tokens ───────────────────────────────────────────────────

export interface PasswordResetTokenRow extends QueryResultRow {
  id: string
  token_hash: string
  subject_type: 'customer' | 'bakery_user'
  subject_id: string
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

export async function insertPasswordResetToken(
  db: Database,
  input: {
    token_hash: string
    subject_type: 'customer' | 'bakery_user'
    subject_id: string
    expires_at: Date
  },
): Promise<PasswordResetTokenRow> {
  const result = await query<PasswordResetTokenRow>(
    db,
    sql`INSERT INTO password_reset_tokens (token_hash, subject_type, subject_id, expires_at)
        VALUES (${input.token_hash}, ${input.subject_type}, ${input.subject_id}, ${input.expires_at})
        RETURNING *`,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to insert password reset token')
  }
  return row
}

export async function consumePasswordResetToken(
  db: Database,
  token_hash: string,
): Promise<PasswordResetTokenRow | null> {
  const result = await query<PasswordResetTokenRow>(
    db,
    sql`UPDATE password_reset_tokens
        SET used_at = now()
        WHERE token_hash = ${token_hash} AND used_at IS NULL AND expires_at > now()
        RETURNING *`,
  )
  return result.rows[0] ?? null
}

// ─── Email verification tokens ───────────────────────────────────────────────

export interface EmailVerificationTokenRow extends QueryResultRow {
  id: string
  token_hash: string
  subject_type: 'customer' | 'bakery_user'
  subject_id: string
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

export async function insertEmailVerificationToken(
  db: Database,
  input: {
    token_hash: string
    subject_type: 'customer' | 'bakery_user'
    subject_id: string
    expires_at: Date
  },
): Promise<EmailVerificationTokenRow> {
  const result = await query<EmailVerificationTokenRow>(
    db,
    sql`INSERT INTO email_verification_tokens (token_hash, subject_type, subject_id, expires_at)
        VALUES (${input.token_hash}, ${input.subject_type}, ${input.subject_id}, ${input.expires_at})
        RETURNING *`,
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to insert email verification token')
  }
  return row
}

export async function consumeEmailVerificationToken(
  db: Database,
  token_hash: string,
): Promise<EmailVerificationTokenRow | null> {
  const result = await query<EmailVerificationTokenRow>(
    db,
    sql`UPDATE email_verification_tokens
        SET used_at = now()
        WHERE token_hash = ${token_hash} AND used_at IS NULL AND expires_at > now()
        RETURNING *`,
  )
  return result.rows[0] ?? null
}
