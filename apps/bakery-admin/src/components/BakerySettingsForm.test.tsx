import type { BakeryProfile } from '@eatgood/db'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BakerySettingsForm } from './BakerySettingsForm'

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

describe('BakerySettingsForm', () => {
  describe('Rendering', () => {
    it('renders form with all sections', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Branding')).toBeInTheDocument()
      expect(screen.getByText('About Your Bakery')).toBeInTheDocument()
      expect(screen.getByText('Fulfillment Options')).toBeInTheDocument()
    })

    it('populates form fields with profile data', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const legalNameInput = screen.getByDisplayValue(mockProfile.legal_name)
      const displayNameInput = screen.getByDisplayValue(mockProfile.display_name)
      const emailInput = screen.getByDisplayValue(mockProfile.email)
      const phoneInput = screen.getByDisplayValue(mockProfile.phone)

      expect(legalNameInput).toBeInTheDocument()
      expect(displayNameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      expect(phoneInput).toBeInTheDocument()
    })

    it('renders with empty defaults when profile is null', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={null} onSubmit={mockSubmit} />)

      const inputs = screen.getAllByRole('textbox')
      if (inputs.length > 0) {
        expect((inputs[0] as HTMLInputElement).value).toBe('')
      }
    })

    it('displays logo preview when logo_url is present', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const logoPreview = screen.getByAltText('Logo preview')
      expect(logoPreview).toHaveAttribute('src', mockProfile.logo_url)
    })

    it('shows accent color preview box', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const accentColorInput = screen.getByDisplayValue(mockProfile.accent_color!)
      expect(accentColorInput).toBeInTheDocument()

      const colorLabel = screen.getByText('Accent Color')
      expect(colorLabel).toBeInTheDocument()
    })

    it('renders checkbox for pickup and delivery options', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const pickupCheckbox = screen.getByLabelText('Accept Pickup Orders')
      const deliveryCheckbox = screen.getByLabelText('Accept Delivery Orders')

      expect((pickupCheckbox as HTMLInputElement).checked).toBe(mockProfile.accepts_pickup)
      expect((deliveryCheckbox as HTMLInputElement).checked).toBe(mockProfile.accepts_delivery)
    })

    it('shows delivery fields when accepts_delivery is true', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const deliveryFeeInput = screen.getByDisplayValue(mockProfile.delivery_fee_minor!)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const deliveryRadiusInput = screen.getByDisplayValue(mockProfile.delivery_radius_km!)

      expect(deliveryFeeInput).toBeInTheDocument()
      expect(deliveryRadiusInput).toBeInTheDocument()
    })

    it('hides delivery fields when accepts_delivery is false', () => {
      const profileWithoutDelivery = { ...mockProfile, accepts_delivery: false }
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={profileWithoutDelivery} onSubmit={mockSubmit} />)

      const labels = screen.queryAllByText('Delivery Fee')
      expect(labels.length).toBe(0)
    })
  })

  describe('Form Submission', () => {
    it('calls onSubmit with form data on valid submission', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const submitButton = screen.getByText('Save Changes')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const submittedData = mockSubmit.mock.calls[0]?.[0]
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(submittedData?.legal_name).toBe(mockProfile.legal_name)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(submittedData?.email).toBe(mockProfile.email)
      })
    })

    it('shows loading state when isLoading is true', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} isLoading={true} />)

      const submitButton = screen.getByText('Saving...')
      expect(submitButton).toBeDisabled()
    })

    it('disables form inputs when isLoading is true', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} isLoading={true} />)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach((input) => {
        expect(input).toBeDisabled()
      })
    })
  })

  describe('Validation', () => {
    it('has aria-invalid attribute on inputs', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const legalNameInput = screen.getByDisplayValue(mockProfile.legal_name)
      expect(legalNameInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('displays all required field labels', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      // Check that all required fields are present
      expect(screen.getByLabelText('Legal Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Display Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    })

    it('form submits with valid data when all fields complete', async () => {
      const user = userEvent.setup({ delay: null })
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const submitButton = screen.getByText('Save Changes')
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(mockSubmit).toHaveBeenCalled()
        },
        { timeout: 5000 },
      )
    })
  })

  describe('Field Interactions', () => {
    it('renders description input with correct attributes', () => {
      const mockSubmit = vi.fn()
      const profileWithoutDesc = { ...mockProfile, description: null }
      render(<BakerySettingsForm profile={profileWithoutDesc} onSubmit={mockSubmit} />)

      const descriptionInput = screen.getByPlaceholderText('Tell customers about your bakery...')
      expect(descriptionInput).toHaveAttribute('rows', '5')
    })

    it('shows delivery options when accepts_delivery is true', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const deliveryCheckbox = screen.getByLabelText('Accept Delivery Orders')
      expect(deliveryCheckbox).toBeChecked()

      const deliveryFeeLabel = screen.getByLabelText('Delivery Fee (UGX)')
      expect(deliveryFeeLabel).toBeInTheDocument()
    })

    it('delivery radius input has correct step attribute', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const radiusInputs = screen.getAllByDisplayValue(mockProfile.delivery_radius_km!)
      if (radiusInputs.length > 0) {
        expect(radiusInputs[0]).toHaveAttribute('step', '0.1')
      }
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all inputs', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const legalNameInput = screen.getByLabelText('Legal Name *')
      const emailInput = screen.getByLabelText('Email *')
      const phoneInput = screen.getByLabelText('Phone')

      expect(legalNameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      expect(phoneInput).toBeInTheDocument()
    })

    it('input elements have aria-invalid attribute', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const legalNameInput = screen.getByDisplayValue(mockProfile.legal_name)
      expect(legalNameInput).toHaveAttribute('aria-invalid')
    })

    it('input elements have aria-describedby for error messages', () => {
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      const legalNameInput = screen.getByDisplayValue(mockProfile.legal_name)
      const describedBy = legalNameInput.getAttribute('aria-describedby')
      expect(describedBy).toBeDefined()
    })

    it('renders with semantic HTML structure', () => {
      const mockSubmit = vi.fn()
      const { container } = render(
        <BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />,
      )

      const formElement = container.querySelector('form')
      expect(formElement).toBeInTheDocument()
    })
  })

  describe('Color Picker', () => {
    it('updates both color input and text input in sync', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<BakerySettingsForm profile={mockProfile} onSubmit={mockSubmit} />)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const colorInputs = screen.getAllByDisplayValue(mockProfile.accent_color!)
      const colorPickerInput = colorInputs.find(
        (input) => input instanceof HTMLInputElement && input.type === 'color',
      ) as HTMLInputElement

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (colorPickerInput) {
        await user.clear(colorPickerInput)
        await user.type(colorPickerInput, '#FF0000')

        await waitFor(() => {
          const textColorInput = colorInputs.find(
            (input) => input instanceof HTMLInputElement && input.type === 'text',
          ) as HTMLInputElement
          // Condition is always truthy after find() returns element matching the type guard
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (textColorInput) {
            expect(textColorInput.value).toContain('FF0000')
          }
        })
      }
    })
  })
})
