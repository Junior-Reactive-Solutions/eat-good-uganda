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

export interface InitiatePaymentInput {
  orderId: string
  phone: string
  idempotencyKey?: string
}

export interface InitiatePaymentResult {
  paymentId: string
  status: 'pending' | 'initiated' | 'failed'
  pollUrl?: string
  error?: string
}

export interface PaymentStatusResult {
  status: 'pending' | 'paid' | 'failed'
  financialTransactionId?: string
  reason?: string
}

/**
 * Hook: initiate an MTN MoMo payment for a customer order.
 */
export function useInitiateMomoPayment() {
  return useMutation({
    mutationFn: async ({
      orderId,
      phone,
      idempotencyKey,
    }: InitiatePaymentInput): Promise<InitiatePaymentResult> => {
      const normalized = normalizeUgandaPhone(phone)
      if (!normalized) {
        throw new Error('Invalid Uganda phone number')
      }
      const body: Record<string, string> = {
        method: 'mtn_momo',
        phone: normalized,
      }
      if (idempotencyKey) {
        body.idempotencyKey = idempotencyKey
      }
      const { data } = await api.post<InitiatePaymentResult>(
        `/v1/customer/orders/${orderId}/pay`,
        body,
      )
      return data
    },
  })
}

/**
 * Hook: poll the payment status for an order.
 * Polls every 2 seconds while status is pending, stops at paid/failed.
 */
export function usePaymentStatus(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: async (): Promise<PaymentStatusResult> => {
      const { data } = await api.get<PaymentStatusResult>(
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
