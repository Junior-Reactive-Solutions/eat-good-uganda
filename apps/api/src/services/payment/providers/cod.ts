/**
 * Cash on Delivery (COD) payment provider.
 *
 * COD is a simple payment method where the customer pays the bakery
 * when the order is delivered. No API integration needed.
 */

export interface CodPaymentInput {
  orderId: string
  amountMinor: number
}

export interface CodPaymentResult {
  paymentId: string
  status: 'initiated'
  message: string
}

/**
 * Initiate a COD payment.
 *
 * For COD, the order remains in pending state but with a COD payment method.
 * The bakery is responsible for collecting cash on delivery.
 */
export function initiateCodPayment(
  _input: CodPaymentInput,
  paymentId: string,
): CodPaymentResult {
  return {
    paymentId,
    status: 'initiated',
    message:
      'Order confirmed. Payment will be collected upon delivery. Keep your phone ready for the bakery to call.',
  }
}

/**
 * Validate COD payment prerequisites.
 * COD is always available - no configuration needed.
 */
export function validateCodAvailable(): { available: true } {
  return { available: true }
}
