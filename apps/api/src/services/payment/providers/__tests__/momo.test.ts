import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BakeryMomoCredentials } from '../../credentials'
import {
  __momoTokenCache,
  __resetMomoTokenCacheForTests,
  MomoClient,
  MomoPaymentError,
  MomoStatusError,
  MomoTokenError,
} from '../momo'

const SANDBOX_BASE_URL = 'https://sandbox.momodeveloper.mtn.com'

const sandboxCreds: BakeryMomoCredentials = {
  subscription_key: 'sub-key-test',
  user_id: 'user-id-test',
  api_key: 'api-key-test',
  target_environment: 'sandbox',
}

const productionCreds: BakeryMomoCredentials = {
  subscription_key: 'sub-key-prod',
  user_id: 'user-id-prod',
  api_key: 'api-key-prod',
  target_environment: 'production',
}

interface MockResponseInit {
  status?: number
  body?: unknown
  /** Force `response.json()` to throw — simulates a malformed body. */
  jsonThrows?: boolean
}

function makeResponse({ status = 200, body, jsonThrows = false }: MockResponseInit): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      jsonThrows
        ? Promise.reject(new Error('invalid json'))
        : Promise.resolve(body ?? {}),
  } as unknown as Response
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  __resetMomoTokenCacheForTests()
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as typeof fetch
})

function getCall(idx: number): [string, RequestInit] {
  const call = fetchMock.mock.calls[idx]
  if (!call) throw new Error(`expected fetch call at index ${String(idx)}`)
  return [call[0] as string, (call[1] ?? {}) as RequestInit]
}

afterEach(() => {
  vi.restoreAllMocks()
  __resetMomoTokenCacheForTests()
})

describe('MomoClient.getToken', () => {
  it('caches a freshly-fetched token and reuses it within the expiry window', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        status: 200,
        body: { access_token: 'tok-1', expires_in: 3600 },
      }),
    )

    const client = new MomoClient(sandboxCreds)
    const t1 = await client.getToken()
    const t2 = await client.getToken()

    expect(t1).toBe('tok-1')
    expect(t2).toBe('tok-1')
    // Second call must NOT have hit the network.
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Verify the request was made to the sandbox token endpoint with the
    // expected Basic auth header derived from user_id:api_key.
    const [url, init] = getCall(0)
    expect(url).toBe(`${SANDBOX_BASE_URL}/collection/token/`)
    const headers = init.headers as Record<string, string>
    const expectedBasic = Buffer.from(
      `${sandboxCreds.user_id}:${sandboxCreds.api_key}`,
    ).toString('base64')
    expect(headers.Authorization).toBe(`Basic ${expectedBasic}`)
    expect(headers['Ocp-Apim-Subscription-Key']).toBe(sandboxCreds.subscription_key)
  })

  it('refreshes the token when within 60 seconds of expiry', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok-old', expires_in: 30 } }),
      )
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok-new', expires_in: 3600 } }),
      )

    const client = new MomoClient(sandboxCreds)
    const first = await client.getToken()
    expect(first).toBe('tok-old')

    // Cache entry is within the 60s buffer (expires_in was 30s), so the
    // next call must trigger a refresh.
    const second = await client.getToken()
    expect(second).toBe('tok-new')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws MomoTokenError with a non-credential message on 401', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, body: {} }))

    const client = new MomoClient(sandboxCreds)
    await expect(client.getToken()).rejects.toBeInstanceOf(MomoTokenError)

    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, body: {} }))
    const client2 = new MomoClient(sandboxCreds)
    try {
      await client2.getToken()
      throw new Error('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(MomoTokenError)
      const msg = (err as Error).message
      expect(msg).not.toContain(sandboxCreds.api_key)
      expect(msg).not.toContain(sandboxCreds.user_id)
      expect(msg).not.toContain(sandboxCreds.subscription_key)
    }
  })

  it('throws MomoTokenError on network failure without exposing credentials', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNRESET'))

    const client = new MomoClient(sandboxCreds)
    try {
      await client.getToken()
      throw new Error('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(MomoTokenError)
      const msg = (err as Error).message
      expect(msg).toMatch(/network/i)
      expect(msg).not.toContain(sandboxCreds.api_key)
      expect(msg).not.toContain(sandboxCreds.subscription_key)
    }
  })
})

describe('MomoClient.requestToPay', () => {
  it('submits a request-to-pay and accepts a 202 response', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 202, body: {} }))

    const client = new MomoClient(sandboxCreds)
    const reference = '00000000-0000-0000-0000-000000000001'
    await expect(
      client.requestToPay(reference, {
        amount: '10000',
        currency: 'UGX',
        externalId: 'order-123',
        payerMsisdn: '+256780123456',
        payerMessage: 'Test',
        payeeNote: 'Test order',
      }),
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = getCall(1)
    expect(url).toBe(`${SANDBOX_BASE_URL}/collection/v1_0/requesttopay`)
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
    expect(headers['X-Reference-Id']).toBe(reference)
    expect(headers['X-Target-Environment']).toBe('sandbox')
    expect(headers['Ocp-Apim-Subscription-Key']).toBe(sandboxCreds.subscription_key)
    expect(headers['Content-Type']).toBe('application/json')

    const sentBody = JSON.parse(init.body as string) as {
      amount: string
      currency: string
      externalId: string
      payer: { partyIdType: string; partyId: string }
      payerMessage: string
      payeeNote: string
    }
    expect(sentBody.amount).toBe('10000')
    expect(sentBody.currency).toBe('UGX')
    expect(sentBody.externalId).toBe('order-123')
    expect(sentBody.payer.partyIdType).toBe('MSISDN')
    // MSISDN must be normalised (no leading '+').
    expect(sentBody.payer.partyId).toBe('256780123456')
  })

  it('uses the mtnuganda target environment header in production', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 202, body: {} }))

    const client = new MomoClient(productionCreds)
    await client.requestToPay('ref-prod-1', {
      amount: '500',
      currency: 'UGX',
      externalId: 'order-prod',
      payerMsisdn: '256780999999',
      payerMessage: 'p',
      payeeNote: 'n',
    })

    const [, init] = getCall(1)
    const headers = init.headers as Record<string, string>
    expect(headers['X-Target-Environment']).toBe('mtnuganda')
  })

  it('throws MomoPaymentError on non-202/200 response (500)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 500, body: {} }))

    const client = new MomoClient(sandboxCreds)
    try {
      await client.requestToPay('ref-bad', {
        amount: '10000',
        currency: 'UGX',
        externalId: 'order-x',
        payerMsisdn: '+256780000001',
        payerMessage: 'm',
        payeeNote: 'n',
      })
      throw new Error('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(MomoPaymentError)
      expect((err as Error).message).toMatch(/server_error/)
      expect((err as Error).message).not.toContain(sandboxCreds.api_key)
    }
  })

  it('throws MomoPaymentError on network error', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockRejectedValueOnce(new Error('socket hang up'))

    const client = new MomoClient(sandboxCreds)
    await expect(
      client.requestToPay('ref-net', {
        amount: '1',
        currency: 'UGX',
        externalId: 'order-net',
        payerMsisdn: '256780000002',
        payerMessage: 'm',
        payeeNote: 'n',
      }),
    ).rejects.toBeInstanceOf(MomoPaymentError)
  })
})

describe('MomoClient.getRequestStatus', () => {
  it('maps SUCCESSFUL to status=success with financialTransactionId', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          status: 200,
          body: { status: 'SUCCESSFUL', financialTransactionId: 'ftx-1' },
        }),
      )

    const client = new MomoClient(sandboxCreds)
    const result = await client.getRequestStatus('ref-1')
    expect(result.status).toBe('success')
    expect(result.financialTransactionId).toBe('ftx-1')
    expect(result.reason).toBeUndefined()
  })

  it('maps FAILED to status=failed with a reason', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          status: 200,
          body: { status: 'FAILED', reason: 'NOT_ENOUGH_FUNDS' },
        }),
      )

    const client = new MomoClient(sandboxCreds)
    const result = await client.getRequestStatus('ref-2')
    expect(result.status).toBe('failed')
    expect(result.reason).toBe('NOT_ENOUGH_FUNDS')
    expect(result.financialTransactionId).toBeUndefined()
  })

  it('maps PENDING (and unknown statuses) to status=pending', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 200, body: { status: 'PENDING' } }))

    const client = new MomoClient(sandboxCreds)
    const result = await client.getRequestStatus('ref-3')
    expect(result.status).toBe('pending')

    // Unknown / missing status also falls through to pending.
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 200, body: { status: 'WAT' } }),
    )
    const result2 = await client.getRequestStatus('ref-3b')
    expect(result2.status).toBe('pending')
  })

  it('throws MomoStatusError on 404 (no such reference)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 404, body: {} }))

    const client = new MomoClient(sandboxCreds)
    try {
      await client.getRequestStatus('ref-missing')
      throw new Error('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(MomoStatusError)
      expect((err as Error).message).toMatch(/not_found/)
      expect((err as Error).message).not.toContain(sandboxCreds.api_key)
    }
  })

  it('throws MomoStatusError on network error', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))

    const client = new MomoClient(sandboxCreds)
    await expect(client.getRequestStatus('ref-net')).rejects.toBeInstanceOf(
      MomoStatusError,
    )
  })
})

describe('error messages never leak credentials', () => {
  it('any error from any method excludes all credential fields', async () => {
    const errors: Error[] = []

    // 401 on token endpoint.
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, body: {} }))
    const c1 = new MomoClient(sandboxCreds)
    await c1.getToken().catch((e: unknown) => {
      if (e instanceof Error) errors.push(e)
    })

    // 500 on requestToPay (after a successful token fetch).
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 't', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 500, body: {} }))
    const c2 = new MomoClient(sandboxCreds)
    __momoTokenCache.clear()
    await c2
      .requestToPay('r', {
        amount: '1',
        currency: 'UGX',
        externalId: 'e',
        payerMsisdn: '256780000003',
        payerMessage: 'm',
        payeeNote: 'n',
      })
      .catch((e: unknown) => {
        if (e instanceof Error) errors.push(e)
      })

    // 404 on getRequestStatus.
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 't', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 404, body: {} }))
    const c3 = new MomoClient(sandboxCreds)
    __momoTokenCache.clear()
    await c3.getRequestStatus('r').catch((e: unknown) => {
      if (e instanceof Error) errors.push(e)
    })

    expect(errors).toHaveLength(3)
    for (const e of errors) {
      expect(e.message).not.toContain(sandboxCreds.api_key)
      expect(e.message).not.toContain(sandboxCreds.user_id)
      expect(e.message).not.toContain(sandboxCreds.subscription_key)
    }
  })
})
