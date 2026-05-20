import { randomBytes } from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory store for the bakery_payment_credentials table.
interface StoredRow {
  bakery_id: string
  provider: string
  is_enabled: boolean
  target_environment: string
  encrypted_config: Buffer
  config_nonce: Buffer
}

const store = new Map<string, StoredRow>() // key = `${bakery_id}|${provider}`

function rowKey(bakeryId: string, provider: string): string {
  return `${bakeryId}|${provider}`
}

// Minimal stand-in for the `sql` template tag from @eatgood/db. We can't
// `vi.importActual` the real module because its client.ts requires
// DATABASE_URL at import time, and we don't want a live DB for unit tests.
function sqlTag(strings: TemplateStringsArray, ...values: unknown[]): {
  text: string
  values: unknown[]
} {
  let text = ''
  strings.forEach((chunk, i) => {
    text += chunk
    if (i < values.length) text += `$${String(i + 1)}`
  })
  return { text, values }
}

// Mock the @eatgood/db module. The `query` mock inspects the SQL fragment's
// `text` to decide which operation to run against the in-memory store.
vi.mock('@eatgood/db', () => {
  return {
    sql: sqlTag,
    query: vi.fn((_db: unknown, fragment: { text: string; values: unknown[] }) => {
      const text = fragment.text
      const values = fragment.values

      if (/INSERT INTO bakery_payment_credentials/i.test(text)) {
        // Positional params, in declared order:
        //   1: bakery_id, 2: provider, 3: is_enabled,
        //   4: target_environment, 5: encrypted_config, 6: config_nonce
        const bakeryId = values[0] as string
        const provider = values[1] as string
        const isEnabled = values[2] as boolean
        const targetEnv = values[3] as string
        const encryptedConfig = values[4] as Buffer
        const configNonce = values[5] as Buffer
        const key = rowKey(bakeryId, provider)
        const existing = store.get(key)
        if (existing) {
          // ON CONFLICT DO UPDATE: refresh env/ciphertext/nonce, keep is_enabled.
          store.set(key, {
            ...existing,
            target_environment: targetEnv,
            encrypted_config: encryptedConfig,
            config_nonce: configNonce,
          })
        } else {
          store.set(key, {
            bakery_id: bakeryId,
            provider,
            is_enabled: isEnabled,
            target_environment: targetEnv,
            encrypted_config: encryptedConfig,
            config_nonce: configNonce,
          })
        }
        return { rows: [], rowCount: 1 }
      }

      if (/SELECT encrypted_config, config_nonce/i.test(text)) {
        const bakeryId = values[0] as string
        const provider = values[1] as string
        const row = store.get(rowKey(bakeryId, provider))
        if (!row) return { rows: [], rowCount: 0 }
        return {
          rows: [
            {
              encrypted_config: row.encrypted_config,
              config_nonce: row.config_nonce,
            },
          ],
          rowCount: 1,
        }
      }

      if (/SELECT provider, is_enabled/i.test(text)) {
        const bakeryId = values[0] as string
        const rows = Array.from(store.values())
          .filter((r) => r.bakery_id === bakeryId)
          .sort((a, b) => a.provider.localeCompare(b.provider))
        return { rows, rowCount: rows.length }
      }

      throw new Error(`Unhandled SQL in test mock: ${text}`)
    }),
  }
})

// Import AFTER the mock is registered so the service binds to the mocked
// `query`.
const {
  saveBakeryMomoCredentials,
  loadBakeryMomoCredentials,
  listBakeryPaymentMethods,
} = await import('../credentials')

const VALID_KEY_B64 = randomBytes(32).toString('base64')

const fakeDb = {} as unknown as Parameters<typeof saveBakeryMomoCredentials>[0]

describe('payment credentials service', () => {
  let originalKey: string | undefined

  beforeEach(() => {
    originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY
    process.env.CREDENTIALS_ENCRYPTION_KEY = VALID_KEY_B64
    store.clear()
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.CREDENTIALS_ENCRYPTION_KEY
    } else {
      process.env.CREDENTIALS_ENCRYPTION_KEY = originalKey
    }
    store.clear()
  })

  describe('save / load roundtrip', () => {
    it('saves and loads MoMo credentials, returning the exact plaintext', async () => {
      const bakeryId = 'bakery-roundtrip-1'
      const creds = {
        subscription_key: 'sub-key-abcdef',
        user_id: 'mtn-user-id-12345678',
        api_key: 'api-key-secret-value',
        target_environment: 'sandbox' as const,
        collection_primary_key: 'collection-primary-1',
      }

      await saveBakeryMomoCredentials(fakeDb, bakeryId, creds)

      // The stored row must NOT contain the plaintext anywhere.
      const stored = store.get(rowKey(bakeryId, 'mtn_momo'))
      expect(stored).toBeDefined()
      const cipherStr = stored?.encrypted_config.toString('utf8') ?? ''
      expect(cipherStr).not.toContain(creds.api_key)
      expect(cipherStr).not.toContain(creds.user_id)
      expect(cipherStr).not.toContain(creds.subscription_key)

      const loaded = await loadBakeryMomoCredentials(fakeDb, bakeryId)
      expect(loaded).toEqual(creds)
    })

    it('overwrites credentials on a second save for the same bakery', async () => {
      const bakeryId = 'bakery-roundtrip-2'
      await saveBakeryMomoCredentials(fakeDb, bakeryId, {
        subscription_key: 's1',
        user_id: 'u1-original-id-1111',
        api_key: 'a1',
        target_environment: 'sandbox',
      })
      await saveBakeryMomoCredentials(fakeDb, bakeryId, {
        subscription_key: 's2',
        user_id: 'u2-updated-id-2222',
        api_key: 'a2',
        target_environment: 'production',
      })

      const loaded = await loadBakeryMomoCredentials(fakeDb, bakeryId)
      expect(loaded?.subscription_key).toBe('s2')
      expect(loaded?.user_id).toBe('u2-updated-id-2222')
      expect(loaded?.api_key).toBe('a2')
      expect(loaded?.target_environment).toBe('production')
    })
  })

  describe('loadBakeryMomoCredentials', () => {
    it('returns null when no credentials are stored for the bakery', async () => {
      const loaded = await loadBakeryMomoCredentials(fakeDb, 'bakery-missing')
      expect(loaded).toBeNull()
    })

    it('fails to decrypt credentials stored under a different bakery_id (AAD binding)', async () => {
      const bakeryA = 'bakery-A'
      const bakeryB = 'bakery-B'
      const credsA = {
        subscription_key: 'sub-A',
        user_id: 'user-id-AAAA',
        api_key: 'api-A',
        target_environment: 'sandbox' as const,
      }

      await saveBakeryMomoCredentials(fakeDb, bakeryA, credsA)

      // Forcibly copy bakery A's ciphertext under bakery B's row. The AAD
      // binds the ciphertext to bakery A, so decrypting it as B must fail.
      const rowA = store.get(rowKey(bakeryA, 'mtn_momo'))
      expect(rowA).toBeDefined()
      if (!rowA) throw new Error('expected row')
      store.set(rowKey(bakeryB, 'mtn_momo'), {
        bakery_id: bakeryB,
        provider: 'mtn_momo',
        is_enabled: false,
        target_environment: rowA.target_environment,
        encrypted_config: rowA.encrypted_config,
        config_nonce: rowA.config_nonce,
      })

      await expect(loadBakeryMomoCredentials(fakeDb, bakeryB)).rejects.toThrow(
        /Failed to decrypt payment credentials/,
      )
    })
  })

  describe('listBakeryPaymentMethods', () => {
    it('returns an obfuscated hint that exposes only the last 4 chars of user_id', async () => {
      const bakeryId = 'bakery-hint-1'
      await saveBakeryMomoCredentials(fakeDb, bakeryId, {
        subscription_key: 'sub',
        user_id: 'super-secret-user-id-WXYZ',
        api_key: 'api',
        target_environment: 'sandbox',
      })

      const summaries = await listBakeryPaymentMethods(fakeDb, bakeryId)
      expect(summaries).toHaveLength(1)
      const momo = summaries[0]
      expect(momo?.method).toBe('mtn_momo')
      expect(momo?.hint).toBe('****WXYZ')
      // The hint must not contain the original full user_id.
      expect(momo?.hint).not.toContain('super-secret-user-id-WXYZ')
      // No other secret fields should appear on the summary.
      expect(JSON.stringify(momo)).not.toContain('sub')
      expect(JSON.stringify(momo)).not.toContain('api')
    })

    it('preserves the is_enabled flag in the summary', async () => {
      const bakeryId = 'bakery-enabled-1'
      await saveBakeryMomoCredentials(fakeDb, bakeryId, {
        subscription_key: 'sub',
        user_id: 'user-id-0000',
        api_key: 'api',
        target_environment: 'production',
      })

      // Newly-saved credentials default to is_enabled=false.
      let summaries = await listBakeryPaymentMethods(fakeDb, bakeryId)
      expect(summaries[0]?.is_enabled).toBe(false)
      expect(summaries[0]?.target_environment).toBe('production')

      // Flip the stored flag manually and confirm the summary reflects it.
      const row = store.get(rowKey(bakeryId, 'mtn_momo'))
      if (!row) throw new Error('expected row')
      store.set(rowKey(bakeryId, 'mtn_momo'), { ...row, is_enabled: true })

      summaries = await listBakeryPaymentMethods(fakeDb, bakeryId)
      expect(summaries[0]?.is_enabled).toBe(true)
    })
  })

  describe('multi-tenant isolation', () => {
    it('does not let bakery A read bakery B credentials', async () => {
      const bakeryA = 'bakery-iso-A'
      const bakeryB = 'bakery-iso-B'

      await saveBakeryMomoCredentials(fakeDb, bakeryA, {
        subscription_key: 'sub-A',
        user_id: 'user-AAAA',
        api_key: 'api-A',
        target_environment: 'sandbox',
      })
      await saveBakeryMomoCredentials(fakeDb, bakeryB, {
        subscription_key: 'sub-B',
        user_id: 'user-BBBB',
        api_key: 'api-B',
        target_environment: 'production',
      })

      const loadedA = await loadBakeryMomoCredentials(fakeDb, bakeryA)
      const loadedB = await loadBakeryMomoCredentials(fakeDb, bakeryB)
      expect(loadedA?.api_key).toBe('api-A')
      expect(loadedA?.user_id).toBe('user-AAAA')
      expect(loadedB?.api_key).toBe('api-B')
      expect(loadedB?.user_id).toBe('user-BBBB')

      const summariesA = await listBakeryPaymentMethods(fakeDb, bakeryA)
      const summariesB = await listBakeryPaymentMethods(fakeDb, bakeryB)
      expect(summariesA).toHaveLength(1)
      expect(summariesB).toHaveLength(1)
      expect(summariesA[0]?.hint).toBe('****AAAA')
      expect(summariesB[0]?.hint).toBe('****BBBB')
      // The hint for one tenant must never leak the other tenant's user_id.
      expect(summariesA[0]?.hint).not.toContain('BBBB')
      expect(summariesB[0]?.hint).not.toContain('AAAA')
    })
  })
})
