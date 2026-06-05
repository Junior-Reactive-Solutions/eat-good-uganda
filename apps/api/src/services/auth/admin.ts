import crypto from 'crypto'

import type { Database } from '@eatgood/db'
import {
  getRefreshToken,
  revokeRefreshToken,
  getSuperAdminByEmail,
  updateSuperAdminLastLogin,
} from '@eatgood/db'
import { verifySync } from 'otplib'

import { verifyPassword } from '../../lib/password'
import { createRefreshToken, signAccessToken, rotateRefreshToken } from '../../lib/tokens'

export async function loginAdmin(
  db: Database,
  input: { email: string; password: string; totp_code: string },
  opts: { ip?: string | undefined; userAgent?: string | undefined } = {},
): Promise<{ accessToken: string; refreshToken: string; csrfToken: string; expiresAt: Date }> {
  const admin = await getSuperAdminByEmail(db, input.email)

  if (!admin) {
    throw new Error('invalid credentials')
  }

  const passwordOk = await verifyPassword(input.password, admin.password_hash)
  if (!passwordOk) {
    throw new Error('invalid credentials')
  }

  if (!admin.totp_secret) {
    throw new Error('totp not configured')
  }

  // Debug logging for TOTP verification
  // eslint-disable-next-line no-console
  console.log('[AUTH] TOTP Verification Debug:', {
    email: input.email,
    totpCodeLength: input.totp_code.length,
    totpCodeValue: input.totp_code,
    secretLength: admin.totp_secret.length,
    secretValue: admin.totp_secret,
    timestamp: new Date().toISOString(),
  })

  // Verify TOTP code using otplib's verifySync function
  // window parameter allows for ±1 time window (30-second tolerance for clock skew)
  let totpOk = false
  try {
    totpOk = verifySync({
      token: input.totp_code,
      secret: admin.totp_secret,
      window: 1, // Allow 1 time window before and after (±30 seconds)
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AUTH] TOTP verification error:', err instanceof Error ? err.message : err)
    throw new Error('totp verification failed')
  }

  // eslint-disable-next-line no-console
  console.log('[AUTH] TOTP Verification Result:', {
    email: input.email,
    verified: totpOk,
  })

  if (!totpOk) {
    throw new Error('invalid totp code')
  }

  await updateSuperAdminLastLogin(db, admin.id)

  const accessToken = signAccessToken('super_admin', { kind: 'super_admin', sub: admin.id })
  const { raw: refreshToken, expiresAt } = await createRefreshToken(db, 'super_admin', admin.id, {
    ip: opts.ip,
    userAgent: opts.userAgent,
  })

  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { accessToken, refreshToken, csrfToken, expiresAt }
}

export async function logoutAdmin(db: Database, refreshTokenRaw: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')

  const token = await getRefreshToken(db, tokenHash)
  if (token) {
    await revokeRefreshToken(db, tokenHash)
  }
}

export async function refreshAdminSession(
  db: Database,
  refreshTokenRaw: string,
  opts: { ip?: string | undefined; userAgent?: string | undefined } = {},
): Promise<{ accessToken: string; refreshToken: string; csrfToken: string; expiresAt: Date }> {
  const {
    raw: newRefreshToken,
    payload,
    expiresAt,
  } = await rotateRefreshToken(db, refreshTokenRaw, {
    ip: opts.ip,
    userAgent: opts.userAgent,
  })

  const accessToken = signAccessToken('super_admin', {
    kind: 'super_admin',
    sub: payload.subject_id,
  })
  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { accessToken, refreshToken: newRefreshToken, csrfToken, expiresAt }
}
