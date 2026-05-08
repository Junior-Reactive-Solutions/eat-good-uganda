import type { Product } from '@eatgood/shared'
import { Edit2, EyeOff, Eye, Trash2, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from './Button'
import { Card } from './Card'

interface ProductCardProps {
  product: Product
  onDelete: (productId: string) => void
  onTogglePublish: (productId: string, isPublished: boolean) => void
  categoryName?: string
}

export function ProductCard({
  product,
  onDelete,
  onTogglePublish,
  categoryName,
}: ProductCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      onDelete(product.id)
    }
  }

  return (
    <Card className="rounded-lg border border-platform-border bg-platform-surface p-4 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Image */}
      <div className="relative mb-3 h-40 bg-platform-bg rounded-md overflow-hidden flex items-center justify-center border border-platform-border/50">
        {product.image_urls.length > 0 ? (
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Utensils className="h-8 w-8 text-platform-fg-muted" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Name and Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-platform-fg">
            {product.name}
          </h3>
          {product.is_published ? (
            <span
              className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 shrink-0"
              aria-label="Published"
            >
              Published
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 shrink-0"
              aria-label="Draft"
            >
              Draft
            </span>
          )}
        </div>

        {/* Category and Availability */}
        <div className="mb-3 space-y-1">
          <p className="text-xs text-platform-fg-muted">
            {categoryName ? `Category: ${categoryName}` : 'Uncategorized'}
          </p>
          <p className="text-xs text-platform-fg-muted">
            {product.is_available ? 'Available' : 'Unavailable'}
          </p>
        </div>

        {/* Price */}
        <p className="text-sm font-semibold text-platform-fg mb-4">
          {new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
          }).format(product.base_price_minor / 100)}
        </p>
      </div>

      {/* Actions */}
      <div className="border-t border-platform-border pt-3 flex gap-2">
        <Link to={`/menu/edit/${product.id}`} className="flex-1">
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-1.5"
            aria-label={`Edit ${product.name}`}
          >
            <Edit2 className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onTogglePublish(product.id, !product.is_published)
          }}
          aria-label={
            product.is_published ? `Unpublish ${product.name}` : `Publish ${product.name}`
          }
        >
          {product.is_published ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDelete}
          className="text-platform-error"
          aria-label={`Delete ${product.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}
