import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, it, expect } from 'vitest'

import FulfillmentSection from './FulfillmentSection'

/**
 * Wrapper component to provide form context for testing
 */
function FulfillmentSectionWithForm() {
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
      <FulfillmentSection />
    </FormProvider>
  )
}

describe('FulfillmentSection', () => {
  it('renders fulfillment mode selection', () => {
    render(<FulfillmentSectionWithForm />)

    expect(screen.getByLabelText(/pickup/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/delivery/i)).toBeInTheDocument()
  })

  it('shows pickup section by default', () => {
    render(<FulfillmentSectionWithForm />)

    expect(screen.getByText(/ready for pickup at the bakery/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup date & time/i)).toBeInTheDocument()
  })

  it('switches to delivery section when delivery is selected', async () => {
    const user = userEvent.setup()
    render(<FulfillmentSectionWithForm />)

    const deliveryRadio = screen.getByLabelText(/delivery/i)
    await user.click(deliveryRadio)

    expect(screen.getByText(/we'll deliver to your address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
  })

  it('renders delivery address fields when delivery is selected', async () => {
    const user = userEvent.setup()
    render(<FulfillmentSectionWithForm />)

    const deliveryRadio = screen.getByLabelText(/delivery/i)
    await user.click(deliveryRadio)

    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apartment, suite/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/delivery instructions/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/use my location/i)).toBeInTheDocument()
  })

  it('allows entering delivery address', async () => {
    const user = userEvent.setup()
    render(<FulfillmentSectionWithForm />)

    const deliveryRadio = screen.getByLabelText(/delivery/i)
    await user.click(deliveryRadio)

    const addressInput = screen.getByLabelText(/street address/i)
    const cityInput = screen.getByLabelText(/city/i)

    await user.type(addressInput, '123 Main Street')
    await user.type(cityInput, 'Kampala')

    expect((addressInput as HTMLInputElement).value).toBe('123 Main Street')
    expect((cityInput as HTMLInputElement).value).toBe('Kampala')
  })

  it('shows delivery fee information', async () => {
    const user = userEvent.setup()
    render(<FulfillmentSectionWithForm />)

    const deliveryRadio = screen.getByLabelText(/delivery/i)
    await user.click(deliveryRadio)

    expect(
      screen.getByText(/delivery fee will be calculated at checkout/i),
    ).toBeInTheDocument()
  })

  it('displays section header', () => {
    render(<FulfillmentSectionWithForm />)
    expect(screen.getByText(/fulfillment method/i)).toBeInTheDocument()
  })

  it('allows optional scheduled date/time for pickup', () => {
    render(<FulfillmentSectionWithForm />)

    const dateInput = screen.getByLabelText(/pickup date & time/i)
    expect(dateInput).toBeInTheDocument()
    expect((dateInput as HTMLInputElement).type).toBe('datetime-local')
  })

  it('allows optional scheduled date/time for delivery', async () => {
    const user = userEvent.setup()
    render(<FulfillmentSectionWithForm />)

    const deliveryRadio = screen.getByLabelText(/delivery/i)
    await user.click(deliveryRadio)

    const dateInput = screen.getByLabelText(/delivery date & time/i)
    expect(dateInput).toBeInTheDocument()
    expect((dateInput as HTMLInputElement).type).toBe('datetime-local')
  })
})
