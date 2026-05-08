import type { Product, ProductCategory } from '@eatgood/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { z } from 'zod'

import { ProductForm } from './ProductForm'

// Replicate the schema from ProductForm for type checking
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

const mockCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    bakery_id: 'bakery-1',
    name: 'Cakes',
    slug: 'cakes',
    sort_order: 1,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'cat-2',
    bakery_id: 'bakery-1',
    name: 'Pastries',
    slug: 'pastries',
    sort_order: 2,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
]

const mockProduct: Product = {
  id: 'prod-1',
  bakery_id: 'bakery-1',
  category_id: 'cat-1',
  slug: 'chocolate-cake',
  name: 'Chocolate Cake',
  description: 'Delicious chocolate cake',
  base_price_minor: 50000,
  currency_code: 'UGX',
  image_urls: ['https://example.com/cake.jpg'],
  is_published: true,
  is_available: true,
  requires_advance_notice_hours: 2,
  sort_order: 1,
  tags: ['dessert', 'cake'],
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  deleted_at: null,
}

describe('ProductForm', () => {
  const mockOnSubmit = vi.fn(async (_data: ProductFormData) => {}) as any
  const mockOnCancel = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Form rendering', () => {
    it('renders all form fields for create mode', () => {
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      // Basic info fields
      expect(screen.getByLabelText(/Product Name \*/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Slug \*/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Price \(UGX\) \*/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument()

      // Description
      expect(screen.getByPlaceholderText(/Describe your product/)).toBeInTheDocument()

      // Images
      expect(screen.getByText(/Add Image/)).toBeInTheDocument()

      // Tags
      expect(screen.getByText(/Add Tag/)).toBeInTheDocument()

      // Availability
      expect(screen.getByLabelText(/Product is available/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Publish to customer menu/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Advance Notice/)).toBeInTheDocument()

      // Sort order
      expect(screen.getByLabelText(/Sort Order/)).toBeInTheDocument()

      // Actions
      expect(screen.getByText(/Cancel/)).toBeInTheDocument()
      expect(screen.getByText(/Save Product/)).toBeInTheDocument()
    })

    it('renders category select with categories', () => {
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const categorySelect = screen.getByLabelText(/Category/) as HTMLSelectElement
      expect(categorySelect).toBeInTheDocument()
      expect(categorySelect.options.length).toBe(3) // no category + 2 categories
      expect(categorySelect.options[1]?.text).toBe('Cakes')
      expect(categorySelect.options[2]?.text).toBe('Pastries')
    })

    it('pre-fills form with initial data in edit mode', async () => {
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={mockProduct}
        />,
      )

      expect((screen.getByDisplayValue('Chocolate Cake') as HTMLInputElement).value).toBe(
        'Chocolate Cake',
      )
      expect((screen.getByDisplayValue('chocolate-cake') as HTMLInputElement).value).toBe(
        'chocolate-cake',
      )
      expect((screen.getByDisplayValue('50000') as HTMLInputElement).value).toBe('50000')
      expect((screen.getByDisplayValue('Delicious chocolate cake') as HTMLTextAreaElement).value).toBe(
        'Delicious chocolate cake',
      )
      expect((screen.getByLabelText(/Product is available/) as HTMLInputElement).checked).toBe(
        true,
      )
      expect((screen.getByLabelText(/Publish to customer menu/) as HTMLInputElement).checked).toBe(
        true,
      )
      expect((screen.getByDisplayValue('2') as HTMLInputElement).value).toBe('2')
    })
  })

  describe('Form submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      const submitButton = screen.getByText(/Save Product/)
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          name: 'Test Cake',
          slug: 'test-cake',
          base_price_minor: 50000,
        }),
      )
    })

    it('shows validation error for missing required name', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      const submitButton = screen.getByText(/Save Product/)
      await user.click(submitButton)

      expect(screen.getByText(/Name is required/)).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows validation error for missing required slug', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      // Don't fill slug - it should fail validation
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      const submitButton = screen.getByText(/Save Product/)
      await user.click(submitButton)

      expect(screen.getByText(/Slug is required/)).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows validation error for zero price', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      await user.type(screen.getByLabelText(/Product Name \*/), 'Test Cake')
      await user.type(screen.getByLabelText(/Slug \*/), 'test-cake')
      // Price defaults to 0 which is invalid

      const submitButton = screen.getByText(/Save Product/)
      await user.click(submitButton)

      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows validation error for negative price', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      await user.type(screen.getByLabelText(/Product Name \*/), 'Test Cake')
      await user.type(screen.getByLabelText(/Slug \*/), 'test-cake')
      await user.clear(screen.getByLabelText(/Price \(UGX\) \*/))
      await user.type(screen.getByLabelText(/Price \(UGX\) \*/), '-100')

      const submitButton = screen.getByText(/Save Product/)
      await user.click(submitButton)

      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('disables submit button during loading', async () => {
      const { rerender } = render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />,
      )

      const submitButton = screen.getByText(/Save Product/)
      expect(submitButton).not.toBeDisabled()

      rerender(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />,
      )

      expect(submitButton).toBeDisabled()
    })

    it('shows loading state text on submit button', async () => {
      const user = userEvent.setup()
      const slowSubmit = vi.fn(
        async () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, 100)
          }),
      ) as any

      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={slowSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      const submitButton = screen.getByText(/Save Product/) as HTMLButtonElement
      await user.click(submitButton)

      // Button should show saving state
      expect(screen.getByText(/Saving/)).toBeInTheDocument()
    })
  })

  describe('Cancel button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const cancelButton = screen.getByText(/Cancel/)
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('disables cancel button during submission', async () => {
      const { rerender } = render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />,
      )

      const cancelButton = screen.getByText(/Cancel/)
      expect(cancelButton).not.toBeDisabled()

      rerender(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />,
      )

      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Image handling', () => {
    it('adds image URL input when Add Image button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const addImageButton = screen.getByText(/Add Image/)
      await user.click(addImageButton)

      expect(screen.getByPlaceholderText(/https:\/\/example\.com\/image\.jpg/)).toBeInTheDocument()
    })

    it('removes image URL input when Remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={mockProduct}
        />,
      )

      const imageInputs = screen.getAllByPlaceholderText(/https:\/\/example\.com\/image\.jpg/)
      expect(imageInputs.length).toBeGreaterThan(0)

      const removeButtons = screen.getAllByLabelText(/Remove image/)
      await user.click(removeButtons[0]!)

      const remainingInputs = screen.queryAllByPlaceholderText(/https:\/\/example\.com\/image\.jpg/)
      expect(remainingInputs.length).toBeLessThan(imageInputs.length)
    })

    it('includes image URLs in form submission', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      await user.click(screen.getByText(/Add Image/))
      await user.type(
        screen.getByPlaceholderText(/https:\/\/example\.com\/image\.jpg/),
        'https://example.com/test.jpg',
      )

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          image_urls: ['https://example.com/test.jpg'],
        }),
      )
    })
  })

  describe('Tag handling', () => {
    it('adds tag input when Add Tag button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const addTagButton = screen.getByText(/Add Tag/)
      await user.click(addTagButton)

      expect(screen.getByPlaceholderText(/e\.g\., vegan, gluten-free/)).toBeInTheDocument()
    })

    it('removes tag input when Remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={mockProduct}
        />,
      )

      const removeButtons = screen.getAllByLabelText(/Remove tag/)
      const initialCount = removeButtons.length

      await user.click(removeButtons[0]!)

      const remainingButtons = screen.queryAllByLabelText(/Remove tag/)
      expect(remainingButtons.length).toBeLessThan(initialCount)
    })

    it('includes tags in form submission', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      await user.click(screen.getByText(/Add Tag/))
      await user.type(
        screen.getByPlaceholderText(/e\.g\., vegan, gluten-free/),
        'vegan',
      )

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          tags: ['vegan'],
        }),
      )
    })
  })

  describe('Auto-slug generation', () => {
    it('auto-populates slug from name on create mode', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/) as HTMLInputElement

      await user.type(nameInput, 'Chocolate Cake')

      expect(slugInput.value).toBe('chocolate-cake')
    })

    it('handles special characters in auto-slug generation', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/) as HTMLInputElement

      await user.type(nameInput, 'Chocolate & Vanilla Cake!')

      expect(slugInput.value).toBe('chocolate--vanilla-cake')
    })

    it('does not auto-update slug in edit mode', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={mockProduct}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/) as HTMLInputElement

      const originalSlug = slugInput.value

      await user.clear(nameInput)
      await user.type(nameInput, 'Vanilla Cake')

      expect(slugInput.value).toBe(originalSlug)
    })
  })

  describe('Optional fields', () => {
    it('accepts optional advance notice hours', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/Advance Notice/), '24')

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          requires_advance_notice_hours: 24,
        }),
      )
    })

    it('accepts optional sort order', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/Sort Order/), '5')

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          sort_order: 5,
        }),
      )
    })
  })

  describe('Availability checkboxes', () => {
    it('handles is_available checkbox correctly', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)
      const availableCheckbox = screen.getByLabelText(/Product is available/)

      expect((availableCheckbox as HTMLInputElement).checked).toBe(true)

      await user.click(availableCheckbox)
      expect((availableCheckbox as HTMLInputElement).checked).toBe(false)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          is_available: false,
        }),
      )
    })

    it('handles is_published checkbox correctly', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      )

      const nameInput = screen.getByLabelText(/Product Name \*/)
      const slugInput = screen.getByLabelText(/Slug \*/)
      const priceInput = screen.getByLabelText(/Price \(UGX\) \*/)
      const publishCheckbox = screen.getByLabelText(/Publish to customer menu/)

      expect((publishCheckbox as HTMLInputElement).checked).toBe(false)

      await user.click(publishCheckbox)
      expect((publishCheckbox as HTMLInputElement).checked).toBe(true)

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cake')
      await user.clear(slugInput)
      await user.type(slugInput, 'test-cake')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')

      await user.click(screen.getByText(/Save Product/))

      expect(mockOnSubmit).toHaveBeenCalled()
      const calls = mockOnSubmit.mock.calls as Array<[ProductFormData]>
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          is_published: true,
        }),
      )
    })
  })
})
