import { useState } from 'react'

import { BakeryCard } from '../components/BakeryCard'
import { Button } from '../components/Button'
import {
  IconNavigationSearch,
  IconDeliveryLocation,
  IconInteractionDelete,
  IconInteractionHelp,
  IconInteractionClock,
} from '../components/icons'
import { usePublicBakeries } from '../features/bakery/api'
import { useCurrentLocation } from '../features/geolocation/useCurrentLocation'
import { useDebounce } from '../hooks/useDebounce'

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const search = useDebounce(searchInput, 400)
  const geo = useCurrentLocation()

  const geoParams = geo.status === 'granted' ? { lat: geo.lat, lng: geo.lng } : {}

  const {
    data: bakeries,
    isLoading,
    isError,
  } = usePublicBakeries({
    ...geoParams,
    search: search || undefined,
  })

  const showBanner = !bannerDismissed && geo.status !== 'granted' && geo.status !== 'denied'

  return (
    <div className="min-h-screen bg-platform-bg">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="bg-gradient-to-b from-platform-accent to-platform-bg px-4 pb-12 pt-16 text-center sm:pb-16 sm:pt-24"
      >
        <div className="mx-auto max-w-3xl">
          <h1
            id="hero-heading"
            className="mb-4 text-3xl font-bold tracking-tight text-platform-fg sm:text-5xl"
          >
            Order from Uganda's best bakeries
          </h1>
          <p className="mb-8 text-base text-platform-fg-muted sm:text-lg">
            Fresh bread, cakes, and pastries — delivered to your door or ready for pickup.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <IconNavigationSearch
                size="sm"
                color="default"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-platform-fg-muted"
                alt=""
              />
              <input
                type="search"
                placeholder="Search bakeries…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                }}
                aria-label="Search bakeries"
                className="w-full rounded-lg border border-platform-border bg-platform-surface py-3 pl-10 pr-4 text-sm text-platform-fg placeholder:text-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1"
              />
            </div>
            <Button
              onClick={geo.request}
              loading={geo.status === 'prompting'}
              variant="secondary"
              size="lg"
              className="shrink-0"
            >
              <IconDeliveryLocation size="sm" color="default" alt="" />
              Find bakeries near me
            </Button>
          </div>
        </div>
      </section>

      {/* Location banner */}
      {showBanner && (
        <div role="status" className="border-b border-platform-border bg-platform-accent px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-platform-fg-muted">
              <span className="font-medium text-platform-fg">Sort by distance?</span> Grant location
              access to see the nearest bakeries first.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" onClick={geo.request} loading={geo.status === 'prompting'}>
                Grant access
              </Button>
              <button
                onClick={() => {
                  setBannerDismissed(true)
                }}
                aria-label="Dismiss location banner"
                className="rounded p-1 text-platform-fg-muted transition-colors hover:text-platform-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary"
              >
                <IconInteractionDelete size="sm" color="default" alt="" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission denied notice */}
      {geo.status === 'denied' && (
        <div className="border-b border-platform-border bg-amber-50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <IconInteractionHelp
              size="sm"
              color="default"
              className="shrink-0 text-platform-warning"
              alt=""
            />
            <p className="text-sm text-platform-fg-muted">
              Location access was denied. Enable it in your browser settings to sort by distance.
            </p>
          </div>
        </div>
      )}

      {/* Bakery grid */}
      <main id="bakery-grid" className="mx-auto max-w-6xl px-4 py-8">
        {(search || geo.status === 'granted') && (
          <p className="mb-6 text-sm text-platform-fg-muted">
            {geo.status === 'granted' && !search && 'Showing bakeries nearest to you.'}
            {geo.status === 'granted' && search && (
              <>
                Results for <span className="font-medium text-platform-fg">"{search}"</span>, sorted
                by distance.
              </>
            )}
            {geo.status !== 'granted' && search && (
              <>
                Results for <span className="font-medium text-platform-fg">"{search}"</span>
              </>
            )}
          </p>
        )}

        {isLoading && (
          <div
            role="status"
            aria-label="Loading bakeries"
            className="flex items-center justify-center py-24"
          >
            <IconInteractionClock
              className="animate-spin text-platform-primary"
              alt=""
              size="lg"
              color="default"
            />
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-platform-error"
          >
            Failed to load bakeries. Please refresh to try again.
          </div>
        )}

        {!isLoading && !isError && bakeries?.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <IconNavigationSearch size="lg" color="default" alt="" />
            <p className="text-lg font-medium text-platform-fg">No bakeries found</p>
            <p className="text-sm text-platform-fg-muted">
              {search
                ? `No results for "${search}". Try a different search.`
                : 'No active bakeries yet. Check back soon!'}
            </p>
            {search && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('')
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && bakeries && bakeries.length > 0 && (
          <ul
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-label="Available bakeries"
          >
            {bakeries.map((bakery) => (
              <li key={bakery.id}>
                <BakeryCard bakery={bakery} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
