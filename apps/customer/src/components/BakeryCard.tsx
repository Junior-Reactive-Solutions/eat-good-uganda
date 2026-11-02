import { Link } from 'react-router-dom'

import type { PublicBakery } from '../features/bakery/api'

import {
  IconDeliveryLocation,
  IconDeliveryPickup,
  IconDeliveryBoda,
  IconInteractionClock,
} from './icons'

type Props = { bakery: PublicBakery }

function cloudinaryThumb(url: string): string {
  return url.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto,f_auto/')
}

function formatUGX(minor: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(minor / 100)
}

function FulfilmentChips({ bakery }: { bakery: PublicBakery }) {
  const chips: Array<{ icon: React.ReactNode; label: string }> = []

  if (bakery.accepts_delivery) {
    const feeLabel =
      bakery.delivery_fee_minor != null
        ? bakery.delivery_fee_minor === 0
          ? 'Free delivery'
          : `Delivery ${formatUGX(bakery.delivery_fee_minor)}`
        : 'Delivery available'
    chips.push({ icon: <IconDeliveryBoda size="sm" color="default" alt="" />, label: feeLabel })
  }

  if (bakery.accepts_pickup) {
    chips.push({ icon: <IconDeliveryPickup size="sm" color="default" alt="" />, label: 'Pickup' })
  }

  if (bakery.min_order_minor != null && bakery.min_order_minor > 0) {
    chips.push({
      icon: <IconInteractionClock size="sm" color="default" alt="" />,
      label: `Min ${formatUGX(bakery.min_order_minor)}`,
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {chips.map(({ icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-platform-accent px-2 py-0.5 text-xs text-platform-fg-muted"
        >
          {icon}
          {label}
        </span>
      ))}
    </div>
  )
}

export function BakeryCard({ bakery }: Props) {
  const address = [bakery.address_line1, bakery.city].filter(Boolean).join(', ')

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-platform-border bg-platform-surface transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-platform-accent">
        {bakery.logo_url ? (
          <img
            src={cloudinaryThumb(bakery.logo_url)}
            alt={`${bakery.display_name} logo`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-platform-fg-muted">
              <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4v5h10V4H7zm2 2h6v1H9V6z" />
                <path d="M4 11h16v8c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-8z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-platform-fg">{bakery.display_name}</h3>

        {bakery.tagline && (
          <p className="line-clamp-2 text-sm text-platform-fg-muted">{bakery.tagline}</p>
        )}

        <FulfilmentChips bakery={bakery} />

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-platform-fg-muted">
            <IconDeliveryLocation size="sm" color="default" alt="" />
            <span className="truncate">{address}</span>
          </div>
          {bakery.distance_km !== null && (
            <span className="ml-2 shrink-0 text-xs font-medium text-platform-primary">
              {bakery.distance_km.toFixed(1)} km away
            </span>
          )}
        </div>

        <Link
          to={`/b/${bakery.slug}`}
          className="mt-2 block rounded-lg bg-platform-primary px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-platform-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary focus-visible:ring-offset-2"
        >
          View menu
        </Link>
      </div>
    </article>
  )
}
