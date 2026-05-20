import { randomUUID } from 'crypto'

import type { BakeryMomoCredentials } from '../credentials'

/**
 * MTN Mobile Money (Collections) provider client.
 *
 * This file deliberately keeps every error message generic. NEVER include
 * credential plaintext, bearer tokens, request bodies, or response bodies in
 * any thrown error — those propagate to logs/telemetry and would leak
 * secrets. We surface the HTTP status (or a stable category) and nothing
 * else.
 *
 * Token caching is process-local. The cache key is a stable digest of the
 * (subscription_key, user_id, target_environment) tuple so different
 * bakeries get distinct cache entries even though we never see the bakery
 * ID directly. Tokens are reused until they are within 60 seconds of
 * expiring, then refreshed.
 */

const SANDBOX_BASE_URL = 'https://sandbox.momodeveloper.mtn.com'
const PRODUCTION_BASE_URL = 'https://proxy.momoapi.mtn.com'

/**
 * X-Target-Environment header value per environment. MTN's sandbox uses
 * the literal string `sandbox`; production uses the country-specific
 * environment identifier — for Uganda this is `mtnuganda`.
 */
const TARGET_ENVIRONMENT_HEADER: Record<
  BakeryMomoCredentials['target_environment'],
  string
> = {
  sandbox: 'sandbox',
  production: 'mtnuganda',
}

/** Default request timeout (ms). External calls must not hang the API. */
const DEFAULT_TIMEOUT_MS = 10_000

/** Seconds-of-buffer before token expiry at which we force a refresh. */
const TOKEN_EXPIRY_BUFFER_SECONDS = 60

export interface MomoRequestToPayInput {
  /** Decimal amount as a string, e.g. "10000". MTN requires string. */
  amount: string
  currency: 'UGX'
  /** Our internal reference — typically the payment row id. */
  externalId: string
  /** Payer MSISDN, may include leading "+"; we normalise before sending. */
  payerMsisdn: string
  payerMessage: string
  payeeNote: string
}

export interface MomoPaymentStatus {
  status: 'success' | 'failed' | 'pending'
  /** MTN-side settled transaction id, only present on success. */
  financialTransactionId?: string
  /** Failure reason summary, only present on failure. */
  reason?: string
}

interface MomoTokenResponse {
  access_token: string
  expires_in: number
}

interface CachedToken {
  token: string
  /** Absolute expiry timestamp (ms since epoch). */
  expiresAt: number
}

/**
 * Process-local token cache. Exported only so tests can clear it between
 * cases; production code should never read or write this directly.
 */
export const __momoTokenCache = new Map<string, CachedToken>()

/** Reset the token cache. Test-only helper. */
export function __resetMomoTokenCacheForTests(): void {
  __momoTokenCache.clear()
}

export class MomoTokenError extends Error {
  override readonly name = 'MomoTokenError'
}

export class MomoPaymentError extends Error {
  override readonly name = 'MomoPaymentError'
}

export class MomoStatusError extends Error {
  override readonly name = 'MomoStatusError'
}

/**
 * Strip a leading "+" from an MSISDN. MTN MoMo expects the partyId field as
 * a digits-only string (e.g. "256780123456"), not E.164 with a plus sign.
 */
function normaliseMsisdn(msisdn: string): string {
  return msisdn.startsWith('+') ? msisdn.slice(1) : msisdn
}

/**
 * Build a cache key for a credential tuple. We avoid using the api_key in
 * the key material itself; the (subscription_key, user_id, target_environment)
 * triple is sufficient to distinguish bakeries and rotates if any of those
 * change.
 */
function cacheKeyFor(creds: BakeryMomoCredentials): string {
  return `${creds.target_environment}|${creds.subscription_key}|${creds.user_id}`
}

/** Run `fetch` with a hard timeout. Throws on abort or network failure. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Map a non-2xx HTTP response to a short, log-safe category string. We
 * deliberately do NOT include the response body — MTN's error envelopes
 * sometimes echo request data.
 */
function categoriseHttpError(status: number): string {
  if (status === 401 || status === 403) return 'unauthorized'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server_error'
  return 'request_failed'
}

export class MomoClient {
  private readonly creds: BakeryMomoCredentials
  private readonly baseUrl: string
  private readonly targetEnvHeader: string
  private readonly timeoutMs: number

  constructor(creds: BakeryMomoCredentials, options: { timeoutMs?: number } = {}) {
    this.creds = creds
    this.baseUrl = this.getBaseUrl()
    this.targetEnvHeader = TARGET_ENVIRONMENT_HEADER[creds.target_environment]
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  /**
   * Get a bearer token for the Collections API, using the in-process cache
   * when one is available and not within the expiry buffer.
   */
  async getToken(): Promise<string> {
    const key = cacheKeyFor(this.creds)
    const now = Date.now()
    const cached = __momoTokenCache.get(key)
    if (cached && cached.expiresAt - TOKEN_EXPIRY_BUFFER_SECONDS * 1000 > now) {
      return cached.token
    }

    const basic = Buffer.from(`${this.creds.user_id}:${this.creds.api_key}`).toString(
      'base64',
    )

    let response: Response
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/collection/token/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Ocp-Apim-Subscription-Key': this.creds.subscription_key,
            'Content-Length': '0',
          },
        },
        this.timeoutMs,
      )
    } catch {
      // Network failure, timeout, DNS, etc. — no credential material in the
      // error message.
      throw new MomoTokenError('Failed to obtain MoMo access token (network error)')
    }

    if (!response.ok) {
      throw new MomoTokenError(
        `Failed to obtain MoMo access token (${categoriseHttpError(response.status)})`,
      )
    }

    let parsed: MomoTokenResponse
    try {
      parsed = (await response.json()) as MomoTokenResponse
    } catch {
      throw new MomoTokenError('Failed to obtain MoMo access token (invalid response)')
    }

    if (typeof parsed.access_token !== 'string' || typeof parsed.expires_in !== 'number') {
      throw new MomoTokenError('Failed to obtain MoMo access token (malformed response)')
    }

    const expiresAt = Date.now() + parsed.expires_in * 1000
    __momoTokenCache.set(key, { token: parsed.access_token, expiresAt })
    return parsed.access_token
  }

  /**
   * Submit a request-to-pay. Provider returns 202 with an empty body on
   * success — the customer is then prompted on their phone to authorise.
   */
  async requestToPay(
    providerReference: string,
    input: MomoRequestToPayInput,
  ): Promise<void> {
    const token = await this.getToken()

    const body = {
      amount: input.amount,
      currency: input.currency,
      externalId: input.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: normaliseMsisdn(input.payerMsisdn),
      },
      payerMessage: input.payerMessage,
      payeeNote: input.payeeNote,
    }

    let response: Response
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': providerReference,
            'X-Target-Environment': this.targetEnvHeader,
            'Ocp-Apim-Subscription-Key': this.creds.subscription_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        this.timeoutMs,
      )
    } catch {
      throw new MomoPaymentError('Failed to submit MoMo payment request (network error)')
    }

    // MTN documents 202 Accepted for successful request submission. Some
    // gateways respond 200 in test environments — accept either as a
    // successful submission; everything else is an error.
    if (response.status !== 202 && response.status !== 200) {
      throw new MomoPaymentError(
        `Failed to submit MoMo payment request (${categoriseHttpError(response.status)})`,
      )
    }
  }

  /**
   * Poll the status of a previously-submitted request-to-pay. Maps MTN's
   * uppercase status enum to our lowercase trio.
   */
  async getRequestStatus(providerReference: string): Promise<MomoPaymentStatus> {
    const token = await this.getToken()

    let response: Response
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(providerReference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.targetEnvHeader,
            'Ocp-Apim-Subscription-Key': this.creds.subscription_key,
          },
        },
        this.timeoutMs,
      )
    } catch {
      throw new MomoStatusError('Failed to fetch MoMo payment status (network error)')
    }

    if (!response.ok) {
      throw new MomoStatusError(
        `Failed to fetch MoMo payment status (${categoriseHttpError(response.status)})`,
      )
    }

    let parsed: unknown
    try {
      parsed = await response.json()
    } catch {
      throw new MomoStatusError('Failed to fetch MoMo payment status (invalid response)')
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new MomoStatusError('Failed to fetch MoMo payment status (malformed response)')
    }

    const payload = parsed as Record<string, unknown>
    const rawStatus = typeof payload['status'] === 'string' ? payload['status'] : ''
    const financialTransactionId =
      typeof payload['financialTransactionId'] === 'string'
        ? payload['financialTransactionId']
        : undefined
    const reason = this.extractReason(payload)

    switch (rawStatus.toUpperCase()) {
      case 'SUCCESSFUL':
      case 'SUCCESS': {
        const result: MomoPaymentStatus = { status: 'success' }
        if (financialTransactionId !== undefined) {
          result.financialTransactionId = financialTransactionId
        }
        return result
      }
      case 'FAILED':
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED': {
        const result: MomoPaymentStatus = { status: 'failed' }
        if (reason !== undefined) {
          result.reason = reason
        }
        return result
      }
      case 'PENDING':
      case '':
      default:
        return { status: 'pending' }
    }
  }

  /** Resolve the per-environment base URL. */
  private getBaseUrl(): string {
    return this.creds.target_environment === 'production'
      ? PRODUCTION_BASE_URL
      : SANDBOX_BASE_URL
  }

  /**
   * MTN sometimes returns the failure detail as a top-level `reason` string
   * and sometimes as an object with a `code`/`message`. Normalise to a
   * short human string. We deliberately avoid echoing arbitrary fields to
   * keep error logs tidy.
   */
  private extractReason(payload: Record<string, unknown>): string | undefined {
    const reason = payload['reason']
    if (typeof reason === 'string') return reason
    if (typeof reason === 'object' && reason !== null) {
      const obj = reason as Record<string, unknown>
      if (typeof obj['code'] === 'string') return obj['code']
      if (typeof obj['message'] === 'string') return obj['message']
    }
    return undefined
  }
}

/**
 * Generate a fresh X-Reference-Id for a payment initiation. Helper exposed
 * so callers don't reinvent the wheel; never reuse the result.
 */
export function newMomoProviderReference(): string {
  return randomUUID()
}
