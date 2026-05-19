/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { CustomerDetail } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'


import { UserBanModal } from '../UserBanModal'

import * as usersApi from '@/features/users/api'

vi.mock('@/features/users/api')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  )
}

const mockCustomer: CustomerDetail = {
  id: 'customer-1',
  email: 'john@example.com',
  phone: '+256 700 123 456',
  full_name: 'John Doe',
  is_banned: false,
  ban_reason: undefined,
  banned_at: undefined,
  fraud_flag: false,
  fraud_reason: undefined,
  total_orders: 5,
  total_spent_minor: 150000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const getButtonByText = (text: string) => {
  const elements = screen.getAllByText(text)
  return elements.find((el) => el.tagName === 'BUTTON')
}

describe('UserBanModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usersApi.useBanCustomer).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)
    vi.mocked(usersApi.useUnbanCustomer).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  it('should render ban form if customer not banned', () => {

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={vi.fn()} customer={mockCustomer} />,
    )

    expect(screen.getByRole('heading', { name: 'Ban User' })).toBeInTheDocument()
    expect(screen.getByLabelText('Ban Reason')).toBeInTheDocument()
    expect(screen.getByText(/prevent them from placing orders/i)).toBeInTheDocument()
  })

  it('should render unban form if customer is banned', () => {
    const bannedCustomer: CustomerDetail = {
      ...mockCustomer,
      is_banned: true,
      ban_reason: 'Repeated fraud attempts',
      banned_at: '2026-05-01T00:00:00Z',
    }

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={vi.fn()} customer={bannedCustomer} />,
    )

    const unbanButtons = screen.getAllByText('Unban User')
    expect(unbanButtons.length).toBeGreaterThan(0)
    expect(screen.getByText('Banned')).toBeInTheDocument()
    expect(screen.getByText('Repeated fraud attempts')).toBeInTheDocument()
  })

  it('should validate ban reason min length', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={vi.fn()} customer={mockCustomer} />,
    )

    const reasonField = screen.getByLabelText('Ban Reason')
    await user.type(reasonField, 'Short')

    const banButton = getButtonByText('Ban User')
    if (banButton) {
      await user.click(banButton)
    }

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('should submit ban request with valid reason', async () => {
    const user = userEvent.setup()
    const mockMutate = vi.fn().mockResolvedValue({})
    vi.mocked(usersApi.useBanCustomer).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
      error: null,
    } as any)

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    renderWithProviders(
      <UserBanModal
        isOpen={true}
        onClose={onClose}
        customer={mockCustomer}
        onSuccess={onSuccess}
      />,
    )

    const reasonField = screen.getByLabelText('Ban Reason')
    await user.type(reasonField, 'This user engaged in fraudulent transactions')

    const banButton = getButtonByText('Ban User')
    if (banButton) {
      await user.click(banButton)
    }

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        customerId: 'customer-1',
        reason: 'This user engaged in fraudulent transactions',
      })
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should submit unban request when unbanning', async () => {
    const user = userEvent.setup()
    const mockMutate = vi.fn().mockResolvedValue({})
    vi.mocked(usersApi.useUnbanCustomer).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
      error: null,
    } as any)

    const bannedCustomer: CustomerDetail = {
      ...mockCustomer,
      is_banned: true,
      ban_reason: 'Test reason',
      banned_at: '2026-05-01T00:00:00Z',
    }

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    renderWithProviders(
      <UserBanModal
        isOpen={true}
        onClose={onClose}
        customer={bannedCustomer}
        onSuccess={onSuccess}
      />,
    )

    const unbanButtons = screen.getAllByText('Unban User')
    const buttonToClick = unbanButtons.find((el) => el.tagName === 'BUTTON')
    if (buttonToClick) {
      await user.click(buttonToClick)
    }

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('customer-1')
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show error on ban failure', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Failed to ban user')
    vi.mocked(usersApi.useBanCustomer).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isPending: false,
      error: mockError,
    } as any)

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={vi.fn()} customer={mockCustomer} />,
    )

    const reasonField = screen.getByLabelText('Ban Reason')
    await user.type(reasonField, 'This user engaged in fraudulent transactions')
    const banButton = getButtonByText('Ban User')
    if (banButton) {
      await user.click(banButton)
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to ban user')).toBeInTheDocument()
    })
  })

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.mocked(usersApi.useBanCustomer).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={onClose} customer={mockCustomer} />,
    )

    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should disable button when loading', () => {
    vi.mocked(usersApi.useBanCustomer).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      error: null,
    } as any)

    renderWithProviders(
      <UserBanModal isOpen={true} onClose={vi.fn()} customer={mockCustomer} />,
    )

    const submitButton = getButtonByText('Ban User')
    expect(submitButton).toBeDisabled()
  })
})
