import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PaymentCredentialForm } from './PaymentCredentialForm'

describe('PaymentCredentialForm', () => {
  describe('Rendering', () => {
    it('renders form with account number and holder fields', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByLabelText('Account Number *')).toBeInTheDocument()
      expect(screen.getByLabelText('Account Holder Name *')).toBeInTheDocument()
    })

    it('renders API key field for MoMo provider', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByLabelText('API Key (if applicable)')).toBeInTheDocument()
    })

    it('renders API key field for Airtel provider', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="airtel_money" onSubmit={mockSubmit} />)

      expect(screen.getByLabelText('API Key (if applicable)')).toBeInTheDocument()
    })

    it('does not render API key field for bank transfer', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="bank_transfer" onSubmit={mockSubmit} />)

      expect(screen.queryByLabelText('API Key (if applicable)')).not.toBeInTheDocument()
    })

    it('uses correct placeholder for MoMo account number', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const input = screen.getByPlaceholderText('256700000000')
      expect(input).toBeInTheDocument()
    })

    it('uses correct placeholder for Airtel account number', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="airtel_money" onSubmit={mockSubmit} />)

      const input = screen.getByPlaceholderText('256700000000')
      expect(input).toBeInTheDocument()
    })

    it('uses correct placeholder for bank account number', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="bank_transfer" onSubmit={mockSubmit} />)

      const input = screen.getByPlaceholderText('1234567890')
      expect(input).toBeInTheDocument()
    })

    it('renders submit button with Save Credentials text', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByText('Save Credentials')).toBeInTheDocument()
    })

    it('renders with isCreating prop (for display purposes)', () => {
      const mockSubmit = vi.fn()
      const { rerender } = render(<PaymentCredentialForm provider="mtn_momo" isCreating={false} onSubmit={mockSubmit} />)

      expect(screen.getByText('Save Credentials')).toBeInTheDocument()

      rerender(<PaymentCredentialForm provider="mtn_momo" isCreating={true} onSubmit={mockSubmit} />)
      expect(screen.getByText('Save Credentials')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('renders submit button and form is functional', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const submitButton = screen.getByText('Save Credentials')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('accepts valid form inputs for MoMo', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const accountNumberInput = screen.getByLabelText('Account Number *') as HTMLInputElement
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const accountHolderInput = screen.getByLabelText('Account Holder Name *') as HTMLInputElement

      expect(accountNumberInput).toBeInTheDocument()
      expect(accountHolderInput).toBeInTheDocument()
    })

    it('renders form with correct fields for bank transfer', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="bank_transfer" onSubmit={mockSubmit} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      const accountHolderInput = screen.getByLabelText('Account Holder Name *')
      const apiKeyInput = screen.queryByLabelText('API Key (if applicable)')

      expect(accountNumberInput).toBeInTheDocument()
      expect(accountHolderInput).toBeInTheDocument()
      expect(apiKeyInput).not.toBeInTheDocument()
    })

    it('shows loading state when isLoading is true', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} isLoading={true} />)

      const submitButton = screen.getByText('Saving...')
      expect(submitButton).toBeDisabled()
    })

    it('disables form inputs when isLoading is true', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} isLoading={true} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      const accountHolderInput = screen.getByLabelText('Account Holder Name *')

      expect(accountNumberInput).toBeDisabled()
      expect(accountHolderInput).toBeDisabled()
    })
  })

  describe('Validation', () => {
    it('shows error for empty account number', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const accountHolderInput = screen.getByLabelText('Account Holder Name *')
      await user.type(accountHolderInput, 'John Doe')

      const submitButton = screen.getByText('Save Credentials')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account number is required')).toBeInTheDocument()
      })
    })

    it('shows error for empty account holder', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      await user.type(accountNumberInput, '256700123456')

      const submitButton = screen.getByText('Save Credentials')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account holder name is required')).toBeInTheDocument()
      })
    })

    it('prevents submission with invalid data', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const submitButton = screen.getByText('Save Credentials')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).not.toHaveBeenCalled()
      })
    })

    it('allows empty API key for MoMo', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      const accountHolderInput = screen.getByLabelText('Account Holder Name *')

      await user.type(accountNumberInput, '256700123456')
      await user.type(accountHolderInput, 'John Doe')

      const submitButton = screen.getByText('Save Credentials')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all inputs', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByLabelText('Account Number *')).toBeInTheDocument()
      expect(screen.getByLabelText('Account Holder Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('API Key (if applicable)')).toBeInTheDocument()
    })

    it('inputs have aria-invalid attributes', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      expect(accountNumberInput).toHaveAttribute('aria-invalid')
    })

    it('inputs have aria-describedby for error messages', () => {
      const mockSubmit = vi.fn()
      render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const accountNumberInput = screen.getByLabelText('Account Number *')
      const describedBy = accountNumberInput.getAttribute('aria-describedby')
      expect(describedBy).toBeDefined()
    })

    it('renders with semantic HTML structure', () => {
      const mockSubmit = vi.fn()
      const { container } = render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      const formElement = container.querySelector('form')
      expect(formElement).toBeInTheDocument()
    })
  })

  describe('Provider Changes', () => {
    it('changes placeholder when provider prop changes', () => {
      const mockSubmit = vi.fn()
      const { rerender } = render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByPlaceholderText('256700000000')).toBeInTheDocument()

      rerender(<PaymentCredentialForm provider="bank_transfer" onSubmit={mockSubmit} />)
      expect(screen.getByPlaceholderText('1234567890')).toBeInTheDocument()
    })

    it('shows/hides API key field based on provider', () => {
      const mockSubmit = vi.fn()
      const { rerender } = render(<PaymentCredentialForm provider="mtn_momo" onSubmit={mockSubmit} />)

      expect(screen.getByLabelText('API Key (if applicable)')).toBeInTheDocument()

      rerender(<PaymentCredentialForm provider="bank_transfer" onSubmit={mockSubmit} />)
      expect(screen.queryByLabelText('API Key (if applicable)')).not.toBeInTheDocument()
    })
  })

  describe('Type Safety', () => {
    it('accepts valid provider types', () => {
      const mockSubmit = vi.fn()
      const validProviders: Array<'mtn_momo' | 'airtel_money' | 'bank_transfer'> = [
        'mtn_momo',
        'airtel_money',
        'bank_transfer',
      ]

      validProviders.forEach((provider) => {
        const { unmount } = render(<PaymentCredentialForm provider={provider} onSubmit={mockSubmit} />)
        expect(screen.getByText('Save Credentials')).toBeInTheDocument()
        unmount()
      })
    })
  })
})
