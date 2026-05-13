import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from './Button'

const credentialFormSchema = z.object({
  provider: z.enum(['mtn_momo', 'airtel_money', 'bank_transfer']),
  account_number: z.string().min(1, 'Account number is required').max(255),
  account_holder: z.string().min(1, 'Account holder name is required').max(255),
  api_key: z.string().max(500).optional().nullable(),
})

type CredentialFormData = z.infer<typeof credentialFormSchema>

interface PaymentCredentialFormProps {
  provider?: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  isLoading?: boolean
  isCreating?: boolean
  onSubmit: (data: Omit<CredentialFormData, 'provider'>) => void
}

const providerLabels = {
  mtn_momo: 'MTN Mobile Money (MoMo)',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
}

const accountNumberPlaceholders = {
  mtn_momo: '256700000000',
  airtel_money: '256700000000',
  bank_transfer: '1234567890',
}

export function PaymentCredentialForm({
  provider = 'mtn_momo',
  isLoading = false,
  isCreating = false,
  onSubmit,
}: PaymentCredentialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      provider,
      account_number: '',
      account_holder: '',
      api_key: '',
    },
  })

  const handleFormSubmit = (data: CredentialFormData) => {
    onSubmit({
      account_number: data.account_number,
      account_holder: data.account_holder,
      api_key: data.api_key,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="account_number" className="block text-sm font-medium text-platform-fg mb-1">
          Account Number *
        </label>
        <input
          id="account_number"
          type="text"
          placeholder={accountNumberPlaceholders[provider]}
          {...register('account_number')}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
          aria-invalid={errors.account_number ? 'true' : 'false'}
          aria-describedby={errors.account_number ? 'account_number-error' : undefined}
        />
        {errors.account_number && (
          <p id="account_number-error" className="mt-1 text-xs text-platform-error">
            {errors.account_number.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="account_holder" className="block text-sm font-medium text-platform-fg mb-1">
          Account Holder Name *
        </label>
        <input
          id="account_holder"
          type="text"
          placeholder="John Doe"
          {...register('account_holder')}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
          aria-invalid={errors.account_holder ? 'true' : 'false'}
          aria-describedby={errors.account_holder ? 'account_holder-error' : undefined}
        />
        {errors.account_holder && (
          <p id="account_holder-error" className="mt-1 text-xs text-platform-error">
            {errors.account_holder.message}
          </p>
        )}
      </div>

      {provider !== 'bank_transfer' && (
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-platform-fg mb-1">
            API Key (if applicable)
          </label>
          <input
            id="api_key"
            type="password"
            {...register('api_key')}
            placeholder="Your API key"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.api_key ? 'true' : 'false'}
            aria-describedby={errors.api_key ? 'api_key-error' : undefined}
          />
          {errors.api_key && (
            <p id="api_key-error" className="mt-1 text-xs text-platform-error">
              {errors.api_key.message}
            </p>
          )}
          <p className="mt-1 text-xs text-platform-fg-muted">
            Leave blank if not needed
          </p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Credentials'}
      </Button>
    </form>
  )
}
