import crypto from 'crypto'

import type { Database } from '@eatgood/db'
import {
  createBakery,
  createBakeryUser,
  getBakeryBySlug,
  getBakeryUserByEmail,
  getBakeryUserById,
  markBakeryUserEmailVerified,
  updateBakeryUserLastLogin,
  updateBakeryUserPasswordHash,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  insertEmailVerificationToken,
  insertPasswordResetToken,
  getRefreshToken,
  revokeRefreshToken,
  withTransaction,
  pool,
} from '@eatgood/db'
import type { Bakery, BakeryUser } from '@eatgood/shared'

import { hashPassword, verifyPassword } from '../../lib/password'
import { createRefreshToken, signAccessToken, rotateRefreshToken } from '../../lib/tokens'
import { sendEmailVerificationEmail, sendPasswordResetEmail } from '../email/verification'

const TOKEN_TTL_HOURS = 24
const RESET_TOKEN_TTL_MINUTES = 30

export async function signupBakery(
  db: Database,
  input: {
    email: string
    password: string
    full_name: string
    phone?: string | undefined
    bakery_slug: string
    bakery_legal_name: string
    bakery_display_name: string
    bakery_phone: string
    bakery_email: string
    bakery_address_line1: string
    bakery_latitude: number
    bakery_longitude: number
  },
): Promise<{ bakery: Bakery; owner: BakeryUser }> {
  const existing = await getBakeryUserByEmail(db, input.email)
  if (existing) {
    throw new Error('email already registered')
  }

  const existingBakery = await getBakeryBySlug(db, input.bakery_slug)
  if (existingBakery) {
    throw new Error('bakery slug already taken')
  }

  const passwordHash = await hashPassword(input.password)

  return withTransaction(pool, async (tx) => {
    const bakery = await createBakery(tx, {
      slug: input.bakery_slug,
      legal_name: input.bakery_legal_name,
      display_name: input.bakery_display_name,
      phone: input.bakery_phone,
      email: input.bakery_email,
      address_line1: input.bakery_address_line1,
      latitude: input.bakery_latitude,
      longitude: input.bakery_longitude,
    })

    const owner = await createBakeryUser(tx, {
      bakery_id: bakery.id,
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: 'owner',
    })

    const emailToken = crypto.randomBytes(32).toString('hex')
    const emailTokenHash = crypto.createHash('sha256').update(emailToken).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

    await insertEmailVerificationToken(tx, {
      token_hash: emailTokenHash,
      subject_type: 'bakery_user',
      subject_id: owner.id,
      expires_at: expiresAt,
    })

    sendEmailVerificationEmail(owner.email, emailToken)

    return { bakery, owner }
  })
}

export async function loginBakery(
  db: Database,
  input: { email: string; password: string },
  opts: { ip?: string | undefined; userAgent?: string | undefined } = {},
): Promise<{
  user: BakeryUser
  accessToken: string
  refreshToken: string
  csrfToken: string
  expiresAt: Date
}> {
  const user = await getBakeryUserByEmail(db, input.email)

  if (!user) {
    throw new Error('invalid credentials')
  }

  const passwordOk = await verifyPassword(input.password, user.password_hash)
  if (!passwordOk) {
    throw new Error('invalid credentials')
  }

  if (!user.email_verified_at) {
    throw new Error('email_not_verified')
  }

  await updateBakeryUserLastLogin(db, user.id)

  const accessToken = signAccessToken('bakery_user', {
    kind: 'bakery_user',
    sub: user.id,
    bakery_id: user.bakery_id,
    role: user.role,
  })
  const { raw: refreshToken, expiresAt } = await createRefreshToken(db, 'bakery_user', user.id, {
    bakeryId: user.bakery_id,
    ip: opts.ip,
    userAgent: opts.userAgent,
  })

  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { user, accessToken, refreshToken, csrfToken, expiresAt }
}

export async function logoutBakery(db: Database, refreshTokenRaw: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')

  const token = await getRefreshToken(db, tokenHash)
  if (token) {
    await revokeRefreshToken(db, tokenHash)
  }
}

export async function refreshBakerySession(
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

  const user = await getBakeryUserById(db, payload.subject_id)
  if (!user) {
    throw new Error('user not found')
  }

  const accessToken = signAccessToken('bakery_user', {
    kind: 'bakery_user',
    sub: user.id,
    bakery_id: user.bakery_id,
    role: user.role,
  })
  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { accessToken, refreshToken: newRefreshToken, csrfToken, expiresAt }
}

export async function forgotPasswordBakery(db: Database, email: string): Promise<void> {
  const user = await getBakeryUserByEmail(db, email)

  if (!user) {
    return
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

  await insertPasswordResetToken(db, {
    token_hash: resetTokenHash,
    subject_type: 'bakery_user',
    subject_id: user.id,
    expires_at: expiresAt,
  })

  sendPasswordResetEmail(email, resetToken)
}

export async function resetPasswordBakery(
  db: Database,
  input: { token: string; password: string },
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex')

  const resetToken = await consumePasswordResetToken(db, tokenHash)
  if (!resetToken) {
    throw new Error('invalid or expired token')
  }

  const user = await getBakeryUserById(db, resetToken.subject_id)
  if (!user) {
    throw new Error('user not found')
  }

  const newHash = await hashPassword(input.password)
  await updateBakeryUserPasswordHash(db, user.id, newHash)
}

export async function verifyEmailBakery(db: Database, input: { token: string }): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex')

  const verifyToken = await consumeEmailVerificationToken(db, tokenHash)
  if (!verifyToken) {
    throw new Error('invalid or expired token')
  }

  const user = await getBakeryUserById(db, verifyToken.subject_id)
  if (!user) {
    throw new Error('user not found')
  }

  await markBakeryUserEmailVerified(db, user.id)
}
