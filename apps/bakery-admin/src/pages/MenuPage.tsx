import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { ProductCard } from '../components/ProductCard'
import { useProducts, useDeleteProduct, useUpdateProduct } from '../features/menu/api'

export default function MenuPage() {
  const [page, setPage] = useState(1)
  const [publishConfirm, setPublishConfirm] = useState<{ id: string; isPublished: boolean } | null>(
    null,
  )

  const { data, isLoading, error } = useProducts(page, 20)
  const deleteProduct = useDeleteProduct()
  // Use a dummy ID if publishConfirm is not set to avoid hook issues
  const updateProduct = useUpdateProduct(publishConfirm?.id ?? 'placeholder-id')

  const handleDeleteProduct = (productId: string) => {
    deleteProduct.mutate(productId)
  }

  const handlePublishConfirm = (productId: string, isPublished: boolean) => {
    setPublishConfirm({ id: productId, isPublished })
  }

  const handlePublishCancel = () => {
    setPublishConfirm(null)
  }

  useEffect(() => {
    // Only close dialog if we have a confirmed publish action and mutation succeeded
    if (publishConfirm && 'isSuccess' in updateProduct && updateProduct.isSuccess) {
      setPublishConfirm(null)
    }
  }, [publishConfirm, updateProduct])

  const handlePublishSubmit = () => {
    if (!publishConfirm) return
    updateProduct.mutate({ is_published: !publishConfirm.isPublished })
  }

  const hasNextPage = data ? page < data.totalPages : false
  const hasPreviousPage = page > 1

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Menu Management" subtitle="Create and edit your bakery products" />
        <Link to="/menu/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSpinner label="Loading products..." />}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error mb-3">
            {error instanceof Error ? error.message : 'Failed to load products'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.reload()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.items.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Create your first product to get started"
          action={
            <Link to="/menu/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </Link>
          }
        />
      )}

      {/* Product Grid */}
      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
                onTogglePublish={handlePublishConfirm}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6 border-t border-platform-border">
            <p className="text-sm text-platform-fg-muted">
              Page {page} of {data.totalPages} ({data.total} total products)
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                disabled={!hasPreviousPage}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                onClick={() => { setPage((p) => p + 1); }}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Publish Confirmation Dialog */}
      {publishConfirm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-platform-surface rounded-lg shadow-lg max-w-sm w-full p-6 border border-platform-border">
            <h2 className="text-lg font-semibold text-platform-fg mb-2">
              {publishConfirm.isPublished ? 'Unpublish Product' : 'Publish Product'}
            </h2>
            <p className="text-sm text-platform-fg-muted mb-6">
              {publishConfirm.isPublished
                ? 'This product will no longer be visible to customers.'
                : 'This product will be visible to customers.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handlePublishCancel}
                disabled={updateProduct.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublishSubmit}
                disabled={updateProduct.isPending}
                className="flex-1"
              >
                {updateProduct.isPending
                  ? 'Updating...'
                  : publishConfirm.isPublished
                    ? 'Unpublish'
                    : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
