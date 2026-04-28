import crypto from 'crypto'

import type { Database } from '@eatgood/db'
import {
  createCustomer,
  getCustomerByEmail,
  getCustomerById,
  markCustomerEmailVerified,
  updateCustomerLastLogin,
  updateCustomerPasswordHash,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  insertEmailVerificationToken,
  insertPasswordResetToken,
  getRefreshToken,
  revokeRefreshToken,
} from '@eatgood/db'
import type { Customer } from '@eatgood/shared'

import { hashPassword, verifyPassword } from '../../lib/password'
import { createRefreshToken, signAccessToken, rotateRefreshToken } from '../../lib/tokens'
import { sendEmailVerificationEmail, sendPasswordResetEmail } from '../email/verification'

const TOKEN_TTL_HOURS = 24
const RESET_TOKEN_TTL_MINUTES = 30

export async function signupCustomer(
  db: Database,
  input: { email: string; password: string; full_name: string; phone?: string },
): Promise<Customer> {
  const existing = await getCustomerByEmail(db, input.email)
  if (existing) {
    throw new Error('email already registered')
  }

  const passwordHash = await hashPassword(input.password)

  const customer = await createCustomer(db, {
    email: input.email,
    password_hash: passwordHash,
    full_name: input.full_name,
    phone: input.phone ?? null,
  })

  const emailToken = crypto.randomBytes(32).toString('hex')
  const emailTokenHash = crypto.createHash('sha256').update(emailToken).digest('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await insertEmailVerificationToken(db, {
    token_hash: emailTokenHash,
    subject_type: 'customer',
    subject_id: customer.id,
    expires_at: expiresAt,
  })

  sendEmailVerificationEmail(customer.email, emailToken)

  return customer
}

export async function loginCustomer(
  db: Database,
  input: { email: string; password: string },
  opts: { ip?: string; userAgent?: string } = {},
): Promise<{
  customer: Customer
  accessToken: string
  refreshToken: string
  csrfToken: string
  expiresAt: Date
}> {
  const customer = await getCustomerByEmail(db, input.email)

  if (!customer || !customer.password_hash) {
    throw new Error('invalid credentials')
  }

  const passwordOk = await verifyPassword(input.password, customer.password_hash)
  if (!passwordOk) {
    throw new Error('invalid credentials')
  }

  if (!customer.email_verified_at) {
    throw new Error('email_not_verified')
  }

  await updateCustomerLastLogin(db, customer.id)

  const accessToken = signAccessToken('customer', { kind: 'customer', sub: customer.id })
  const { raw: refreshToken, expiresAt } = await createRefreshToken(db, 'customer', customer.id, {
    ip: opts.ip,
    userAgent: opts.userAgent,
  })

  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { customer, accessToken, refreshToken, csrfToken, expiresAt }
}

export async function logoutCustomer(db: Database, refreshTokenRaw: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')

  const token = await getRefreshToken(db, tokenHash)
  if (token) {
    await revokeRefreshToken(db, tokenHash)
  }
}

export async function refreshCustomerSession(
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

  const accessToken = signAccessToken('customer', { kind: 'customer', sub: payload.subject_id })
  const csrfToken = crypto.randomBytes(32).toString('hex')

  return { accessToken, refreshToken: newRefreshToken, csrfToken, expiresAt }
}

export async function forgotPasswordCustomer(db: Database, email: string): Promise<void> {
  const customer = await getCustomerByEmail(db, email)

  if (!customer) {
    return
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

  await insertPasswordResetToken(db, {
    token_hash: resetTokenHash,
    subject_type: 'customer',
    subject_id: customer.id,
    expires_at: expiresAt,
  })

  sendPasswordResetEmail(email, resetToken)
}

export async function resetPasswordCustomer(
  db: Database,
  input: { token: string; password: string },
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex')

  const resetToken = await consumePasswordResetToken(db, tokenHash)
  if (!resetToken) {
    throw new Error('invalid or expired token')
  }

  const customer = await getCustomerById(db, resetToken.subject_id)
  if (!customer) {
    throw new Error('customer not found')
  }

  const newHash = await hashPassword(input.password)
  await updateCustomerPasswordHash(db, customer.id, newHash)
}

export async function verifyEmailCustomer(db: Database, input: { token: string }): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex')

  const verifyToken = await consumeEmailVerificationToken(db, tokenHash)
  if (!verifyToken) {
    throw new Error('invalid or expired token')
  }

  const customer = await getCustomerById(db, verifyToken.subject_id)
  if (!customer) {
    throw new Error('customer not found')
  }

  await markCustomerEmailVerified(db, customer.id)
}
