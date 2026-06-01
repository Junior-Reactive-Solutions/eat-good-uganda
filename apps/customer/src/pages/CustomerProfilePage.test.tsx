/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CustomerProfile } from '@eatgood/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as api from '../features/profile/api'

import CustomerProfilePage from './CustomerProfilePage'


vi.mock('../features/profile/api', () => ({
  useCustomerProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
}))

const mockProfile: CustomerProfile = {
  id: 'prof-1',
  user_id: 'user-1',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01',
  bio: 'Test bio',
  avatar_url: null,
  default_address_id: null,
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

describe('CustomerProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading spinner while fetching profile', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      status: 'pending',
      isPending: true,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('displays error message on failed fetch', () => {
    const error = new Error('Failed to fetch profile')

    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isError: true,
      isSuccess: false,
      status: 'error',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument()
  })

  it('displays profile form when profile is loaded', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
  })

  it('displays page header with title and subtitle', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('Update your personal information')).toBeInTheDocument()
  })

  it('calls mutation when form is submitted', async () => {
    const mockMutate = vi.fn()

    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    const user = userEvent.setup()
    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    const firstNameField = screen.getByDisplayValue('John')
    await user.clear(firstNameField)
    await user.type(firstNameField, 'Jane')

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
    })
  })

  it('displays loading state on mutation pending', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('displays error message on mutation failure', () => {
    const error = new Error('Failed to update profile')

    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      error,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
  })

  it('displays success message on mutation success', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
  })

  it('disables form during mutation', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    const firstNameField = screen.getByDisplayValue('John')
    expect(firstNameField.disabled).toBe(true)
  })

  it('renders with profile card container', () => {
    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    const card = screen.getByDisplayValue('John').closest('form')?.closest('div')
    expect(card).toBeInTheDocument()
  })

  it('handles profile with null optional fields', () => {
    const profileWithNulls: CustomerProfile = {
      ...mockProfile,
      bio: null,
      avatar_url: null,
    }

    vi.mocked(api.useCustomerProfile).mockReturnValue({
      data: profileWithNulls,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isPending: false,
    } as any)

    vi.mocked(api.useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any)

    render(<CustomerProfilePage />, { wrapper: createWrapper() })

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
  })
})
