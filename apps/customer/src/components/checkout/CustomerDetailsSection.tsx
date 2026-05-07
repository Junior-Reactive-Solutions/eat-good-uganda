import type { CheckoutForm } from '@eatgood/shared'
import { useFormContext, Controller } from 'react-hook-form'

import { Card } from '../Card'
import { Input } from '../Input'

/**
 * Customer Details Section for Checkout
 *
 * Displays customer info fields:
 * - Full Name
 * - Email
 * - Phone
 * - [Logged-in only] Create Account checkbox
 *
 * For logged-in users: pre-filled from customer profile
 * For guests: empty fields, all required
 */
export default function CustomerDetailsSection() {
  const { control, formState: { errors } } = useFormContext<CheckoutForm>()

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-platform-fg">Your Details</h2>

      <div className="space-y-3">
        {/* Full Name */}
        <Controller
          control={control}
          name="customer.fullName"
          render={({ field }) => (
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.customer?.fullName?.message}
              {...field}
            />
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="customer.email"
          render={({ field }) => (
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.customer?.email?.message}
              {...field}
            />
          )}
        />

        {/* Phone */}
        <Controller
          control={control}
          name="customer.phone"
          render={({ field }) => (
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+256701234567"
              error={errors.customer?.phone?.message}
              {...field}
            />
          )}
        />

        {/* Create Account Checkbox (for guests or current logged-in users) */}
        <div className="flex items-center gap-2 pt-2">
          <Controller
            control={control}
            name="customer.createAccount"
            render={({ field }) => (
              <input
                type="checkbox"
                id="create-account"
                className="h-4 w-4 rounded border-platform-border text-platform-primary"
                checked={field.value || false}
                onChange={(e) => { field.onChange(e.target.checked); }}
                onBlur={field.onBlur}
                disabled={field.disabled}
              />
            )}
          />
          <label htmlFor="create-account" className="text-sm text-platform-fg">
            Create an account with these details
          </label>
        </div>
      </div>
    </Card>
  )
}
