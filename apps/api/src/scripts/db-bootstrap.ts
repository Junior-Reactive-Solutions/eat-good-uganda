/**
 * db-bootstrap.ts — Phase 1 + 2 of the seed plan.
 *
 * 1. DROP SCHEMA public CASCADE + recreate (DESTRUCTIVE)
 * 2. Create required extensions (separate statements — avoids Neon batching bug)
 * 3. Apply packages/db/seed/schema.sql
 * 4. Create a Super Admin (Argon2 password + TOTP secret) and print credentials
 *
 * Usage:
 *   cd apps/api
 *   DATABASE_URL="postgres://..." npx tsx src/scripts/db-bootstrap.ts --confirm
 *
 * Without --confirm it aborts (safety).
 */
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { Pool } from 'pg'
import * as argon2 from 'argon2'

// RFC 4648 base32 (no padding) — the format otplib's authenticator.verify expects.
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function toBase32(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}
function generateTotpSecret(): string {
  return toBase32(crypto.randomBytes(20))
}
function buildOtpauthUrl(email: string, issuer: string, secret: string): string {
  const i = encodeURIComponent(issuer)
  const a = encodeURIComponent(`${issuer}:${email}`)
  return `otpauth://totp/${a}?secret=${secret}&issuer=${i}&algorithm=SHA1&digits=6&period=30`
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = resolve(__dirname, '../../../../packages/db/seed/schema.sql')

// Credentials come from env so no secret is committed. Falls back to a random
// password (printed once) if SUPER_ADMIN_PASSWORD is not provided.
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL ?? 'admin@eatgooduganda.com',
  password: process.env.SUPER_ADMIN_PASSWORD ?? crypto.randomBytes(12).toString('base64url'),
  fullName: process.env.SUPER_ADMIN_NAME ?? 'Platform Administrator',
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('Refusing to run without --confirm (this DROPs the public schema).')
    process.exit(1)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    console.log('→ Resetting public schema...')
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await pool.query('CREATE SCHEMA public;')
    await pool.query('GRANT ALL ON SCHEMA public TO public;')

    console.log('→ Creating extensions...')
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
    await pool.query('CREATE EXTENSION IF NOT EXISTS citext CASCADE;')
    await pool.query('CREATE EXTENSION IF NOT EXISTS cube;')
    await pool.query('CREATE EXTENSION IF NOT EXISTS earthdistance;')

    console.log('→ Applying schema.sql...')
    const schemaSql = readFileSync(SCHEMA_PATH, 'utf8')
    await pool.query(schemaSql)

    console.log('→ Creating Super Admin...')
    const passwordHash = await argon2.hash(SUPER_ADMIN.password, { type: argon2.argon2id })
    const totpSecret = generateTotpSecret()
    const otpauthUrl = buildOtpauthUrl(SUPER_ADMIN.email, 'Eat Good Uganda', totpSecret)

    await pool.query(
      `INSERT INTO super_admin_users (email, password_hash, full_name, totp_secret, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      [SUPER_ADMIN.email, passwordHash, SUPER_ADMIN.fullName, totpSecret],
    )

    console.log('\n=================== SUPER ADMIN CREATED ===================')
    console.log(`Email:        ${SUPER_ADMIN.email}`)
    console.log(`Password:     ${SUPER_ADMIN.password}`)
    console.log(`TOTP secret:  ${totpSecret}`)
    console.log(`otpauth URL:  ${otpauthUrl}`)
    console.log('Add the otpauth URL (or TOTP secret) to Google Authenticator / Authy to get codes.')
    console.log('==========================================================\n')

    console.log('Bootstrap complete.')
  } catch (err) {
    console.error('Bootstrap failed:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

void main()
