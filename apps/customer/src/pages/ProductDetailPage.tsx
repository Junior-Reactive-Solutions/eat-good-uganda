import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { usePublicBakery, usePublicProduct, usePublicProducts } from '../features/bakery/api'
import { CartSwitchDialog } from '../features/cart/CartSwitchDialog'
import { useAddToCart, useCart, useIsFromAnotherBakery } from '../features/cart/hooks'
import cloudinaryImage from '../lib/cloudinary'

export default function ProductDetailPage() {
  const { slug, productSlug } = useParams<{
    slug: string | undefined
    productSlug: string | undefined
  }>()
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showCartSwitchDialog, setShowCartSwitchDialog] = useState(false)

  // Move hooks before early returns
  const { data: bakery, isLoading: isBakeryLoading } = usePublicBakery(slug ?? '')
  const { data: product, isLoading: isProductLoading } = usePublicProduct(
    slug ?? '',
    productSlug ?? '',
  )
  const { data: relatedProducts } = usePublicProducts(slug ?? '', {
    category: product?.category_id ?? undefined,
    pageSize: 4,
  })

  const cart = useCart()
  const addToCart = useAddToCart()
  const isFromAnotherBakery = useIsFromAnotherBakery(bakery?.id ?? null)

  if (isBakeryLoading || isProductLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (!slug || !productSlug || !bakery || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-platform-fg">Product not found</h1>
        <p className="mt-2 text-platform-fg-muted">
          <Link to={`/b/${slug ?? ''}`} className="text-platform-primary hover:underline">
            Back to bakery
          </Link>
        </p>
      </div>
    )
  }

  const bakerySlug = slug
  const images = product.image_urls
  const currentImage = images[currentImageIndex]

  // Determine which variant is selected
  const selectedVariant =
    product.variants.length > 0
      ? (product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0])
      : undefined

  const price = selectedVariant?.price_minor ?? product.base_price_minor
  const isAvailable = selectedVariant ? selectedVariant.is_available : product.is_available

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    if (!isAvailable) {
      toast.error('This item is not available')
      return
    }

    if (isFromAnotherBakery) {
      setShowCartSwitchDialog(true)
      return
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price,
      quantity,
      notes,
    })

    if (!cart.bakeryId) {
      cart.switchBakery(bakery.id, bakerySlug)
    }

    toast.success(`Added ${String(quantity)}x ${product.name} to cart`)
    setQuantity(1)
    setNotes('')
  }

  const handleConfirmCartSwitch = () => {
    if (!selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    cart.switchBakery(bakery.id, bakerySlug)
    addToCart({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price,
      quantity,
      notes,
    })
    toast.success(`Added ${String(quantity)}x ${product.name} to cart`)
    setQuantity(1)
    setNotes('')
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') previousImage()
    if (e.key === 'ArrowRight') nextImage()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CartSwitchDialog
        isOpen={showCartSwitchDialog}
        onOpenChange={setShowCartSwitchDialog}
        newBakeryName={bakery.display_name}
        currentBakeryName={cart.bakerySlug ? 'the previous bakery' : ''}
        onConfirm={handleConfirmCartSwitch}
      />

      <Link
        to={`/b/${bakerySlug}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-platform-fg-muted hover:text-platform-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to bakery
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          {images.length > 0 ? (
            <>
              <div
                className="relative aspect-square overflow-hidden rounded-lg bg-platform-bg"
                onKeyDown={handleKeyDown}
                role="region"
                aria-label="Product image gallery"
                tabIndex={0}
              >
                {currentImage && (
                  <img
                    src={cloudinaryImage(currentImage, { w: 600, q: 'auto' })}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentImageIndex(idx)
                      }}
                      className={`shrink-0 overflow-hidden rounded-lg transition-opacity ${
                        idx === currentImageIndex
                          ? 'ring-2 ring-bakery-primary'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={cloudinaryImage(img, { w: 100, q: 'auto' })}
                        alt={`${product.name} thumbnail ${String(idx + 1)}`}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-lg bg-platform-bg flex items-center justify-center">
              <p className="text-platform-fg-muted">No image available</p>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-platform-fg">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-platform-fg-muted">{product.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-bakery-primary">
              UGX {(price / 100).toLocaleString()}
            </span>
            {!isAvailable && (
              <span className="text-sm font-semibold text-red-600">Out of stock</span>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-platform-fg mb-3">
                Choose an option
              </label>
              {product.variants.length <= 5 ? (
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex items-center gap-3 rounded-lg border border-platform-border p-3 cursor-pointer hover:bg-platform-accent transition-colors"
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        checked={
                          selectedVariantId === variant.id || selectedVariantId === undefined
                        }
                        onChange={() => {
                          setSelectedVariantId(variant.id)
                        }}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-platform-fg">{variant.name}</span>
                        <span className="ml-2 text-sm text-platform-fg-muted">
                          UGX {(variant.price_minor / 100).toLocaleString()}
                        </span>
                      </div>
                      {!variant.is_available && (
                        <span className="text-xs text-red-600 font-semibold">Out of stock</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : product.variants.length > 0 ? (
                <select
                  value={selectedVariantId ?? product.variants[0]?.id}
                  onChange={(e) => {
                    setSelectedVariantId(e.target.value)
                  }}
                  className="w-full rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-platform-fg"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id} disabled={!variant.is_available}>
                      {variant.name} - UGX {(variant.price_minor / 100).toLocaleString()}
                      {!variant.is_available ? ' (Out of stock)' : ''}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-platform-fg mb-3">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setQuantity(Math.max(1, quantity - 1))
                }}
                className="rounded-lg border border-platform-border px-3 py-2 text-platform-fg hover:bg-platform-accent transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => {
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }}
                className="w-16 rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-center text-platform-fg"
              />
              <button
                onClick={() => {
                  setQuantity(Math.min(999, quantity + 1))
                }}
                className="rounded-lg border border-platform-border px-3 py-2 text-platform-fg hover:bg-platform-accent transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-platform-fg mb-3">
              Special requests
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value.slice(0, 500))
              }}
              placeholder="Add any special requests (max 500 characters)"
              className="w-full rounded-lg border border-platform-border bg-platform-surface px-3 py-2 text-platform-fg placeholder-platform-fg-muted focus:ring-2 focus:ring-bakery-primary"
              rows={3}
            />
            <p className="mt-1 text-xs text-platform-fg-muted">{notes.length}/500</p>
          </div>

          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="bg-bakery-primary text-bakery-primary-foreground flex items-center justify-center gap-2 py-3"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to cart
          </Button>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.products.length > 0 && (
        <div className="mt-16 pt-8 border-t border-platform-border">
          <h2 className="mb-6 text-2xl font-bold text-platform-fg">Related products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.products.map((relProduct) => (
              <Link key={relProduct.id} to={`/b/${bakerySlug}/products/${relProduct.slug}`}>
                <div className="overflow-hidden rounded-lg border border-platform-border bg-platform-surface hover:shadow-md transition-shadow">
                  {relProduct.image_urls.length > 0 && (
                    <img
                      src={cloudinaryImage(relProduct.image_urls[0], { w: 300, q: 'auto' })}
                      alt={relProduct.name}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-platform-fg">{relProduct.name}</h3>
                    <p className="mt-2 text-lg font-bold text-bakery-primary">
                      UGX {(relProduct.base_price_minor / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
