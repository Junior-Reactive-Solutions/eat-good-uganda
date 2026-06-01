/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { Product, ProductCategory } from '@eatgood/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as menuApi from '../features/menu/api'

import { ProductFormPage } from './ProductFormPage'

// Mock the menu API
vi.mock('../features/menu/api', () => ({
  useProductDetail: vi.fn(),
  useCreateProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
  useCategories: vi.fn(),
  menuQueryKeys: {},
}))

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

function renderProductFormPage(initialRoute = '/menu/create') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const component = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/menu" element={<div>Menu Page</div>} />
          <Route path="/menu/create" element={<ProductFormPage />} />
          <Route path="/menu/:productId/edit" element={<ProductFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )

  return render(component)
}

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(menuApi.useProductDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any)
  })

  describe('Create mode', () => {
    it('renders create product page when no productId param', () => {
      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      expect(screen.getByText('Create Product')).toBeInTheDocument()
      expect(screen.getByLabelText(/Product Name \*/)).toBeInTheDocument()
    })

    it('shows empty form fields in create mode', () => {
      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      const nameInput = screen.getByLabelText(/Product Name \*/)
      expect((nameInput as HTMLInputElement).value).toBe('')
    })

    it('calls useCreateProduct mutation on form submission in create mode', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      await user.type(screen.getByLabelText(/Product Name \*/), 'Test Cake')
      await user.type(screen.getByLabelText(/Slug \*/), 'test-cake')
      await user.type(screen.getByLabelText(/Price \(UGX\) \*/), '50000')

      await user.click(screen.getByText(/Save Product/))

      expect(mockMutate).toHaveBeenCalled()
    })

    it('does not show VariantManager in create mode', () => {
      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      expect(screen.queryByText('Variants')).not.toBeInTheDocument()
    })
  })

  describe('Edit mode', () => {
    it('renders edit product page with productId param', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      expect(screen.getByText(/Edit Product: Chocolate Cake/)).toBeInTheDocument()
    })

    it('pre-populates form with product data in edit mode', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      expect((screen.getByDisplayValue('Chocolate Cake')).value).toBe(
        'Chocolate Cake',
      )
      expect((screen.getByDisplayValue('50000')).value).toBe('50000')
    })

    it('shows VariantManager in edit mode with product variants', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      expect(screen.getByText('Variants')).toBeInTheDocument()
    })

    it('calls useUpdateProduct mutation on form submission in edit mode', async () => {
      const user = userEvent.setup()
      const mockMutate = vi.fn()

      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      const nameInput = screen.getByLabelText(/Product Name \*/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Cake')

      await user.click(screen.getByText(/Save Product/))

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('Loading states', () => {
    it('shows loading spinner while fetching product in edit mode', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows loading state while categories are loading', async () => {
      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      // When categories are loading, the spinner should be shown
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Error states', () => {
    it('shows error message when fetching product fails', () => {
      const errorMsg = 'Failed to fetch product'
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMsg),
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      expect(screen.getByText(errorMsg)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('shows error message when mutation fails', () => {
      const errorMsg = 'Failed to create product'

      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: new Error(errorMsg),
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      expect(screen.getByText(errorMsg)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('back button navigates to menu page', async () => {
      const user = userEvent.setup()

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      const backButton = screen.getByRole('link', { name: /Back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('Menu Page')).toBeInTheDocument()
      })
    })

    it('redirects to menu page on successful create', async () => {
      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/create')

      await waitFor(() => {
        expect(screen.getByText('Menu Page')).toBeInTheDocument()
      })
    })

    it('redirects to menu page on successful update', async () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      await waitFor(() => {
        expect(screen.getByText('Menu Page')).toBeInTheDocument()
      })
    })
  })

  describe('Layout', () => {
    it('shows two-column layout on desktop in edit mode', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      const { container } = renderProductFormPage('/menu/prod-1/edit')

      const gridContainer = container.querySelector('[class*="grid"]')
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-3')
    })
  })

  describe('Categories display', () => {
    it('loads and displays categories in form', () => {
      vi.mocked(menuApi.useProductDetail).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCategories).mockReturnValue({
        data: { items: mockCategories, total: 2 },
        isLoading: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useCreateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      vi.mocked(menuApi.useUpdateProduct).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any)

      renderProductFormPage('/menu/prod-1/edit')

      const categorySelect = screen.getByLabelText(/Category/)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((categorySelect as any).options.length).toBeGreaterThan(0)
    })
  })
})
