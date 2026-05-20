import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * AES-256-GCM encryption for per-bakery payment credentials.
 *
 * Uses CREDENTIALS_ENCRYPTION_KEY (base64-encoded 32-byte key) from the
 * environment. Each encryption produces a fresh 12-byte nonce. The GCM
 * authentication tag is appended to the ciphertext so downstream code only
 * has to track the (ciphertext, nonce) pair, plus the AAD that was bound
 * to the plaintext at encryption time.
 *
 * Errors NEVER include plaintext, key bytes, or full ciphertexts — only
 * generic, log-safe messages.
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const NONCE_BYTES = 12
const AUTH_TAG_BYTES = 16

export interface EncryptionResult {
  /** Ciphertext || authTag, base64-encoded. */
  ciphertext: string
  /** 12-byte GCM nonce, base64-encoded. */
  nonce: string
}

/**
 * Strict base64 decoder. Node's `Buffer.from(str, 'base64')` silently skips
 * characters outside the base64 alphabet, so we validate the input shape
 * explicitly before decoding.
 */
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/
function decodeBase64Strict(value: string, label: string): Buffer {
  if (value.length === 0) {
    throw new Error(`${label} is empty`)
  }
  if (!BASE64_RE.test(value) || value.length % 4 !== 0) {
    throw new Error(`${label} is not valid base64`)
  }
  return Buffer.from(value, 'base64')
}

/**
 * Read and decode the 32-byte AES key from CREDENTIALS_ENCRYPTION_KEY.
 *
 * Reads `process.env` lazily on every call so tests can mutate the env
 * between cases without re-importing the module.
 */
function loadKey(): Buffer {
  const raw = process.env['CREDENTIALS_ENCRYPTION_KEY']
  if (raw === undefined || raw.length === 0) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set')
  }

  const key = decodeBase64Strict(raw, 'CREDENTIALS_ENCRYPTION_KEY')

  if (key.length !== KEY_BYTES) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY must decode to ${KEY_BYTES.toString()} bytes (got ${key.length.toString()})`,
    )
  }

  return key
}

/**
 * Encrypt `plaintext` with AES-256-GCM, binding `aad` as associated data.
 *
 * Returns base64-encoded ciphertext (with authentication tag appended) and
 * base64-encoded nonce. The same `aad` MUST be supplied on decryption.
 */
export function aesGcmEncrypt(plaintext: string, aad: string): Promise<EncryptionResult> {
  try {
    return Promise.resolve(aesGcmEncryptSync(plaintext, aad))
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error('encryption failed'))
  }
}

function aesGcmEncryptSync(plaintext: string, aad: string): EncryptionResult {
  const key = loadKey()
  const nonce = randomBytes(NONCE_BYTES)

  const cipher = createCipheriv(ALGORITHM, key, nonce)
  cipher.setAAD(Buffer.from(aad, 'utf8'))

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
    nonce: nonce.toString('base64'),
  }
}

/**
 * Decrypt the output of `aesGcmEncrypt`. Throws if the authentication tag
 * fails to verify (wrong key, wrong AAD, or tampered ciphertext / nonce).
 */
export function aesGcmDecrypt(
  ciphertext: string,
  nonce: string,
  aad: string,
): Promise<string> {
  try {
    return Promise.resolve(aesGcmDecryptSync(ciphertext, nonce, aad))
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error('decryption failed'))
  }
}

function aesGcmDecryptSync(ciphertext: string, nonce: string, aad: string): string {
  const key = loadKey()

  const nonceBuf = decodeBase64Strict(nonce, 'nonce')
  if (nonceBuf.length !== NONCE_BYTES) {
    throw new Error(`nonce must be ${NONCE_BYTES.toString()} bytes`)
  }

  const combined = decodeBase64Strict(ciphertext, 'ciphertext')
  if (combined.length < AUTH_TAG_BYTES) {
    throw new Error('ciphertext is too short to contain an auth tag')
  }

  const tagStart = combined.length - AUTH_TAG_BYTES
  const encrypted = combined.subarray(0, tagStart)
  const authTag = combined.subarray(tagStart)

  const decipher = createDecipheriv(ALGORITHM, key, nonceBuf)
  decipher.setAAD(Buffer.from(aad, 'utf8'))
  decipher.setAuthTag(authTag)

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // Don't leak any details (Node's GCM error message can include offsets).
    throw new Error('decryption failed: authentication tag mismatch')
  }
}

/**
 * Validate that CREDENTIALS_ENCRYPTION_KEY is set and decodes to exactly 32
 * bytes. Call once at app startup so misconfiguration fails loud and early
 * rather than at the first payment-credential write.
 */
export function validateEncryptionKey(): void {
  loadKey()
}
