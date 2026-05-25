import type { Product, ProductCategory } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from './Button'
import { Card } from './Card'
import {
  IconNavigationCart,
  IconInteractionDelete,
} from './icons'

// Validation schema
const productFormSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(255),
  name: z.string().min(1, 'Name is required').max(255),
  base_price_minor: z
    .number()
    .int('Price must be a whole number')
    .positive('Price must be greater than 0'),
  category_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_urls: z.array(z.string().url('Must be a valid URL')),
  tags: z.array(z.string()),
  is_published: z.boolean(),
  is_available: z.boolean(),
  requires_advance_notice_hours: z.number().int().nonnegative().optional().nullable(),
  sort_order: z.number().int().optional(),
})

type ProductFormData = z.infer<typeof productFormSchema>

interface ProductFormProps {
  categories: ProductCategory[]
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Product>
  isLoading?: boolean
}

export function ProductForm({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: ProductFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      name: initialData?.name || '',
      base_price_minor: initialData?.base_price_minor || 0,
      category_id: initialData?.category_id || '',
      description: initialData?.description || '',
      image_urls: initialData?.image_urls || [],
      tags: initialData?.tags || [],
      is_published: initialData?.is_published || false,
      is_available: initialData?.is_available ?? true,
      requires_advance_notice_hours: initialData?.requires_advance_notice_hours || null,
      sort_order: initialData?.sort_order || 0,
    },
  })

  const imageUrls = watch('image_urls')
  const tags = watch('tags')
  const name = watch('name')

  // Auto-populate slug from name on create mode
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!initialData?.id) {
      const slugValue = e.target.value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
      setValue('slug', slugValue)
    }
  }

  const handleAddImage = () => {
    setValue('image_urls', [...imageUrls, ''])
  }

  const handleRemoveImage = (index: number) => {
    setValue('image_urls', imageUrls.filter((_, i) => i !== index))
  }

  const handleAddTag = () => {
    setValue('tags', [...tags, ''])
  }

  const handleRemoveTag = (index: number) => {
    setValue('tags', tags.filter((_, i) => i !== index))
  }

  const isSubmittingOrLoading = isSubmitting || isLoading

  return (
    <Card className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-platform-fg">Basic Information</legend>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-platform-fg mb-1">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Chocolate Cake"
              {...register('name')}
              onChangeCapture={handleNameChange}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-platform-error">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-platform-fg mb-1">
              Slug *
            </label>
            <input
              id="slug"
              type="text"
              placeholder="e.g., chocolate-cake"
              {...register('slug')}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              aria-invalid={!!errors.slug}
              aria-describedby={errors.slug ? 'slug-error' : undefined}
            />
            {errors.slug && (
              <p id="slug-error" className="mt-1 text-sm text-platform-error">
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="base_price_minor" className="block text-sm font-medium text-platform-fg mb-1">
              Price (UGX) *
            </label>
            <input
              id="base_price_minor"
              type="number"
              placeholder="0"
              {...register('base_price_minor', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              aria-invalid={!!errors.base_price_minor}
              aria-describedby={errors.base_price_minor ? 'price-error' : undefined}
            />
            {errors.base_price_minor && (
              <p id="price-error" className="mt-1 text-sm text-platform-error">
                {errors.base_price_minor.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-platform-fg mb-1">
              Category
            </label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              aria-invalid={!!errors.category_id}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Description */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-platform-fg">Description</legend>
          <textarea
            id="description"
            placeholder="Describe your product..."
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary resize-none"
          />
        </fieldset>

        {/* Images */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-platform-fg">Images</legend>
          {imageUrls.map((_, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register(`image_urls.${index}`)}
                className="flex-1 px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleRemoveImage(index)}
                aria-label="Remove image"
              >
                <IconInteractionDelete size="sm" color="default" alt="" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAddImage}
            className="gap-2"
          >
            <IconNavigationCart size="sm" color="default" alt="" />
            Add Image
          </Button>
        </fieldset>

        {/* Tags */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-platform-fg">Tags</legend>
          {tags.map((_, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., vegan, gluten-free"
                {...register(`tags.${index}`)}
                className="flex-1 px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleRemoveTag(index)}
                aria-label="Remove tag"
              >
                <IconInteractionDelete size="sm" color="default" alt="" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAddTag}
            className="gap-2"
          >
            <IconNavigationCart size="sm" color="default" alt="" />
            Add Tag
          </Button>
        </fieldset>

        {/* Availability and Publishing */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-platform-fg">Availability</legend>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              {...register('is_available')}
              className="h-4 w-4 rounded border-platform-border text-bakery-primary focus:ring-2 focus:ring-bakery-primary"
            />
            <label htmlFor="is_available" className="text-sm text-platform-fg">
              Product is available
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              {...register('is_published')}
              className="h-4 w-4 rounded border-platform-border text-bakery-primary focus:ring-2 focus:ring-bakery-primary"
            />
            <label htmlFor="is_published" className="text-sm text-platform-fg">
              Publish to customer menu
            </label>
          </div>
          <div>
            <label htmlFor="requires_advance_notice_hours" className="block text-sm font-medium text-platform-fg mb-1">
              Advance Notice (hours)
            </label>
            <input
              id="requires_advance_notice_hours"
              type="number"
              placeholder="0"
              {...register('requires_advance_notice_hours', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
            />
          </div>
        </fieldset>

        {/* Sort Order */}
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-platform-fg mb-1">
            Sort Order
          </label>
          <input
            id="sort_order"
            type="number"
            placeholder="0"
            {...register('sort_order', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-platform-border rounded-md bg-platform-surface text-platform-fg placeholder-platform-fg-muted focus:outline-none focus:ring-2 focus:ring-bakery-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-platform-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isSubmittingOrLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            disabled={isSubmittingOrLoading}
            className="flex-1"
          >
            {isSubmittingOrLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
