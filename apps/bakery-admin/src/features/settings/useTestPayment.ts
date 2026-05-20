import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

/**
 * Validate a Uganda phone number.
 * Accepts +256XXXXXXXXX, 0XXXXXXXXX, or 256XXXXXXXXX (9 digits after prefix).
 */
export function isValidUgandaPhone(phone: string): boolean {
  return /^(?:\+?256|0)\d{9}$/.test(phone)
}

/**
 * Normalize a Uganda phone number to +256XXXXXXXXX canonical form.
 * Returns null if the number is invalid.
 */
export function normalizeUgandaPhone(phone: string): string | null {
  if (!isValidUgandaPhone(phone)) return null
  const digits = phone.replace(/^\+?256|^0/, '')
  return `+256${digits}`
}

export interface CreateTestOrderResult {
  id: string
  order_number: string
  total_minor: number
}

export interface InitiateTestPaymentInput {
  orderId: string
  phone: string
}

export interface InitiateTestPaymentResult {
  paymentId: string
  status: 'pending' | 'initiated' | 'failed'
  pollUrl?: string
  error?: string
}

export interface TestPaymentStatusResult {
  status: 'pending' | 'paid' | 'failed'
  financialTransactionId?: string
  reason?: string
}

/**
 * Hook: create a minimal test order for payment integration testing.
 * Uses the bakery admin API to create a 1000 UGX test order.
 */
export function useCreateTestOrder() {
  return useMutation({
    mutationFn: async (): Promise<CreateTestOrderResult> => {
      const { data } = await api.post<CreateTestOrderResult>(
        '/v1/bakery/payment-credentials/test-order',
      )
      return data
    },
  })
}

/**
 * Hook: initiate a test MoMo payment for a bakery admin test order.
 * Calls the customer payment endpoint using the bakery session.
 *
 * NOTE: this endpoint requires customer authentication; if the bakery admin
 * session is not cross-authenticated, the server will return 401. The UI
 * handles this by showing an appropriate error to the admin.
 */
export function useInitiateTestPayment() {
  return useMutation({
    mutationFn: async ({
      orderId,
      phone,
    }: InitiateTestPaymentInput): Promise<InitiateTestPaymentResult> => {
      const normalized = normalizeUgandaPhone(phone)
      if (!normalized) {
        throw new Error('Invalid Uganda phone number')
      }
      const { data } = await api.post<InitiateTestPaymentResult>(
        `/v1/customer/orders/${orderId}/pay`,
        { method: 'mtn_momo', phone: normalized },
      )
      return data
    },
  })
}

/**
 * Hook: poll the payment status for a test order.
 * Polls every 2 seconds while pending, stops at paid/failed.
 */
export function useTestPaymentStatus(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['test-payment-status', orderId],
    queryFn: async (): Promise<TestPaymentStatusResult> => {
      const { data } = await api.get<TestPaymentStatusResult>(
        `/v1/customer/orders/${orderId}/payment-status`,
      )
      return data
    },
    enabled: enabled && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'paid' || status === 'failed') return false
      return 2000
    },
    staleTime: 0,
  })
}
