/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressForm } from './AddressForm'
import type { CustomerAddress } from '@eatgood/shared'

describe('AddressForm', () => {
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

  it('renders form with empty fields when address is null', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={null} onSubmit={onSubmit} />)

    expect(screen.getByPlaceholderText('123 Main St')).toHaveValue('')
    expect(screen.getByPlaceholderText('Kampala')).toHaveValue('')
  })

  it('renders form with populated fields when address exists', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={mockAddress} onSubmit={onSubmit} />)

    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Kampala')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Makindye')).toBeInTheDocument()
    expect(screen.getByDisplayValue('00256')).toBeInTheDocument()
  })

  it('renders checkbox fields with default values', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const deliveryCheckbox = screen.getByRole('checkbox', { name: /deliveries/i }) as HTMLInputElement
    expect(deliveryCheckbox.checked).toBe(true)
  })

  it('renders checkbox fields with saved values', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={mockAddress} onSubmit={onSubmit} />)

    const deliveryCheckbox = screen.getByRole('checkbox', { name: /deliveries/i }) as HTMLInputElement
    const billingCheckbox = screen.getByRole('checkbox', { name: /billing/i }) as HTMLInputElement
    const defaultCheckbox = screen.getByRole('checkbox', { name: /default/i }) as HTMLInputElement

    expect(deliveryCheckbox.checked).toBe(true)
    expect(billingCheckbox.checked).toBe(false)
    expect(defaultCheckbox.checked).toBe(true)
  })

  it('validates required street_address field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument()
    })
  })

  it('validates required city field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('City is required')).toBeInTheDocument()
    })
  })

  it('validates required district field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('District is required')).toBeInTheDocument()
    })
  })

  it('validates postal_code max length', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const cityField = screen.getByPlaceholderText('Kampala')
    const districtField = screen.getByPlaceholderText('Makindye')
    const postalField = screen.getByPlaceholderText('00256')

    await user.type(streetField, '123 Main St')
    await user.type(cityField, 'Kampala')
    await user.type(districtField, 'Makindye')
    await user.type(postalField, 'a'.repeat(21))

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/String must contain at most 20 character/)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const cityField = screen.getByPlaceholderText('Kampala')
    const districtField = screen.getByPlaceholderText('Makindye')

    await user.type(streetField, '456 Elm St')
    await user.type(cityField, 'Nakawa')
    await user.type(districtField, 'Nakawa')

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          street_address: '456 Elm St',
          city: 'Nakawa',
          district: 'Nakawa',
        })
      )
    })
  })

  it('disables form when isLoading is true', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={mockAddress} onSubmit={onSubmit} isLoading={true} />)

    const streetField = screen.getByDisplayValue('123 Main St') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /Saving/i })

    expect(streetField.disabled).toBe(true)
    expect(submitButton).toBeDisabled()
  })

  it('shows "Update Address" button text when editing', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={mockAddress} onSubmit={onSubmit} />)

    expect(screen.getByRole('button', { name: /Update Address/i })).toBeInTheDocument()
  })

  it('shows "Add Address" button text when creating', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={null} onSubmit={onSubmit} />)

    expect(screen.getByRole('button', { name: /^Add Address$/ })).toBeInTheDocument()
  })

  it('handles checkbox toggling for address type flags', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const billingCheckbox = screen.getByRole('checkbox', { name: /billing/i })

    expect((billingCheckbox as HTMLInputElement).checked).toBe(false)

    await user.click(billingCheckbox)

    expect((billingCheckbox as HTMLInputElement).checked).toBe(true)
  })

  it('submits all checkbox values correctly', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const cityField = screen.getByPlaceholderText('Kampala')
    const districtField = screen.getByPlaceholderText('Makindye')
    const billingCheckbox = screen.getByRole('checkbox', { name: /billing/i })
    const defaultCheckbox = screen.getByRole('checkbox', { name: /default/i })

    await user.type(streetField, '123 Main St')
    await user.type(cityField, 'Kampala')
    await user.type(districtField, 'Makindye')
    await user.click(billingCheckbox)
    await user.click(defaultCheckbox)

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          is_delivery_address: true,
          is_billing_address: true,
          is_default: true,
        })
      )
    })
  })

  it('has proper aria labels for checkboxes', () => {
    const onSubmit = vi.fn()
    render(<AddressForm address={mockAddress} onSubmit={onSubmit} />)

    const deliveryCheckbox = screen.getByRole('checkbox', { name: /deliveries/i })
    expect(deliveryCheckbox).toBeInTheDocument()
  })

  it('handles address with null postal code', () => {
    const addressWithoutPostal: CustomerAddress = {
      ...mockAddress,
      postal_code: null,
    }

    const onSubmit = vi.fn()
    render(<AddressForm address={addressWithoutPostal} onSubmit={onSubmit} />)

    const postalField = screen.getByPlaceholderText('00256') as HTMLInputElement
    expect(postalField.value).toBe('')
  })

  it('shows aria-invalid on fields with errors', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const submitButton = screen.getByRole('button', { name: /Add Address/i })

    await user.click(submitButton)

    await waitFor(() => {
      expect(streetField).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('clears error when user corrects field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const submitButton = screen.getByRole('button', { name: /Add Address/i })

    // Trigger error
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument()
    })

    // Fix error
    await user.type(streetField, '123 Main St')
    expect(screen.queryByText('Street address is required')).not.toBeInTheDocument()
  })

  it('handles form submission with all fields populated', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<AddressForm address={null} onSubmit={onSubmit} />)

    const streetField = screen.getByPlaceholderText('123 Main St')
    const cityField = screen.getByPlaceholderText('Kampala')
    const districtField = screen.getByPlaceholderText('Makindye')
    const postalField = screen.getByPlaceholderText('00256')

    await user.type(streetField, '789 Oak Ave')
    await user.type(cityField, 'Jinja')
    await user.type(districtField, 'Jinja')
    await user.type(postalField, '00123')

    const submitButton = screen.getByRole('button', { name: /Add Address/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          street_address: '789 Oak Ave',
          city: 'Jinja',
          district: 'Jinja',
          postal_code: '00123',
        })
      )
    })
  })
})
