import { randomBytes } from 'crypto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { aesGcmDecrypt, aesGcmEncrypt, validateEncryptionKey } from '../crypto'

const VALID_KEY_B64 = randomBytes(32).toString('base64')
const OTHER_KEY_B64 = randomBytes(32).toString('base64')

function setKey(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.CREDENTIALS_ENCRYPTION_KEY
  } else {
    process.env.CREDENTIALS_ENCRYPTION_KEY = value
  }
}

describe('crypto', () => {
  let originalKey: string | undefined

  beforeEach(() => {
    originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY
    setKey(VALID_KEY_B64)
  })

  afterEach(() => {
    setKey(originalKey)
  })

  describe('aesGcmEncrypt / aesGcmDecrypt roundtrip', () => {
    it('encrypts and decrypts to the original plaintext', async () => {
      const plaintext = 'mtn-momo-api-key-secret-value-123'
      const aad = 'bakery_id=bakery-abc-123|field=api_key'

      const { ciphertext, nonce } = await aesGcmEncrypt(plaintext, aad)

      expect(typeof ciphertext).toBe('string')
      expect(typeof nonce).toBe('string')
      expect(ciphertext.length).toBeGreaterThan(0)
      expect(nonce.length).toBeGreaterThan(0)
      // base64 of a 12-byte nonce is 16 chars
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
      // ciphertext should not contain the plaintext
      expect(ciphertext).not.toContain(plaintext)

      const decrypted = await aesGcmDecrypt(ciphertext, nonce, aad)
      expect(decrypted).toBe(plaintext)
    })

    it('produces a different nonce/ciphertext for the same plaintext on each call', async () => {
      const plaintext = 'repeated-plaintext'
      const aad = 'aad-value'

      const first = await aesGcmEncrypt(plaintext, aad)
      const second = await aesGcmEncrypt(plaintext, aad)

      expect(first.nonce).not.toBe(second.nonce)
      expect(first.ciphertext).not.toBe(second.ciphertext)

      expect(await aesGcmDecrypt(first.ciphertext, first.nonce, aad)).toBe(plaintext)
      expect(await aesGcmDecrypt(second.ciphertext, second.nonce, aad)).toBe(plaintext)
    })
  })

  describe('AAD validation', () => {
    it('fails decryption when the wrong AAD is supplied', async () => {
      const plaintext = 'sensitive-credential'
      const aad = 'bakery_id=bakery-1'
      const wrongAad = 'bakery_id=bakery-2'

      const { ciphertext, nonce } = await aesGcmEncrypt(plaintext, aad)

      await expect(aesGcmDecrypt(ciphertext, nonce, wrongAad)).rejects.toThrow(
        /authentication tag mismatch/,
      )
    })
  })

  describe('validateEncryptionKey', () => {
    it('throws when CREDENTIALS_ENCRYPTION_KEY is missing', () => {
      setKey(undefined)
      expect(() => {
        validateEncryptionKey()
      }).toThrow(/CREDENTIALS_ENCRYPTION_KEY is not set/)
    })

    it('throws when CREDENTIALS_ENCRYPTION_KEY is empty', () => {
      setKey('')
      expect(() => {
        validateEncryptionKey()
      }).toThrow(/CREDENTIALS_ENCRYPTION_KEY is not set/)
    })

    it('throws when CREDENTIALS_ENCRYPTION_KEY is not valid base64', () => {
      setKey('not!valid$base64@@@')
      expect(() => {
        validateEncryptionKey()
      }).toThrow(/not valid base64/)
    })

    it('throws when CREDENTIALS_ENCRYPTION_KEY decodes to the wrong length', () => {
      setKey(randomBytes(16).toString('base64')) // 16 bytes, not 32
      expect(() => {
        validateEncryptionKey()
      }).toThrow(/must decode to 32 bytes/)
    })

    it('passes for a valid 32-byte base64 key', () => {
      setKey(VALID_KEY_B64)
      expect(() => {
        validateEncryptionKey()
      }).not.toThrow()
    })
  })

  describe('input validation on decrypt', () => {
    it('throws on invalid base64 ciphertext', async () => {
      const { nonce } = await aesGcmEncrypt('x', 'aad')
      await expect(aesGcmDecrypt('not!base64$$$', nonce, 'aad')).rejects.toThrow(
        /not valid base64/,
      )
    })

    it('throws on invalid base64 nonce', async () => {
      const { ciphertext } = await aesGcmEncrypt('x', 'aad')
      await expect(aesGcmDecrypt(ciphertext, 'not!base64$$$', 'aad')).rejects.toThrow(
        /not valid base64/,
      )
    })
  })

  describe('wrong key', () => {
    it('fails decryption when the encryption key changes between encrypt and decrypt', async () => {
      const plaintext = 'secret'
      const aad = 'aad'

      setKey(VALID_KEY_B64)
      const { ciphertext, nonce } = await aesGcmEncrypt(plaintext, aad)

      setKey(OTHER_KEY_B64)
      await expect(aesGcmDecrypt(ciphertext, nonce, aad)).rejects.toThrow(
        /authentication tag mismatch/,
      )
    })
  })
})
