/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { StaffFormModal } from '../StaffFormModal'

import * as staffApi from '@/features/staff/api'

vi.mock('@/features/staff/api')
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

describe('StaffFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(staffApi.useAddStaffMember).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)
    vi.mocked(staffApi.useUpdateStaffRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  it('should render with empty form in add mode', () => {
    renderWithProviders(
      <StaffFormModal isOpen={true} onClose={vi.fn()} bakeryId="bakery-1" />,
    )
    expect(screen.getByText('Add Staff Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Full Name')).toHaveValue('')
    expect(screen.getByLabelText('Role')).toHaveValue('staff')
  })

  it('should render with initial data in edit mode', () => {
    const mockStaff = {
      id: '1',
      bakery_id: 'bakery-1',
      email: 'john@bakery.com',
      full_name: 'John Doe',
      phone: '+256 700 123 456',
      role: 'manager' as const,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    renderWithProviders(
      <StaffFormModal
        isOpen={true}
        onClose={vi.fn()}
        bakeryId="bakery-1"
        initialData={mockStaff}
      />,
    )

    expect(screen.getByText('Edit Staff Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('john@bakery.com')
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe')
    expect(screen.getByLabelText('Role')).toHaveValue('manager')
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <StaffFormModal isOpen={true} onClose={vi.fn()} bakeryId="bakery-1" />,
    )

    const submitButton = screen.getByText('Add Staff')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockMutate = vi.fn().mockResolvedValue({})
    vi.mocked(staffApi.useAddStaffMember).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
      error: null,
    } as any)

    const onSuccess = vi.fn()
    const onClose = vi.fn()

    renderWithProviders(
      <StaffFormModal
        isOpen={true}
        onClose={onClose}
        bakeryId="bakery-1"
        onSuccess={onSuccess}
      />,
    )

    await user.type(screen.getByLabelText('Email'), 'john@bakery.com')
    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText(/Phone/), '+256 700 123 456')
    await user.selectOptions(screen.getByLabelText('Role'), 'manager')

    await user.click(screen.getByText('Add Staff'))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        bakeryId: 'bakery-1',
        email: 'john@bakery.com',
        fullName: 'John Doe',
        phone: '+256 700 123 456',
        role: 'manager',
      })
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message on submit failure', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Email already exists')
    vi.mocked(staffApi.useAddStaffMember).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isPending: false,
      error: mockError,
    } as any)

    renderWithProviders(
      <StaffFormModal isOpen={true} onClose={vi.fn()} bakeryId="bakery-1" />,
    )

    await user.type(screen.getByLabelText('Email'), 'john@bakery.com')
    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.selectOptions(screen.getByLabelText('Role'), 'staff')

    await user.click(screen.getByText('Add Staff'))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should disable form fields when loading', async () => {
    vi.mocked(staffApi.useAddStaffMember).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      error: null,
    } as any)

    renderWithProviders(
      <StaffFormModal isOpen={true} onClose={vi.fn()} bakeryId="bakery-1" />,
    )

    expect(screen.getByText('Add Staff')).toBeDisabled()
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.mocked(staffApi.useAddStaffMember).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any)

    renderWithProviders(
      <StaffFormModal isOpen={true} onClose={onClose} bakeryId="bakery-1" />,
    )

    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
