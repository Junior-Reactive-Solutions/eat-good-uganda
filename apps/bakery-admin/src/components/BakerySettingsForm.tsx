import type { BakeryProfile } from '@eatgood/db'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from './Button'

const settingsFormSchema = z.object({
  legal_name: z.string().min(1, 'Legal name is required').max(255),
  display_name: z.string().min(1, 'Display name is required').max(255),
  email: z.email('Invalid email address'),
  phone: z.string().max(20),
  address_line1: z.string().max(500),
  address_line2: z.string().max(500).nullable(),
  city: z.string().max(100),
  description: z.string().max(1000).nullable(),
  logo_url: z.url('Invalid logo URL').nullable(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  website: z.url('Invalid website URL').nullable(),
  accepts_pickup: z.boolean(),
  accepts_delivery: z.boolean(),
  delivery_fee_minor: z.number().int().nonnegative().nullable(),
  delivery_radius_km: z.number().nonnegative().nullable(),
  min_order_minor: z.number().int().nonnegative().nullable(),
})

type SettingsFormData = z.infer<typeof settingsFormSchema>

interface BakerySettingsFormProps {
  profile: BakeryProfile | null
  isLoading?: boolean
  onSubmit: (data: SettingsFormData) => void
}

export function BakerySettingsForm({
  profile,
  isLoading = false,
  onSubmit,
}: BakerySettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: profile
      ? {
          legal_name: profile.legal_name,
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
          address_line1: profile.address_line1,
          address_line2: profile.address_line2 || null,
          city: profile.city,
          description: profile.description || null,
          logo_url: profile.logo_url || null,
          accent_color: profile.accent_color || '#000000',
          website: profile.website || null,
          accepts_pickup: profile.accepts_pickup,
          accepts_delivery: profile.accepts_delivery,
          delivery_fee_minor: profile.delivery_fee_minor || null,
          delivery_radius_km: profile.delivery_radius_km || null,
          min_order_minor: profile.min_order_minor || null,
        }
      : {
          legal_name: '',
          display_name: '',
          email: '',
          phone: '',
          address_line1: '',
          address_line2: null,
          city: '',
          description: null,
          logo_url: null,
          accent_color: '#000000',
          website: null,
          accepts_pickup: true,
          accepts_delivery: false,
          delivery_fee_minor: null,
          delivery_radius_km: null,
          min_order_minor: null,
        },
  })

  const accentColor = watch('accent_color')
  const logoUrl = watch('logo_url')
  const acceptsDelivery = watch('accepts_delivery')

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-platform-fg">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legal_name" className="block text-sm font-medium text-platform-fg mb-1">
              Legal Name *
            </label>
            <input
              id="legal_name"
              type="text"
              placeholder="Your legal business name"
              {...register('legal_name')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
              aria-invalid={errors.legal_name ? 'true' : 'false'}
              aria-describedby={errors.legal_name ? 'legal_name-error' : undefined}
            />
            {errors.legal_name && (
              <p id="legal_name-error" className="mt-1 text-xs text-platform-error">
                {errors.legal_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-platform-fg mb-1"
            >
              Display Name *
            </label>
            <input
              id="display_name"
              type="text"
              placeholder="How customers see your bakery"
              {...register('display_name')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
              aria-invalid={errors.display_name ? 'true' : 'false'}
              aria-describedby={errors.display_name ? 'display_name-error' : undefined}
            />
            {errors.display_name && (
              <p id="display_name-error" className="mt-1 text-xs text-platform-error">
                {errors.display_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-platform-fg mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              placeholder="contact@bakery.com"
              {...register('email')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-platform-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-platform-fg mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+256700000000"
              {...register('phone')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="mt-1 text-xs text-platform-error">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="address_line1"
            className="block text-sm font-medium text-platform-fg mb-1"
          >
            Address Line 1
          </label>
          <input
            id="address_line1"
            type="text"
            placeholder="123 Baker Street"
            {...register('address_line1')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.address_line1 ? 'true' : 'false'}
            aria-describedby={errors.address_line1 ? 'address_line1-error' : undefined}
          />
          {errors.address_line1 && (
            <p id="address_line1-error" className="mt-1 text-xs text-platform-error">
              {errors.address_line1.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="address_line2"
            className="block text-sm font-medium text-platform-fg mb-1"
          >
            Address Line 2
          </label>
          <input
            id="address_line2"
            type="text"
            placeholder="Apartment, suite, etc. (optional)"
            {...register('address_line2')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.address_line2 ? 'true' : 'false'}
            aria-describedby={errors.address_line2 ? 'address_line2-error' : undefined}
          />
          {errors.address_line2 && (
            <p id="address_line2-error" className="mt-1 text-xs text-platform-error">
              {errors.address_line2.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-platform-fg mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            placeholder="Kampala"
            {...register('city')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.city ? 'true' : 'false'}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="mt-1 text-xs text-platform-error">
              {errors.city.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-platform-fg mb-1">
            Website
          </label>
          <input
            id="website"
            type="url"
            placeholder="https://yourbakery.com"
            {...register('website')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.website ? 'true' : 'false'}
            aria-describedby={errors.website ? 'website-error' : undefined}
          />
          {errors.website && (
            <p id="website-error" className="mt-1 text-xs text-platform-error">
              {errors.website.message}
            </p>
          )}
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4 border-t border-platform-border pt-6">
        <h3 className="text-lg font-semibold text-platform-fg">Branding</h3>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-platform-fg mb-1">
            Logo URL
          </label>
          <input
            id="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            {...register('logo_url')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.logo_url ? 'true' : 'false'}
            aria-describedby={errors.logo_url ? 'logo_url-error' : undefined}
          />
          {errors.logo_url && (
            <p id="logo_url-error" className="mt-1 text-xs text-platform-error">
              {errors.logo_url.message}
            </p>
          )}
          {logoUrl && (
            <div className="mt-3">
              <p className="text-xs text-platform-fg-muted mb-2">Logo Preview:</p>
              <img
                src={logoUrl}
                alt="Logo preview"
                className="max-w-xs h-auto rounded-md border border-platform-border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="accent_color" className="block text-sm font-medium text-platform-fg mb-1">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="accent_color"
              type="color"
              {...register('accent_color')}
              disabled={isLoading}
              className="w-16 h-10 rounded-md border border-platform-border cursor-pointer disabled:opacity-50"
              aria-invalid={errors.accent_color ? 'true' : 'false'}
              aria-describedby={errors.accent_color ? 'accent_color-error' : undefined}
            />
            <input
              type="text"
              {...register('accent_color')}
              placeholder="#000000"
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
              aria-invalid={errors.accent_color ? 'true' : 'false'}
              aria-describedby={errors.accent_color ? 'accent_color-error' : undefined}
            />
          </div>
          {errors.accent_color && (
            <p id="accent_color-error" className="mt-1 text-xs text-platform-error">
              {errors.accent_color.message}
            </p>
          )}
          <div
            className="mt-3 w-12 h-12 rounded-md border-2 border-platform-border"
            style={{ backgroundColor: accentColor || '#000000' }}
            aria-label={`Accent color preview: ${accentColor || '#000000'}`}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4 border-t border-platform-border pt-6">
        <h3 className="text-lg font-semibold text-platform-fg">About Your Bakery</h3>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-platform-fg mb-1">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Tell customers about your bakery..."
            {...register('description')}
            rows={5}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50 resize-none"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-xs text-platform-error">
              {errors.description.message}
            </p>
          )}
          <p className="mt-1 text-xs text-platform-fg-muted">
            {watch('description')?.length || 0}/1000 characters
          </p>
        </div>
      </div>

      {/* Fulfillment Options */}
      <div className="space-y-4 border-t border-platform-border pt-6">
        <h3 className="text-lg font-semibold text-platform-fg">Fulfillment Options</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('accepts_pickup')}
              disabled={isLoading}
              className="w-4 h-4 rounded border border-platform-border cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm text-platform-fg">Accept Pickup Orders</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('accepts_delivery')}
              disabled={isLoading}
              className="w-4 h-4 rounded border border-platform-border cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm text-platform-fg">Accept Delivery Orders</span>
          </label>
        </div>

        {acceptsDelivery && (
          <div className="space-y-4 bg-platform-accent p-4 rounded-md">
            <div>
              <label
                htmlFor="delivery_fee_minor"
                className="block text-sm font-medium text-platform-fg mb-1"
              >
                Delivery Fee (UGX)
              </label>
              <input
                id="delivery_fee_minor"
                type="number"
                placeholder="0"
                {...register('delivery_fee_minor', { valueAsNumber: true })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
                aria-invalid={errors.delivery_fee_minor ? 'true' : 'false'}
                aria-describedby={
                  errors.delivery_fee_minor ? 'delivery_fee_minor-error' : undefined
                }
              />
              {errors.delivery_fee_minor && (
                <p id="delivery_fee_minor-error" className="mt-1 text-xs text-platform-error">
                  {errors.delivery_fee_minor.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="delivery_radius_km"
                className="block text-sm font-medium text-platform-fg mb-1"
              >
                Delivery Radius (km)
              </label>
              <input
                id="delivery_radius_km"
                type="number"
                placeholder="0"
                step="0.1"
                {...register('delivery_radius_km', { valueAsNumber: true })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
                aria-invalid={errors.delivery_radius_km ? 'true' : 'false'}
                aria-describedby={
                  errors.delivery_radius_km ? 'delivery_radius_km-error' : undefined
                }
              />
              {errors.delivery_radius_km && (
                <p id="delivery_radius_km-error" className="mt-1 text-xs text-platform-error">
                  {errors.delivery_radius_km.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="min_order_minor"
            className="block text-sm font-medium text-platform-fg mb-1"
          >
            Minimum Order Amount (UGX)
          </label>
          <input
            id="min_order_minor"
            type="number"
            placeholder="0"
            {...register('min_order_minor', { valueAsNumber: true })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary disabled:opacity-50"
            aria-invalid={errors.min_order_minor ? 'true' : 'false'}
            aria-describedby={errors.min_order_minor ? 'min_order_minor-error' : undefined}
          />
          {errors.min_order_minor && (
            <p id="min_order_minor-error" className="mt-1 text-xs text-platform-error">
              {errors.min_order_minor.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-6 border-t border-platform-border">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
