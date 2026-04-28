/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import crypto from 'crypto'

import type { Database } from '@eatgood/db'
import {
  getRefreshToken,
  revokeRefreshToken,
  getSuperAdminByEmail,
  updateSuperAdminLastLogin,
} from '@eatgood/db'
import { authenticator } from 'otplib'

import { verifyPassword } from '../../lib/password'
import { createRefreshToken, signAccessToken, rotateRefreshToken } from '../../lib/tokens'

export async function loginAdmin(
  db: Database,
  input: { email: string; password: string; totp_code: string },
  opts: { ip?: string; userAgent?: string } = {},
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

  const totpOk = (authenticator.verify as (opts: { token: string; secret: string }) => boolean)({
    token: input.totp_code,
    secret: admin.totp_secret,
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
  opts: { ip?: string; userAgent?: string } = {},
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
