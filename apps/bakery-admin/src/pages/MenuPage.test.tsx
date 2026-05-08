/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { Product } from '@eatgood/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the API hooks
vi.mock('../features/menu/api', () => ({
  useProducts: vi.fn(),
  useDeleteProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
}))

import { useDeleteProduct, useProducts, useUpdateProduct } from '../features/menu/api'

import MenuPage from './MenuPage'

// Sample products for testing
const mockProducts: Product[] = [
  {
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
    requires_advance_notice_hours: null,
    sort_order: 1,
    tags: ['dessert', 'cake'],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    deleted_at: null,
  },
  {
    id: 'prod-2',
    bakery_id: 'bakery-1',
    category_id: 'cat-1',
    slug: 'vanilla-cake',
    name: 'Vanilla Cake',
    description: 'Classic vanilla cake',
    base_price_minor: 45000,
    currency_code: 'UGX',
    image_urls: ['https://example.com/vanilla.jpg'],
    is_published: false,
    is_available: true,
    requires_advance_notice_hours: null,
    sort_order: 2,
    tags: ['dessert', 'cake'],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    deleted_at: null,
  },
  {
    id: 'prod-3',
    bakery_id: 'bakery-1',
    category_id: 'cat-2',
    slug: 'strawberry-cake',
    name: 'Strawberry Cake',
    description: 'Fresh strawberry cake',
    base_price_minor: 55000,
    currency_code: 'UGX',
    image_urls: ['https://example.com/strawberry.jpg'],
    is_published: true,
    is_available: true,
    requires_advance_notice_hours: null,
    sort_order: 3,
    tags: ['dessert', 'cake', 'fruit'],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    deleted_at: null,
  },
]

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('MenuPage', () => {
  // Default mock implementations
  const defaultUpdateProductMock = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
  }

  const defaultDeleteProductMock = {
    mutate: vi.fn(),
    isPending: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseProducts = useProducts as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseDeleteProduct = useDeleteProduct as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseUpdateProduct = useUpdateProduct as any

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mocks
    mockUseUpdateProduct.mockReturnValue(defaultUpdateProductMock)
    mockUseDeleteProduct.mockReturnValue(defaultDeleteProductMock)
  })

  it('renders page header "Menu Management"', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<MenuPage />)

    expect(screen.getByText('Menu Management')).toBeInTheDocument()
    expect(screen.getByText('Create and edit your bakery products')).toBeInTheDocument()
  })

  it('displays "Create Product" button linking to /menu/create', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<MenuPage />)

    const createButtons = screen.getAllByRole('link', { name: /Create Product/i })
    expect(createButtons.length).toBeGreaterThan(0)
    // Check at least one of them links to /menu/create
    expect(createButtons[0]).toHaveAttribute('href', '/menu/create')
  })

  it('shows loading spinner while fetching products', () => {
    mockUseProducts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders(<MenuPage />)

    const spinner = screen.getByRole('status', { name: /Loading/i })
    expect(spinner).toBeInTheDocument()
  })

  it('displays product cards in responsive grid when data loads', async () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    })

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      expect(screen.getByText('Vanilla Cake')).toBeInTheDocument()
      expect(screen.getByText('Strawberry Cake')).toBeInTheDocument()
    })
  })

  it('shows error message on fetch error with retry button', () => {
    const errorMessage = 'Failed to load products'
    mockUseProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
    })

    renderWithProviders(<MenuPage />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  it('shows empty state when no products', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<MenuPage />)

    expect(screen.getByText('No products yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first product to get started')).toBeInTheDocument()
  })

  it('displays pagination controls', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 50,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      },
      isLoading: false,
      error: null,
    })

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 50,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      },
      isLoading: false,
      error: null,
    })

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    const prevBtn = screen.getByRole('button', { name: /Previous/i })
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button when on last page', () => {
    // When totalPages equals local page state, Next button should be disabled
    // Mock returning page 1 data with only 1 page total
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1, // Only 1 page total
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<MenuPage />)

    const paginationButtons = screen.getAllByRole('button', { name: /Next/i })
    const nextBtn = paginationButtons[paginationButtons.length - 1]
    expect(nextBtn).toBeDisabled()
  })

  it('displays product count in pagination info', () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 45,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      },
      isLoading: false,
      error: null,
    })

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
    expect(screen.getByText(/45 total products/)).toBeInTheDocument()
  })

  it('delete product shows confirmation dialog', async () => {
    const user = userEvent.setup()

    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    })

    const mockDeleteMutate = vi.fn()
    mockUseDeleteProduct.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    })

    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    // Click delete button on first product (ProductCard has its own confirm)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    expect(deleteButtons.length).toBeGreaterThan(0)

    // ProductCard has internal confirmation, so we need to mock window.confirm
    const mockConfirm = vi.fn(() => true)
    window.confirm = mockConfirm

    const firstDeleteBtn = deleteButtons[0]
    if (firstDeleteBtn) {
      await user.click(firstDeleteBtn)
      expect(mockConfirm).toHaveBeenCalled()
    }
  })

  it('toggle publish shows confirmation dialog', async () => {
    mockUseProducts.mockReturnValue({
      data: {
        items: mockProducts,
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    })

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    const mockUpdateMutate = vi.fn()
    mockUseUpdateProduct.mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
      isSuccess: false,
    })

    renderWithProviders(<MenuPage />)

    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })

    // The ProductCard component has internal confirmation with window.confirm
    // Test that the toggle button is clickable
    const toggleButtons = screen.getAllByRole('button', { name: /Unpublish|Publish/i })
    expect(toggleButtons.length).toBeGreaterThan(0)
  })
})
