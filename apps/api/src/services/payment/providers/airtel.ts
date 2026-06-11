import { randomUUID } from 'crypto'

/**
 * Airtel Money Collections provider client.
 *
 * This file deliberately keeps every error message generic. NEVER include
 * credential plaintext, bearer tokens, request bodies, or response bodies in
 * any thrown error — those propagate to logs/telemetry and would leak
 * secrets. We surface the HTTP status (or a stable category) and nothing
 * else.
 */

const STAGING_BASE_URL = 'https://openapi.airtel.africa'
const PRODUCTION_BASE_URL = 'https://openapi.airtel.africa'

export interface AirtelRequestToPayInput {
  amount: string
  currency: 'UGX'
  externalId: string
  payerPhone: string
  payerMessage: string
  payeeNote: string
}

export interface AirtelPaymentStatus {
  status: 'success' | 'failed' | 'pending'
  transactionId?: string
  reason?: string
}

export class AirtelClient {
  private clientId: string
  private clientSecret: string
  private targetEnv: 'staging' | 'production'
  private country: string

  constructor(
    clientId: string,
    clientSecret: string,
    targetEnv: 'staging' | 'production',
    country: string,
  ) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.targetEnv = targetEnv
    this.country = country
  }

  /**
   * Initiate a payment collection request via Airtel Money Collections API.
   * https://airtel.gitbook.io/airtel-online-payments/online-payments-collections
   */
  async requestToPay(input: AirtelRequestToPayInput): Promise<{
    referenceId: string
    status: 'pending'
  }> {
    const baseUrl =
      this.targetEnv === 'staging' ? STAGING_BASE_URL : PRODUCTION_BASE_URL

    const url = `${baseUrl}/merchant/v2/payments/`

    // Generate idempotency key for Airtel
    const referenceId = randomUUID()

    const body = {
      reference: referenceId,
      subscriber: {
        country: this.country,
        currency: input.currency,
        msisdn: this.normalizePhoneNumber(input.payerPhone),
      },
      transaction: {
        amount: input.amount,
        id: input.externalId,
        type: 'BusinessPayment',
      },
      pin: '', // PIN handling is merchant-specific; empty for API auth
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getToken()}`,
          'X-Country': this.country,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        // Don't include response body in error
        throw new AirtelPaymentError(
          `Airtel API error: ${response.status}`,
          'provider_error',
        )
      }

      // Response format from Airtel
      const data = (await response.json()) as {
        data?: { transaction_id?: string }
        status?: string
      }

      // Airtel returns 'DP00000200' for pending/success
      return {
        referenceId,
        status: 'pending',
      }
    } catch (error) {
      if (error instanceof AirtelPaymentError) {
        throw error
      }
      throw new AirtelPaymentError(
        'Failed to initiate Airtel payment',
        'provider_error',
      )
    }
  }

  /**
   * Query payment status from Airtel.
   * In production, this would poll the Airtel status endpoint.
   * For now, we rely on webhook callbacks.
   */
  async getPaymentStatus(
    _referenceId: string,
  ): Promise<AirtelPaymentStatus> {
    // Airtel uses webhooks for status updates
    // This is a placeholder for direct status queries if needed
    return {
      status: 'pending',
    }
  }

  /**
   * Get authentication token from Airtel (in production, would cache).
   * Uses Basic Auth with client_id:client_secret.
   */
  private async getToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64')

    const baseUrl =
      this.targetEnv === 'staging' ? STAGING_BASE_URL : PRODUCTION_BASE_URL

    try {
      const response = await fetch(`${baseUrl}/auth/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
      })

      if (!response.ok) {
        throw new AirtelTokenError('Failed to get Airtel token')
      }

      const data = (await response.json()) as { access_token?: string }
      if (!data.access_token) {
        throw new AirtelTokenError('No access token in Airtel response')
      }

      return data.access_token
    } catch (error) {
      if (error instanceof AirtelTokenError) {
        throw error
      }
      throw new AirtelTokenError('Failed to authenticate with Airtel')
    }
  }

  /**
   * Normalize Ugandan phone number to E.164 format (+256XXXXXXXXX).
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove any non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '')

    // Remove leading + if present
    if (normalized.startsWith('+')) {
      normalized = normalized.slice(1)
    }

    // Handle local format (0XXXXXXXXX) → +256XXXXXXXXX
    if (normalized.startsWith('0') && normalized.length === 10) {
      normalized = '256' + normalized.slice(1)
    }

    // Handle format without country code (XXXXXXXXX) → +256XXXXXXXXX
    if (!normalized.startsWith('256') && normalized.length === 9) {
      normalized = '256' + normalized
    }

    // Ensure it starts with 256 (Uganda country code)
    if (!normalized.startsWith('256')) {
      throw new AirtelPaymentError(
        'Invalid phone number format',
        'validation_error',
      )
    }

    return `+${normalized}`
  }
}

export class AirtelPaymentError extends Error {
  constructor(
    message: string,
    public category: 'validation_error' | 'provider_error' | 'config_error',
  ) {
    super(message)
    this.name = 'AirtelPaymentError'
  }
}

export class AirtelTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AirtelTokenError'
  }
}

export function newAirtelProviderReference(): string {
  return randomUUID()
}
