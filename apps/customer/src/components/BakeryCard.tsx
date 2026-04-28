import { MapPin, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { PublicBakery } from '../features/bakery/api'

type Props = { bakery: PublicBakery }

function cloudinaryThumb(url: string): string {
  return url.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto,f_auto/')
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
            <ShoppingBag className="h-12 w-12 text-platform-fg-muted" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-platform-fg">{bakery.display_name}</h3>

        {bakery.tagline && (
          <p className="line-clamp-2 text-sm text-platform-fg-muted">{bakery.tagline}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-platform-fg-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
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
