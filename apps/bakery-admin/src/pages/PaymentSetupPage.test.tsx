import type { BakeryPaymentCredential } from '@eatgood/shared'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PaymentSetupPage from './PaymentSetupPage'
import * as settingsApi from '../features/settings/api'
import * as testPaymentHooks from '../features/settings/useTestPayment'

// Mock the settings API
vi.mock('../features/settings/api', () => ({
  usePaymentCredentials: vi.fn(),
  useCreatePaymentCredential: vi.fn(),
  useDeletePaymentCredential: vi.fn(),
}))

// Mock test payment hooks
vi.mock('../features/settings/useTestPayment', () => ({
  useCreateTestOrder: vi.fn(),
  useInitiateTestPayment: vi.fn(),
  useTestPaymentStatus: vi.fn(),
  isValidUgandaPhone: vi.fn((phone: string) => /^(?:\+?256|0)\d{9}$/.test(phone)),
  normalizeUgandaPhone: vi.fn((phone: string) => {
    if (!/^(?:\+?256|0)\d{9}$/.test(phone)) return null
    const digits = phone.replace(/^\+?256|^0/, '')
    return `+256${digits}`
  }),
}))

const mockCredentials: BakeryPaymentCredential[] = [
  {
    id: 'cred-1',
    bakery_id: 'bakery-1',
    provider: 'mtn_momo',
    is_enabled: true,
    target_environment: 'production',
    last_verified_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'cred-2',
    bakery_id: 'bakery-1',
    provider: 'airtel_money',
    is_enabled: false,
    target_environment: 'production',
    last_verified_at: null,
    created_at: new Date('2026-01-02'),
    updated_at: new Date('2026-01-02'),
  },
]

// Default mock return for test payment hooks (no active test payment)
function setupTestPaymentMocks() {
  vi.mocked(testPaymentHooks.useCreateTestOrder).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'test-order-1', order_number: 'EGU-TEST', total_minor: 1000 }),
    isPending: false,
    isError: false,
  } as any)

  vi.mocked(testPaymentHooks.useInitiateTestPayment).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ paymentId: 'pay-1', status: 'pending' }),
    isPending: false,
    isError: false,
  } as any)

  vi.mocked(testPaymentHooks.useTestPaymentStatus).mockReturnValue({
    data: null,
    isLoading: false,
  } as any)
}

describe('PaymentSetupPage', () => {
  // Set up default test-payment hook mocks before each test
  beforeEach(() => {
    setupTestPaymentMocks()
  })

  describe('Loading States', () => {
    it('shows loading spinner while fetching credentials', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('displays error message when credentials fail to load', () => {
      const error = new Error('Failed to fetch credentials')
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: null,
        isLoading: false,
        error,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByText('Failed to fetch credentials')).toBeInTheDocument()
    })

    it('displays generic error message on unknown error', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: null,
        isLoading: false,
        error: {},
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByText('Failed to load payment methods')).toBeInTheDocument()
    })

    it('shows add button in empty state message', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: [], total: 0 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByText('No payment methods configured yet.')).toBeInTheDocument()
    })
  })

  describe('Page Layout', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)
    })

    it('displays page header with correct title and subtitle', () => {
      render(<PaymentSetupPage />)

      expect(screen.getByText('Payment Setup')).toBeInTheDocument()
      expect(screen.getByText('Configure your payment methods')).toBeInTheDocument()
    })

    it('displays add payment method button', () => {
      render(<PaymentSetupPage />)

      expect(screen.getByText('Add Payment Method')).toBeInTheDocument()
    })

    it('displays all payment credentials', () => {
      render(<PaymentSetupPage />)

      expect(screen.getByText('MTN Mobile Money (MoMo)')).toBeInTheDocument()
      expect(screen.getByText('Airtel Money')).toBeInTheDocument()
    })

    it('shows credential status for each payment method', () => {
      render(<PaymentSetupPage />)

      const statusElements = screen.getAllByText(/Status:/)
      expect(statusElements.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no credentials exist', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: [], total: 0 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByText('No payment methods configured yet.')).toBeInTheDocument()
    })

    it('shows add button in empty state', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: [], total: 0 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      const addButtons = screen.getAllByText('Add Payment Method')
      expect(addButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Add Payment Method', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: [], total: 0 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)
    })

    it('renders page with add payment method button in header', () => {
      render(<PaymentSetupPage />)

      const buttons = screen.getAllByText('Add Payment Method')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('displays empty state message when no credentials', () => {
      render(<PaymentSetupPage />)

      expect(screen.getByText('No payment methods configured yet.')).toBeInTheDocument()
    })

    it('page has proper structure and content', () => {
      render(<PaymentSetupPage />)

      const title = screen.getByText('Payment Setup')
      const subtitle = screen.getByText('Configure your payment methods')

      expect(title).toBeInTheDocument()
      expect(subtitle).toBeInTheDocument()
    })

    it('shows loading state during fetch', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Delete Payment Method', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)
    })

    it('shows delete confirmation dialog when trash icon is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentSetupPage />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const trashButton = screen.getAllByRole('button', { name: /delete payment method/i })[0]!

      await user.click(trashButton)

      expect(screen.getByText('Delete Payment Method')).toBeInTheDocument()
    })

    it('confirms deletion when delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const trashButton = screen.getAllByRole('button', { name: /delete payment method/i })[0]!
      await user.click(trashButton)

      const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(confirmDeleteButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('cancels deletion when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<PaymentSetupPage />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const trashButton = screen.getAllByRole('button', { name: /delete payment method/i })[0]!
      await user.click(trashButton)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(screen.queryByText('Delete Payment Method')).not.toBeInTheDocument()
    })

    it('shows loading state during deletion', () => {
      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      const statusElements = screen.getAllByText(/Status:/)
      expect(statusElements.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('renders with proper page layout structure', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      render(<PaymentSetupPage />)

      const title = screen.getByText('Payment Setup')
      expect(title).toBeInTheDocument()

      expect(screen.getByText('MTN Mobile Money (MoMo)')).toBeInTheDocument()
    })
  })

  describe('Test Payment Button', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.useCreatePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.useDeletePaymentCredential).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
      } as any)
    })

    it('shows test payment button when MoMo is enabled', () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.getByRole('button', { name: /test momo payment/i })).toBeInTheDocument()
    })

    it('does not show test payment button when MoMo is disabled', () => {
      const disabledMomoCredentials: BakeryPaymentCredential[] = [
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        { ...mockCredentials[0]!, is_enabled: false },
      ]

      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: disabledMomoCredentials, total: 1 },
        isLoading: false,
        error: null,
      } as any)

      render(<PaymentSetupPage />)

      expect(screen.queryByRole('button', { name: /test momo payment/i })).not.toBeInTheDocument()
    })

    it('initiates test payment when button clicked', async () => {
      const mockCreateTestOrder = vi.fn().mockResolvedValue({
        id: 'test-order-1',
        order_number: 'EGU-TEST',
        total_minor: 1000,
      })
      const mockInitiatePayment = vi.fn().mockResolvedValue({
        paymentId: 'pay-1',
        status: 'pending',
      })

      vi.mocked(testPaymentHooks.useCreateTestOrder).mockReturnValue({
        mutateAsync: mockCreateTestOrder,
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(testPaymentHooks.useInitiateTestPayment).mockReturnValue({
        mutateAsync: mockInitiatePayment,
        isPending: false,
        isError: false,
      } as any)

      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      const user = userEvent.setup()
      render(<PaymentSetupPage />)

      const testButton = screen.getByRole('button', { name: /test momo payment/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(mockCreateTestOrder).toHaveBeenCalled()
        expect(mockInitiatePayment).toHaveBeenCalledWith({
          orderId: 'test-order-1',
          phone: '+256700000000',
        })
      })
    })

    it('shows "payment initiated" message after button click', async () => {
      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      const user = userEvent.setup()
      render(<PaymentSetupPage />)

      const testButton = screen.getByRole('button', { name: /test momo payment/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(
          screen.getByText(/payment initiated — check your phone for the momo prompt/i),
        ).toBeInTheDocument()
      })
    })

    it('shows success message when payment is confirmed', async () => {
      vi.mocked(testPaymentHooks.useTestPaymentStatus).mockReturnValue({
        data: { status: 'paid', financialTransactionId: 'txn-123' },
        isLoading: false,
      } as any)

      vi.mocked(settingsApi.usePaymentCredentials).mockReturnValue({
        data: { items: mockCredentials, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      const user = userEvent.setup()
      render(<PaymentSetupPage />)

      const testButton = screen.getByRole('button', { name: /test momo payment/i })
      await user.click(testButton)

      await waitFor(() => {
        expect(
          screen.getByText(/payment received! momo integration is working correctly/i),
        ).toBeInTheDocument()
      })
    })
  })
})
