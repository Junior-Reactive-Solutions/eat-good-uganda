import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, it, expect } from 'vitest'

import PaymentMethodSection from './PaymentMethodSection'

/**
 * Wrapper component to provide form context for testing
 */
function PaymentMethodSectionWithForm() {
  const methods = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+256701234567',
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
      <PaymentMethodSection />
    </FormProvider>
  )
}

describe('PaymentMethodSection', () => {
  it('renders all payment method options', () => {
    render(<PaymentMethodSectionWithForm />)

    expect(screen.getByLabelText(/cash on delivery/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bank transfer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mtn mobile money/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/airtel money/i)).toBeInTheDocument()
  })

  it('has cash on delivery selected by default', () => {
    render(<PaymentMethodSectionWithForm />)

    const codRadio = screen.getByLabelText(/cash on delivery/i)
    expect((codRadio as HTMLInputElement).checked).toBe(true)
  })

  it('allows selecting different payment methods', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const bankRadio = screen.getByLabelText(/bank transfer/i)
    await user.click(bankRadio)

    expect((bankRadio as HTMLInputElement).checked).toBe(true)
  })

  it('shows phone number field for MTN Mobile Money', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const mtnRadio = screen.getByLabelText(/mtn mobile money/i)
    await user.click(mtnRadio)

    expect(screen.getByLabelText(/mobile money phone number/i)).toBeInTheDocument()
  })

  it('shows phone number field for Airtel Money', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const airtelRadio = screen.getByLabelText(/airtel money/i)
    await user.click(airtelRadio)

    expect(screen.getByLabelText(/mobile money phone number/i)).toBeInTheDocument()
  })

  it('hides phone field when switching away from mobile money', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const mtnRadio = screen.getByLabelText(/mtn mobile money/i)
    await user.click(mtnRadio)

    expect(screen.getByLabelText(/mobile money phone number/i)).toBeInTheDocument()

    const codRadio = screen.getByLabelText(/cash on delivery/i)
    await user.click(codRadio)

    expect(screen.queryByLabelText(/mobile money phone number/i)).not.toBeInTheDocument()
  })

  it('shows helpful info for Cash on Delivery', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const codRadio = screen.getByLabelText(/cash on delivery/i)
    await user.click(codRadio)

    expect(screen.getByText(/pay the driver when your order arrives/i)).toBeInTheDocument()
  })

  it('shows helpful info for Bank Transfer', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const bankRadio = screen.getByLabelText(/bank transfer/i)
    await user.click(bankRadio)

    expect(
      screen.getByText(/you'll receive the bakery's bank account details via email/i),
    ).toBeInTheDocument()
  })

  it('shows helpful info for MTN Mobile Money', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const mtnRadio = screen.getByLabelText(/mtn mobile money/i)
    await user.click(mtnRadio)

    expect(
      screen.getByText(/you'll receive a prompt to confirm payment on your phone/i),
    ).toBeInTheDocument()
  })

  it('allows entering phone number for mobile money', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const mtnRadio = screen.getByLabelText(/mtn mobile money/i)
    await user.click(mtnRadio)

    const phoneInput = screen.getByLabelText(/mobile money phone number/i)
    await user.type(phoneInput, '+256701234567')

    expect((phoneInput as HTMLInputElement).value).toBe('+256701234567')
  })

  it('displays section header', () => {
    render(<PaymentMethodSectionWithForm />)
    expect(screen.getByText(/payment method/i)).toBeInTheDocument()
  })

  it('shows payment method descriptions', () => {
    render(<PaymentMethodSectionWithForm />)

    expect(screen.getByText(/pay when your order arrives/i)).toBeInTheDocument()
    expect(screen.getByText(/transfer to bakery bank account/i)).toBeInTheDocument()
    expect(screen.getByText(/pay with mtn momo/i)).toBeInTheDocument()
    expect(screen.getByText(/pay with airtel money/i)).toBeInTheDocument()
  })
})

/**
 * Wrapper that exposes the submit handler so we can trigger Zod validation
 * on the phone number field.
 */
function PaymentMethodSectionWithSubmit() {
  const methods = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+256701234567',
        createAccount: false,
      },
      fulfillment: { mode: 'pickup' as const },
      payment: { method: 'mtn_momo' as const, phoneNumber: '' },
    },
    mode: 'all',
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <PaymentMethodSection />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}

describe('PaymentMethodSection — phone validation', () => {
  it('shows validation error for invalid Uganda phone number', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithSubmit />)

    // MoMo already selected via defaultValues
    const phoneInput = screen.getByLabelText(/mobile money phone number/i)

    await user.clear(phoneInput)
    await user.type(phoneInput, '12345')

    // Trigger submit to run Zod validation
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/invalid uganda phone number/i)).toBeInTheDocument()
  })

  it('accepts a valid +256 Uganda phone number', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithSubmit />)

    const phoneInput = screen.getByLabelText(/mobile money phone number/i)

    await user.clear(phoneInput)
    await user.type(phoneInput, '+256701234567')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // No validation error should be present
    expect(screen.queryByText(/invalid uganda phone number/i)).not.toBeInTheDocument()
  })

  it('shows MoMo option in payment methods', () => {
    render(<PaymentMethodSectionWithSubmit />)
    expect(screen.getByLabelText(/mtn mobile money/i)).toBeInTheDocument()
  })
})
