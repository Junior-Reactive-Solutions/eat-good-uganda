import crypto from 'crypto'

import type { Database } from '@eatgood/db'
import { getRefreshToken, insertRefreshToken, revokeRefreshToken } from '@eatgood/db'
import type { AnyToken } from '@eatgood/shared'
import { bakeryTokenSchema, customerTokenSchema, superAdminTokenSchema } from '@eatgood/shared'
import * as jwt from 'jsonwebtoken'

import { env } from '../env'

const CUSTOMER_SECRET = env.JWT_CUSTOMER_SECRET
const BAKERY_SECRET = env.JWT_BAKERY_SECRET
const SUPERADMIN_SECRET = env.JWT_SUPERADMIN_SECRET

const getSecret = (kind: 'customer' | 'bakery_user' | 'super_admin'): string => {
  switch (kind) {
    case 'customer':
      return CUSTOMER_SECRET
    case 'bakery_user':
      return BAKERY_SECRET
    case 'super_admin':
      return SUPERADMIN_SECRET
  }
}

export function signAccessToken(
  kind: 'customer' | 'bakery_user' | 'super_admin',
  payload: Record<string, unknown>,
): string {
  return jwt.sign(payload, getSecret(kind), {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  })
}

export function verifyAccessToken(
  kind: 'customer' | 'bakery_user' | 'super_admin',
  token: string,
): AnyToken {
  const decoded = jwt.verify(token, getSecret(kind), {
    algorithms: ['HS256'],
  }) as Record<string, unknown>

  const schema =
    kind === 'customer'
      ? customerTokenSchema
      : kind === 'bakery_user'
        ? bakeryTokenSchema
        : superAdminTokenSchema

  return schema.parse(decoded)
}

export async function createRefreshToken(
  db: Database,
  subjectType: 'customer' | 'bakery_user' | 'super_admin',
  subjectId: string,
  opts: {
    bakeryId?: string | undefined
    ip?: string | undefined
    userAgent?: string | undefined
  } = {},
): Promise<{ raw: string; expiresAt: Date }> {
  const raw = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await insertRefreshToken(db, {
    token_hash: tokenHash,
    subject_type: subjectType,
    subject_id: subjectId,
    bakery_id: opts.bakeryId ?? null,
    ip_address: opts.ip ?? null,
    user_agent: opts.userAgent ?? null,
    expires_at: expiresAt,
  })

  return { raw, expiresAt }
}

export async function rotateRefreshToken(
  db: Database,
  raw: string,
  opts: { ip?: string | undefined; userAgent?: string | undefined } = {},
): Promise<{
  raw: string
  payload: { subject_type: string; subject_id: string; bakery_id: string | null }
  expiresAt: Date
}> {
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  const oldToken = await getRefreshToken(db, tokenHash)

  if (!oldToken) {
    throw new Error('refresh token not found or revoked')
  }

  if (new Date() > oldToken.expires_at) {
    throw new Error('refresh token expired')
  }

  await revokeRefreshToken(db, tokenHash)

  const { raw: newRaw, expiresAt } = await createRefreshToken(
    db,
    oldToken.subject_type,
    oldToken.subject_id,
    {
      bakeryId: oldToken.bakery_id ?? undefined,
      ip: opts.ip,
      userAgent: opts.userAgent,
    },
  )

  return {
    raw: newRaw,
    payload: {
      subject_type: oldToken.subject_type,
      subject_id: oldToken.subject_id,
      bakery_id: oldToken.bakery_id,
    },
    expiresAt,
  }
}
