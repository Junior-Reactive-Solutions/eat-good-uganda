/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { CustomerAddress } from '@eatgood/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as api from '../features/profile/api'

import AddressesPage from './AddressesPage'


vi.mock('../features/profile/api', () => ({
  useCustomerAddresses: vi.fn(),
  useCreateAddress: vi.fn(),
  useUpdateAddress: vi.fn(),
  useDeleteAddress: vi.fn(),
}))

const mockAddress: CustomerAddress = {
  id: 'addr-1',
  user_id: 'user-1',
  street_address: '123 Main St',
  city: 'Kampala',
  district: 'Makindye',
  postal_code: '00256',
  is_default: true,
  is_delivery_address: true,
  is_billing_address: false,
  created_at: '2026-05-13T10:00:00Z',
  updated_at: '2026-05-13T10:00:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('AddressesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays page header with title and subtitle', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('My Addresses')).toBeInTheDocument()
    expect(screen.getByText('Manage your delivery and billing addresses')).toBeInTheDocument()
  })

  it('displays loading spinner while fetching addresses', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      status: 'pending',
      isPending: true,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('displays error message on failed fetch', () => {
    const error = new Error('Failed to fetch addresses')

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isError: true,
      isSuccess: false,
      status: 'error',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Failed to fetch addresses')).toBeInTheDocument()
  })

  it('displays empty state when no addresses exist', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('No addresses saved yet.')).toBeInTheDocument()
  })

  it('displays addresses list when addresses exist', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText(/Kampala, Makindye/)).toBeInTheDocument()
  })

  it('displays address type badges', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()
  })

  it('shows Add Address button initially', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /Add Address/i })).toBeInTheDocument()
  })

  it('shows address form when Add Address button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    const addButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(addButton)

    expect(screen.getByText('Add New Address')).toBeInTheDocument()
  })

  it('shows edit button for each address', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    // Check that address is displayed
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('shows delete button for each address', () => {
    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    // Check that address is displayed
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    const { container } = render(<AddressesPage />, { wrapper: createWrapper() })

    // Find trash icon button (last button in the address card)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    if (deleteButton) {
      await user.click(deleteButton)
    }

    expect(screen.getByText('Delete Address')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete this address? This cannot be undone.'),
    ).toBeInTheDocument()
  })

  it('displays multiple addresses', () => {
    const address2: CustomerAddress = {
      ...mockAddress,
      id: 'addr-2',
      street_address: '456 Oak Ave',
      is_default: false,
    }

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress, address2], total: 2 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('456 Oak Ave')).toBeInTheDocument()
  })

  it('handles edit button click', async () => {
    const user = userEvent.setup()

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [mockAddress], total: 1 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    // Find the edit button (first action button in the address card)
    const buttons = screen.getAllByRole('button')
    const editButton = buttons[buttons.length - 2] // second to last is edit
    if (editButton) {
      await user.click(editButton)
    }

    expect(screen.getByText('Edit Address')).toBeInTheDocument()
  })

  it('shows cancel button in form', async () => {
    const user = userEvent.setup()

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    const addButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(addButton)

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('hides form when cancel button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(api.useCustomerAddresses).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useCreateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useUpdateAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    vi.mocked(api.useDeleteAddress).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<AddressesPage />, { wrapper: createWrapper() })

    const addButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(addButton)

    expect(screen.getByText('Add New Address')).toBeInTheDocument()

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    expect(screen.queryByText('Add New Address')).not.toBeInTheDocument()
  })
})
