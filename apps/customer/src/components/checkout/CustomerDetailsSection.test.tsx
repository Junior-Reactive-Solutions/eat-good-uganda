import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, it, expect } from 'vitest'

import CustomerDetailsSection from './CustomerDetailsSection'

/**
 * Wrapper component to provide form context for testing
 */
function CustomerDetailsSectionWithForm() {
  const methods = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer: {
        fullName: '',
        email: '',
        phone: '',
        createAccount: false,
      },
      fulfillment: {
        mode: 'pickup',
      },
      payment: {
        method: 'cash_on_delivery',
      },
    },
  })

  return (
    <FormProvider {...methods}>
      <CustomerDetailsSection />
    </FormProvider>
  )
}

describe('CustomerDetailsSection', () => {
  it('renders all required input fields', () => {
    render(<CustomerDetailsSectionWithForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/create an account/i)).toBeInTheDocument()
  })

  it('allows entering customer details', async () => {
    const user = userEvent.setup()
    render(<CustomerDetailsSectionWithForm />)

    const fullNameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const phoneInput = screen.getByLabelText(/phone number/i)

    await user.type(fullNameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(phoneInput, '+256701234567')

    expect((fullNameInput as HTMLInputElement).value).toBe('John Doe')
    expect((emailInput as HTMLInputElement).value).toBe('john@example.com')
    expect((phoneInput as HTMLInputElement).value).toBe('+256701234567')
  })

  it('allows toggling create account checkbox', async () => {
    const user = userEvent.setup()
    render(<CustomerDetailsSectionWithForm />)

    const checkbox = screen.getByLabelText(/create an account/i)

    expect((checkbox as HTMLInputElement).checked).toBe(false)

    await user.click(checkbox)
    expect((checkbox as HTMLInputElement).checked).toBe(true)

    await user.click(checkbox)
    expect((checkbox as HTMLInputElement).checked).toBe(false)
  })

  it('displays section header', () => {
    render(<CustomerDetailsSectionWithForm />)
    expect(screen.getByText(/your details/i)).toBeInTheDocument()
  })

  it('has proper placeholder text for inputs', () => {
    render(<CustomerDetailsSectionWithForm />)

    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/john@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/\+256701234567/i)).toBeInTheDocument()
  })
})
