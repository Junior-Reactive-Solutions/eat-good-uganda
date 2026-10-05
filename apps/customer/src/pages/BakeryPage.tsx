import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/Button'
import {
  IconDeliveryBoda,
  IconDeliveryLocation,
  IconDeliveryPickup,
  IconInteractionClock,
  IconInteractionPhone,
  IconNavigationMenu,
  IconProductBreadLoaf,
} from '../components/icons'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OpenStatusBadge } from '../components/OpenStatusBadge'
import { PageMeta } from '../components/PageMeta'
import { usePublicBakery, usePublicCategories, usePublicProducts } from '../features/bakery/api'
import cloudinaryImage from '../lib/cloudinary'

export default function BakeryPage() {
  const { slug } = useParams<{ slug: string }>()

  // Move hooks before early returns
  const { data: bakeryData, isLoading: isBakeryLoading } = usePublicBakery(slug ?? '')
  const bakery = bakeryData?.bakery
  const openStatus = bakeryData?.open_status
  const { data: categories } = usePublicCategories(slug ?? '')
  const { data: productsData } = usePublicProducts(slug ?? '', { pageSize: 6 })

  if (isBakeryLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (!bakery) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <PageMeta title="Bakery not found" noIndex />
        <h1 className="text-2xl font-bold text-platform-fg">Bakery not found</h1>
        <p className="mt-2 text-platform-fg-muted">
          <Link to="/" className="text-platform-primary hover:underline">
            Back to all bakeries
          </Link>
        </p>
      </div>
    )
  }

  const bakerySlug = slug as string

  return (
    <div>
      <PageMeta
        title={bakery.display_name}
        description={
          bakery.description ??
          bakery.tagline ??
          `Order fresh bread, cakes, and pastries from ${bakery.display_name} on Eat Good Uganda.`
        }
        {...(bakery.logo_url
          ? { image: cloudinaryImage(bakery.logo_url, { w: 512, q: 'auto' }) }
          : {})}
      />
      {/* Hero Section */}
      {bakery.hero_image_url && (
        <div className="relative h-64 w-full overflow-hidden bg-platform-bg sm:h-80">
          <img
            src={cloudinaryImage(bakery.hero_image_url, { w: 1200, q: 'auto' })}
            alt={bakery.display_name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Bakery Info Card */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          {bakery.logo_url && (
            <img
              src={cloudinaryImage(bakery.logo_url, { w: 120, q: 'auto' })}
              alt={bakery.display_name}
              className="h-24 w-24 rounded-lg object-cover shadow-md"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-platform-fg">{bakery.display_name}</h1>
            {bakery.tagline && (
              <p className="mt-1 text-lg text-platform-fg-muted">{bakery.tagline}</p>
            )}
            {bakery.description && (
              <p className="mt-3 text-platform-fg-muted">{bakery.description}</p>
            )}
            <div className="mt-4 flex flex-col gap-2 text-sm text-platform-fg-muted">
              <p className="flex items-center gap-1.5">
                <IconDeliveryLocation size="sm" color="default" alt="" />
                {bakery.address_line1}
              </p>
              {bakery.phone && (
                <p className="flex items-center gap-1.5">
                  <IconInteractionPhone size="sm" color="default" alt="" />
                  {bakery.phone}
                </p>
              )}
            </div>

            {/* Open / closed badge */}
            {openStatus && (
              <div className="mt-3">
                <OpenStatusBadge status={openStatus} />
              </div>
            )}

            {/* Fulfilment fact strip */}
            <div className="mt-4 flex flex-wrap gap-2">
              {bakery.accepts_delivery && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-platform-border px-3 py-1 text-sm text-platform-fg-muted">
                  <IconDeliveryBoda size="sm" color="default" alt="" />
                  {bakery.delivery_fee_minor != null
                    ? bakery.delivery_fee_minor === 0
                      ? 'Free delivery'
                      : `Delivery ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(bakery.delivery_fee_minor / 100)}`
                    : 'Delivery available'}
                </span>
              )}
              {bakery.accepts_pickup && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-platform-border px-3 py-1 text-sm text-platform-fg-muted">
                  <IconDeliveryPickup size="sm" color="default" alt="" />
                  Pickup available
                </span>
              )}
              {bakery.min_order_minor != null && bakery.min_order_minor > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-platform-border px-3 py-1 text-sm text-platform-fg-muted">
                  <IconInteractionClock size="sm" color="default" alt="" />
                  Min order{' '}
                  {new Intl.NumberFormat('en-UG', {
                    style: 'currency',
                    currency: 'UGX',
                    minimumFractionDigits: 0,
                  }).format(bakery.min_order_minor / 100)}
                </span>
              )}
            </div>
          </div>
          <Link to={`/b/${bakerySlug}/menu`}>
            <Button className="bg-bakery-primary text-bakery-primary-foreground">
              Browse menu
              <IconNavigationMenu size="sm" color="default" className="ml-2" alt="" />
            </Button>
          </Link>
        </div>

        {/* Category Strip */}
        {categories && categories.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-platform-fg">Categories</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/b/${bakerySlug}/menu?category=${category.slug}`}
                  className="inline-block whitespace-nowrap rounded-full bg-platform-accent px-4 py-2 text-sm font-medium text-platform-fg hover:bg-bakery-primary hover:text-bakery-primary-foreground transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products */}
        {productsData && productsData.products.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-platform-fg">Featured products</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productsData.products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-lg border border-platform-border bg-platform-surface hover:shadow-md transition-shadow"
                >
                  {product.image_urls.length > 0 && (
                    <img
                      src={cloudinaryImage(product.image_urls[0], { w: 300, q: 'auto' })}
                      alt={product.name}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-platform-fg">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 text-sm text-platform-fg-muted line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-bakery-primary">
                        UGX {(product.base_price_minor / 100).toLocaleString()}
                      </span>
                      <Link to={`/b/${bakerySlug}/products/${product.slug}`}>
                        <Button
                          size="sm"
                          className="bg-bakery-primary text-bakery-primary-foreground"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!productsData ||
          (productsData.products.length === 0 && (
            <div className="rounded-lg border border-platform-border bg-platform-surface p-8 text-center">
              <IconProductBreadLoaf size="lg" color="default" className="mx-auto mb-4" alt="" />
              <h3 className="text-lg font-semibold text-platform-fg">No products yet</h3>
              <p className="mt-1 text-platform-fg-muted">
                This bakery hasn't added any products yet. Check back soon!
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}
