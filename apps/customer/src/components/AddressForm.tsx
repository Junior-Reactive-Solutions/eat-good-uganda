import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CustomerAddress } from '@eatgood/shared'
import { Button } from './Button'
import { Checkbox } from './Checkbox'

const addressFormSchema = z.object({
  street_address: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  postal_code: z.string().max(20).optional().nullable(),
  is_delivery_address: z.boolean().optional(),
  is_billing_address: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

type AddressFormData = z.infer<typeof addressFormSchema>

interface AddressFormProps {
  address?: CustomerAddress | null
  isLoading?: boolean
  onSubmit: (data: AddressFormData) => void
}

const inputBase =
  'w-full rounded-lg border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder:text-platform-fg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1 disabled:opacity-50'

const inputBorder = (error?: string) =>
  error ? 'border-platform-error' : 'border-platform-border'

export function AddressForm({
  address,
  isLoading = false,
  onSubmit,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: address
      ? {
          street_address: address.street_address,
          city: address.city,
          district: address.district,
          postal_code: address.postal_code || '',
          is_delivery_address: address.is_delivery_address,
          is_billing_address: address.is_billing_address,
          is_default: address.is_default,
        }
      : {
          street_address: '',
          city: '',
          district: '',
          postal_code: '',
          is_delivery_address: true,
          is_billing_address: false,
          is_default: false,
        },
  })

  return (
    <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-platform-fg mb-1">
          Street Address <span className="text-platform-error">*</span>
        </label>
        <input
          {...register('street_address')}
          type="text"
          placeholder="123 Main St"
          disabled={isLoading}
          aria-invalid={errors.street_address ? 'true' : 'false'}
          className={[inputBase, inputBorder(errors.street_address?.message)].join(' ')}
        />
        {errors.street_address && (
          <p className="mt-1 text-xs text-platform-error">{errors.street_address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">
            City <span className="text-platform-error">*</span>
          </label>
          <input
            {...register('city')}
            type="text"
            placeholder="Kampala"
            disabled={isLoading}
            aria-invalid={errors.city ? 'true' : 'false'}
            className={[inputBase, inputBorder(errors.city?.message)].join(' ')}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-platform-error">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">
            District <span className="text-platform-error">*</span>
          </label>
          <input
            {...register('district')}
            type="text"
            placeholder="Makindye"
            disabled={isLoading}
            aria-invalid={errors.district ? 'true' : 'false'}
            className={[inputBase, inputBorder(errors.district?.message)].join(' ')}
          />
          {errors.district && (
            <p className="mt-1 text-xs text-platform-error">{errors.district.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-platform-fg mb-1">
          Postal Code
        </label>
        <input
          {...register('postal_code')}
          type="text"
          placeholder="00256"
          disabled={isLoading}
          aria-invalid={errors.postal_code ? 'true' : 'false'}
          className={[inputBase, inputBorder(errors.postal_code?.message)].join(' ')}
        />
        {errors.postal_code && (
          <p className="mt-1 text-xs text-platform-error">{errors.postal_code.message}</p>
        )}
      </div>

      {/* Address Type Checkboxes */}
      <div className="space-y-2 border-t border-platform-border pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            {...register('is_delivery_address')}
            id="is_delivery"
            disabled={isLoading}
          />
          <label
            htmlFor="is_delivery"
            className="text-sm font-medium text-platform-fg cursor-pointer"
          >
            Use for deliveries
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            {...register('is_billing_address')}
            id="is_billing"
            disabled={isLoading}
          />
          <label
            htmlFor="is_billing"
            className="text-sm font-medium text-platform-fg cursor-pointer"
          >
            Use for billing
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            {...register('is_default')}
            id="is_default"
            disabled={isLoading}
          />
          <label
            htmlFor="is_default"
            className="text-sm font-medium text-platform-fg cursor-pointer"
          >
            Set as default
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
      </Button>
    </form>
  )
}
