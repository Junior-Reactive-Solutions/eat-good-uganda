import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { ProductForm } from '../components/ProductForm'
import { VariantManager } from '../components/VariantManager'
import { IconNavigationMenu } from '../components/icons'
import {
  useProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  type CreateProductInput,
} from '../features/menu/api'

// Match the schema from ProductForm for type inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const productFormSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(255),
  name: z.string().min(1, 'Name is required').max(255),
  base_price_minor: z
    .number()
    .int('Price must be a whole number')
    .positive('Price must be greater than 0'),
  category_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_urls: z.array(z.string()),
  tags: z.array(z.string()),
  is_published: z.boolean(),
  is_available: z.boolean(),
  requires_advance_notice_hours: z.number().int().nonnegative().optional().nullable(),
  sort_order: z.number().int().optional(),
})

type ProductFormData = z.infer<typeof productFormSchema>

export function ProductFormPage() {
  const { productId } = useParams<{ productId?: string }>()
  const navigate = useNavigate()
  const isEditMode = !!productId

  // Fetch product if editing
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useProductDetail(productId || '')

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories()

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct(productId || '')

  // Success handling - redirect on successful mutations
  useEffect(() => {
    if (createProduct.isSuccess) {
      void navigate('/menu')
    }
  }, [createProduct.isSuccess, navigate])

  useEffect(() => {
    if (updateProduct.isSuccess) {
      void navigate('/menu')
    }
  }, [updateProduct.isSuccess, navigate])

  const handleSubmit = (formData: ProductFormData): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Transform form data to API input (remove slug which is not part of the API)
      const apiData = {
        name: formData.name,
        description: formData.description,
        base_price_minor: formData.base_price_minor,
        category_id: formData.category_id,
        image_urls: formData.image_urls,
        tags: formData.tags,
        is_published: formData.is_published,
        is_available: formData.is_available,
        requires_advance_notice_hours: formData.requires_advance_notice_hours,
        sort_order: formData.sort_order,
      } as CreateProductInput

      if (isEditMode) {
        updateProduct.mutate(apiData)
      } else {
        createProduct.mutate(apiData)
      }

      // Resolve immediately - mutations are handled separately
      resolve()
    })
  }

  const handleCancel = (): void => {
    void navigate('/menu')
  }

  const isLoading = isProductLoading || isCategoriesLoading
  const isMutating = createProduct.isPending || updateProduct.isPending
  const categories = categoriesData?.items || []

  return (
    <div className="space-y-6 p-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Link to="/menu">
          <Button variant="ghost" size="sm" className="gap-2">
            <IconNavigationMenu size="sm" color="default" alt="" />
            Back
          </Button>
        </Link>

        {isEditMode ? (
          <PageHeader title={`Edit Product${product ? `: ${product.name}` : ''}`} />
        ) : (
          <PageHeader title="Create Product" />
        )}
      </div>

      {/* Error State - Product Fetch */}
      {productError && isEditMode && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error mb-3">
            {productError instanceof Error ? productError.message : 'Failed to load product'}
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner label="Loading product information..." />
        </div>
      )}

      {/* Form and Variants Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <ProductForm
              initialData={product ? product : {}}
              categories={categories}
              isLoading={isMutating}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>

          {/* Variants Section (Edit Mode Only) */}
          {isEditMode && product && (
            <div className="lg:col-span-1">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-platform-fg">Variants</h2>
                <VariantManager variants={[]} isLoading={isMutating} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mutation Errors */}
      {createProduct.isError && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {createProduct.error instanceof Error
              ? createProduct.error.message
              : 'Failed to create product'}
          </p>
        </div>
      )}

      {updateProduct.isError && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {updateProduct.error instanceof Error
              ? updateProduct.error.message
              : 'Failed to update product'}
          </p>
        </div>
      )}
    </div>
  )
}
