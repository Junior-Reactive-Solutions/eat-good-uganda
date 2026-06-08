/**
 * regenerate-totp.ts — Regenerate Super Admin TOTP secret
 *
 * Run: DATABASE_URL="..." npx tsx src/scripts/regenerate-totp.ts
 */
import crypto from 'crypto'
import { Pool } from 'pg'

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

function buildOtpauthUrl(email: string, issuer: string, secret: string): string {
  const i = encodeURIComponent(issuer)
  const a = encodeURIComponent(`${issuer}:${email}`)
  return `otpauth://totp/${a}?secret=${secret}&issuer=${i}&algorithm=SHA1&digits=6&period=30`
}

async function regenerateTotp() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const totpSecret = toBase32(crypto.randomBytes(20))
    const otpauthUrl = buildOtpauthUrl('admin@eatgooduganda.com', 'Eat Good Uganda', totpSecret)

    await pool.query(
      'UPDATE super_admin_users SET totp_secret = $1 WHERE email = $2',
      [totpSecret, 'admin@eatgooduganda.com']
    )

    console.log('\n✅ TOTP Secret Regenerated for Super Admin\n')
    console.log(`Email:        admin@eatgooduganda.com`)
    console.log(`TOTP Secret:  ${totpSecret}`)
    console.log(`otpauth URL:  ${otpauthUrl}\n`)
    console.log('Add this secret to your authenticator app:')
    console.log(`  Account name: Eat Good Uganda`)
    console.log(`  Key/Secret: ${totpSecret}`)
    console.log(`  Type: Time-based (TOTP)\n`)
  } finally {
    await pool.end()
  }
}

regenerateTotp()
