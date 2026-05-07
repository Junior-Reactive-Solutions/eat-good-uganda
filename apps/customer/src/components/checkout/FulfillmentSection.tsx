import { useFormContext, Controller } from 'react-hook-form'
import { MapPin, Clock } from 'lucide-react'
import type { CheckoutFormInput } from '@eatgood/shared'

import { Input } from '../Input'
import { Card } from '../Card'
import { Button } from '../Button'

/**
 * Fulfillment Section for Checkout
 *
 * Displays fulfillment options:
 * - Pickup: select date/time
 * - Delivery: address form + geolocation + date/time
 *
 * Uses discriminated union pattern: watches 'fulfillment.mode' to
 * conditionally render pickup or delivery sections
 */
export default function FulfillmentSection() {
  const { control, watch, formState: { errors } } = useFormContext<CheckoutFormInput>()

  // Watch fulfillment mode to conditionally render sections
  const fulfillmentMode = watch('fulfillment.mode')
  const isDelivery = fulfillmentMode === 'delivery'

  // Watch delivery address for geolocation
  const deliveryAddress = watch('fulfillment.deliveryAddress')

  const handleGetGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real implementation, would use form.setValue to set lat/lng
        console.log('Geolocation obtained:', position.coords)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please enable location access.')
      }
    )
  }

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-platform-fg">Fulfillment Method</h2>

      <div className="space-y-4">
        {/* Fulfillment Mode Selection */}
        <div className="flex gap-3">
          {/* Pickup Option */}
          <Controller
            control={control}
            name="fulfillment.mode"
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="pickup"
                  checked={field.value === 'pickup'}
                  onChange={() => field.onChange('pickup')}
                  className="h-4 w-4 rounded-full border-platform-border text-platform-primary"
                />
                <span className="text-sm font-medium text-platform-fg">Pickup</span>
              </label>
            )}
          />

          {/* Delivery Option */}
          <Controller
            control={control}
            name="fulfillment.mode"
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="delivery"
                  checked={field.value === 'delivery'}
                  onChange={() => field.onChange('delivery')}
                  className="h-4 w-4 rounded-full border-platform-border text-platform-primary"
                />
                <span className="text-sm font-medium text-platform-fg">Delivery</span>
              </label>
            )}
          />
        </div>

        {/* Pickup Section */}
        {!isDelivery && (
          <div className="rounded-lg border border-platform-border bg-platform-surface-subtle p-3 space-y-3">
            <p className="text-sm text-platform-fg-muted">Ready for pickup at the bakery</p>

            {/* Scheduled Date/Time (Optional) */}
            <Controller
              control={control}
              name="fulfillment.scheduledFor"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-platform-fg">
                    Pickup Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    placeholder="2026-05-07T14:30"
                    className="w-full rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder:text-platform-fg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1"
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    onBlur={field.onBlur}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                  />
                </div>
              )}
            />
          </div>
        )}

        {/* Delivery Section */}
        {isDelivery && (
          <div className="rounded-lg border border-platform-border bg-platform-surface-subtle p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-platform-fg-muted">
              <MapPin className="h-4 w-4" />
              <span>We'll deliver to your address</span>
            </div>

            {/* Address Line 1 */}
            <Controller
              control={control}
              name="fulfillment.deliveryAddress.line1"
              render={({ field }) => (
                <Input
                  label="Street Address"
                  type="text"
                  placeholder="123 Main Street"
                  error={
                    errors.fulfillment && 'deliveryAddress' in errors.fulfillment
                      ? (errors.fulfillment as any).deliveryAddress?.line1?.message
                      : undefined
                  }
                  {...field}
                />
              )}
            />

            {/* Address Line 2 */}
            <Controller
              control={control}
              name="fulfillment.deliveryAddress.line2"
              render={({ field }) => (
                <Input
                  label="Apartment, Suite, etc. (Optional)"
                  type="text"
                  placeholder="Apt 4B"
                  {...field}
                  value={field.value || ''}
                />
              )}
            />

            {/* City */}
            <Controller
              control={control}
              name="fulfillment.deliveryAddress.city"
              render={({ field }) => (
                <Input
                  label="City"
                  type="text"
                  placeholder="Kampala"
                  error={
                    errors.fulfillment && 'deliveryAddress' in errors.fulfillment
                      ? (errors.fulfillment as any).deliveryAddress?.city?.message
                      : undefined
                  }
                  {...field}
                />
              )}
            />

            {/* Delivery Notes */}
            <Controller
              control={control}
              name="fulfillment.deliveryAddress.notes"
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-platform-fg mb-2">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    placeholder="e.g., Gate code 1234, knock on red door"
                    className="w-full rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-2 focus:ring-platform-primary/20"
                    rows={3}
                    {...field}
                    value={field.value || ''}
                  />
                </div>
              )}
            />

            {/* Geolocation Button */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleGetGeolocation}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use My Location
            </Button>

            {/* Scheduled Date/Time (Optional) */}
            <Controller
              control={control}
              name="fulfillment.scheduledFor"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-platform-fg">
                    Delivery Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    placeholder="2026-05-07T14:30"
                    className="w-full rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder:text-platform-fg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1"
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    onBlur={field.onBlur}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                  />
                </div>
              )}
            />

            {/* Delivery Fee Info (Placeholder) */}
            <div className="rounded-lg bg-platform-info/10 border border-platform-info/20 p-3">
              <p className="text-sm text-platform-info">
                <Clock className="h-4 w-4 inline mr-2" />
                Delivery fee will be calculated at checkout based on your location
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
