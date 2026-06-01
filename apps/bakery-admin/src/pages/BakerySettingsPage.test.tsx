import type { BakeryProfile } from '@eatgood/db'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import * as settingsApi from '../features/settings/api'

import BakerySettingsPage from './BakerySettingsPage'

// Mock the settings API
vi.mock('../features/settings/api', () => ({
  useBakeryProfile: vi.fn(),
  useUpdateBakeryProfile: vi.fn(),
}))

const mockProfile: BakeryProfile = {
  id: 'bakery-1',
  slug: 'sweet-dreams',
  legal_name: 'Sweet Dreams Bakery Ltd',
  display_name: 'Sweet Dreams',
  email: 'contact@sweetdreams.com',
  phone: '+256700000001',
  address_line1: '123 Baker Street',
  address_line2: 'Suite 100',
  city: 'Kampala',
  country_code: 'UG',
  description: 'A wonderful bakery in Kampala',
  logo_url: 'https://example.com/logo.png',
  accent_color: '#FF5733',
  primary_color: '#FF6B35',
  website: 'https://sweetdreams.com',
  currency_code: 'UGX',
  timezone: 'Africa/Kampala',
  accepts_pickup: true,
  accepts_delivery: true,
  delivery_fee_minor: 5000,
  delivery_radius_km: 5.5,
  min_order_minor: 10000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('BakerySettingsPage', () => {
  describe('Loading States', () => {
    it('shows loading spinner while fetching profile', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      render(<BakerySettingsPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('displays error message when profile fails to load', () => {
      const error = new Error('Failed to fetch profile')
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      render(<BakerySettingsPage />)

      expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument()
    })

    it('displays generic error message when profile load fails with unknown error', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error: {},
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      render(<BakerySettingsPage />)

      expect(screen.getByText('Failed to load settings')).toBeInTheDocument()
    })

    it('displays error message when profile update fails', () => {
      const error = new Error('Failed to update profile')
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: true,
        isSuccess: false,
        error,
      } as any)

      render(<BakerySettingsPage />)

      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
  })

  describe('Success States', () => {
    it('displays success message after successful update', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
      } as any)

      render(<BakerySettingsPage />)

      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument()
    })

    it('clears success message after 3 seconds', async () => {
      vi.useFakeTimers()

      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
      } as any)

      const { rerender } = render(<BakerySettingsPage />)
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument()

      vi.advanceTimersByTime(3000)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      rerender(<BakerySettingsPage />)

      expect(screen.queryByText('Settings saved successfully!')).not.toBeInTheDocument()

      vi.useRealTimers()
    })
  })

  describe('Page Layout', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)
    })

    it('displays page header with correct title and subtitle', () => {
      render(<BakerySettingsPage />)

      expect(screen.getByText('Bakery Settings')).toBeInTheDocument()
      expect(screen.getByText('Manage your bakery profile and branding')).toBeInTheDocument()
    })

    it('renders form with profile data', () => {
      render(<BakerySettingsPage />)

      expect(screen.getByDisplayValue(mockProfile.legal_name)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockProfile.email)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls mutate with form data on submission', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()

      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      render(<BakerySettingsPage />)

      const submitButton = screen.getByText('Save Changes')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('disables form during submission', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        isSuccess: false,
      } as any)

      render(<BakerySettingsPage />)

      const submitButton = screen.getByText('Saving...')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('renders with proper page layout structure', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      const { container } = render(<BakerySettingsPage />)

      const title = screen.getByText('Bakery Settings')
      expect(title).toBeInTheDocument()

      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })
})
