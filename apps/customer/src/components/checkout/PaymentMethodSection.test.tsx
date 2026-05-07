import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutFormSchema, type CheckoutFormInput } from '@eatgood/shared'
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

    const codRadio = screen.getByLabelText(/cash on delivery/i) as HTMLInputElement
    expect(codRadio.checked).toBe(true)
  })

  it('allows selecting different payment methods', async () => {
    const user = userEvent.setup()
    render(<PaymentMethodSectionWithForm />)

    const bankRadio = screen.getByLabelText(/bank transfer/i) as HTMLInputElement
    await user.click(bankRadio)

    expect(bankRadio.checked).toBe(true)
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

    const phoneInput = screen.getByLabelText(/mobile money phone number/i) as HTMLInputElement
    await user.type(phoneInput, '+256701234567')

    expect(phoneInput.value).toBe('+256701234567')
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
