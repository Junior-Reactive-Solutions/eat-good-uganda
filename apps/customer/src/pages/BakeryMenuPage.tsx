import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { usePublicBakery, usePublicCategories, usePublicProducts } from '../features/bakery/api'
import cloudinaryImage from '../lib/cloudinary'

export default function BakeryMenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [localPage, setLocalPage] = useState(1)

  // Move hooks before any early returns
  const { data: bakery, isLoading: isBakeryLoading } = usePublicBakery(slug ?? '')
  const { data: categories } = usePublicCategories(slug ?? '')
  const selectedCategory = searchParams.get('category') ?? undefined
  const pageSize = 20
  const { data: productsData, isLoading: isProductsLoading } = usePublicProducts(slug ?? '', {
    category: selectedCategory,
    page: localPage,
    pageSize,
  })

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
        <h1 className="text-2xl font-bold text-platform-fg">Bakery not found</h1>
      </div>
    )
  }

  const currentPage = productsData?.page ?? 1
  const total = productsData?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const handleCategorySelect = (categorySlug: string | null) => {
    setLocalPage(1)
    if (categorySlug) {
      setSearchParams({ category: categorySlug })
    } else {
      setSearchParams({})
    }
  }

  if (!slug) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to={`/b/${slug}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-platform-fg-muted hover:text-platform-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to bakery
      </Link>

      <h1 className="mb-6 text-3xl font-bold text-platform-fg">Menu</h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Category Sidebar (Desktop) */}
        {categories && categories.length > 0 && (
          <aside className="hidden w-48 shrink-0 lg:block">
            <nav aria-label="Categories" className="sticky top-20 space-y-1">
              <button
                onClick={() => {
                  handleCategorySelect(null)
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-bakery-primary text-bakery-primary-foreground'
                    : 'text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg'
                }`}
              >
                All products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    handleCategorySelect(category.slug)
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedCategory === category.slug
                      ? 'bg-bakery-primary text-bakery-primary-foreground'
                      : 'text-platform-fg-muted hover:bg-platform-accent hover:text-platform-fg'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Mobile Category Strip */}
        {categories && categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            <button
              onClick={() => {
                handleCategorySelect(null)
              }}
              className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-bakery-primary text-bakery-primary-foreground'
                  : 'bg-platform-accent text-platform-fg hover:bg-bakery-primary hover:text-bakery-primary-foreground'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  handleCategorySelect(category.slug)
                }}
                className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-bakery-primary text-bakery-primary-foreground'
                    : 'bg-platform-accent text-platform-fg hover:bg-bakery-primary hover:text-bakery-primary-foreground'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {isProductsLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : productsData && productsData.products.length > 0 ? (
            <>
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
                        <Link to={`/b/${slug}/products/${product.slug}`}>
                          <Button
                            size="sm"
                            className="bg-bakery-primary text-bakery-primary-foreground"
                          >
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setLocalPage((p) => Math.max(1, p - 1))
                    }}
                    disabled={!hasPrevPage}
                    className="inline-flex items-center gap-2 rounded-lg border border-platform-border px-3 py-2 text-sm font-medium text-platform-fg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-platform-accent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-platform-fg-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setLocalPage((p) => Math.min(totalPages, p + 1))
                    }}
                    disabled={!hasNextPage}
                    className="inline-flex items-center gap-2 rounded-lg border border-platform-border px-3 py-2 text-sm font-medium text-platform-fg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-platform-accent"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-platform-border bg-platform-surface p-8 text-center">
              <Utensils
                className="mx-auto mb-4 h-12 w-12 text-platform-fg-muted"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-platform-fg">
                No products in this category
              </h3>
              <p className="mt-1 text-platform-fg-muted">
                Try selecting a different category or come back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
