import type { BakeryProfile } from '@eatgood/db'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { ShortcutProvider } from '../components/ShortcutProvider'
import { ToastProvider } from '../components/Toast'
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
  timezone: 'Africa/Kampala',
  accepts_pickup: true,
  accepts_delivery: true,
  delivery_fee_minor: 5000,
  delivery_radius_km: 5.5,
  min_order_minor: 10000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

/**
 * BakerySettingsPage uses useBlocker (requires a data router, not just
 * <BrowserRouter>), useShortcutPrefs (requires ShortcutProvider), and
 * useToast (requires ToastProvider, which also renders the actual toast
 * text into the DOM — so toast assertions read real rendered content
 * rather than a mock).
 */
function renderPage() {
  // ShortcutProvider calls useNavigate() internally, so it (and ToastProvider,
  // for consistency) must render inside the router tree, not wrap it.
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <ShortcutProvider>
          <ToastProvider>
            <BakerySettingsPage />
          </ToastProvider>
        </ShortcutProvider>
      ),
    },
  ])
  return render(<RouterProvider router={router} />)
}

describe('BakerySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading States', () => {
    it('shows loading spinner while fetching profile', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument()
    })

    it('displays generic error message when profile load fails with unknown error', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: null,
        isLoading: false,
        error: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      expect(screen.getByText('Failed to load settings')).toBeInTheDocument()
    })

    it('shows a toast when the profile update fails', () => {
      const error = new Error('Failed to update profile')
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: true,
        isSuccess: false,
        error,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
  })

  describe('Success States', () => {
    it('shows a success toast after a successful update', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      expect(screen.getByText('Settings saved successfully.')).toBeInTheDocument()
    })

    it('clears the success toast after its duration elapses', () => {
      vi.useFakeTimers()

      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()
      expect(screen.getByText('Settings saved successfully.')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.queryByText('Settings saved successfully.')).not.toBeInTheDocument()

      vi.useRealTimers()
    })
  })

  describe('Page Layout', () => {
    beforeEach(() => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    })

    it('displays page header with correct title and subtitle', () => {
      renderPage()

      expect(screen.getByText('Bakery Settings')).toBeInTheDocument()
      expect(screen.getByText('Manage your bakery profile and branding')).toBeInTheDocument()
    })

    it('renders form with profile data', () => {
      renderPage()

      expect(screen.getByDisplayValue(mockProfile.legal_name)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockProfile.email)).toBeInTheDocument()
    })

    it('does not show the sticky save bar until the form is dirtied', () => {
      renderPage()

      expect(screen.queryByText('Save changes')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls mutate with form data after dirtying a field and saving', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()

      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      const legalNameInput = screen.getByLabelText('Legal Name *')
      await user.clear(legalNameInput)
      await user.type(legalNameInput, 'New Legal Name')

      const saveButton = await screen.findByText('Save changes')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('disables the save button while the update is pending', async () => {
      const user = userEvent.setup()

      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // A stateful mock: mutate() flips isPending to true, triggering a real
      // re-render — a plain mockReturnValue can't simulate the mutation
      // transitioning into a pending state after it's triggered.
      vi.mocked(settingsApi.useUpdateBakeryProfile).mockImplementation(() => {
        const [isPending, setIsPending] = useState(false)
        return {
          mutate: () => {
            setIsPending(true)
          },
          isPending,
          isError: false,
          isSuccess: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      })

      renderPage()

      const legalNameInput = screen.getByLabelText('Legal Name *')
      await user.clear(legalNameInput)
      await user.type(legalNameInput, 'New Legal Name')

      const saveButton = await screen.findByText('Save changes')
      await user.click(saveButton)

      const savingButton = await screen.findByText('Saving…')
      expect(savingButton).toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('renders with proper page layout structure', () => {
      vi.mocked(settingsApi.useBakeryProfile).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      vi.mocked(settingsApi.useUpdateBakeryProfile).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      const { container } = renderPage()

      const title = screen.getByText('Bakery Settings')
      expect(title).toBeInTheDocument()

      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })
})
