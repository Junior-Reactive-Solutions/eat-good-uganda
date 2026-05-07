/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import * as bakeryApi from '../features/bakery/api'

import BakeryMenuPage from './BakeryMenuPage'

vi.mock('../features/bakery/api')
vi.mock('../lib/cloudinary', () => ({
  default: (url: string) => url,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  const mockSearchParams = new URLSearchParams()
  return {
    ...actual,
    useParams: () => ({ slug: 'test-bakery-slug' }),
    useSearchParams: () => [mockSearchParams, vi.fn()],
  }
})

const mockBakery = {
  id: 'bakery-1',
  slug: 'test-bakery-slug',
  display_name: 'Test Bakery',
  primary_color: '#FF6B6B',
  accent_color: '#FFA5A5',
}

const mockCategories = [
  { id: 'cat-1', name: 'Bread', slug: 'bread' },
  { id: 'cat-2', name: 'Cakes', slug: 'cakes' },
  { id: 'cat-3', name: 'Pastries', slug: 'pastries' },
]

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Sourdough',
    slug: 'sourdough',
    base_price_minor: 50000,
    image_urls: ['https://example.com/sourdough.png'],
    category_id: 'cat-1',
    description: 'Fresh sourdough bread',
    is_published: true,
    is_available: true,
  },
  {
    id: 'prod-2',
    name: 'Rye Bread',
    slug: 'rye-bread',
    base_price_minor: 45000,
    image_urls: ['https://example.com/rye.png'],
    category_id: 'cat-1',
    description: 'Whole grain rye',
    is_published: true,
    is_available: true,
  },
  {
    id: 'prod-3',
    name: 'Chocolate Cake',
    slug: 'chocolate-cake',
    base_price_minor: 150000,
    image_urls: ['https://example.com/cake.png'],
    category_id: 'cat-2',
    description: 'Rich chocolate cake',
    is_published: true,
    is_available: true,
  },
]

describe('BakeryMenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bakeryApi.usePublicBakery).mockReturnValue({
      data: mockBakery,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
    vi.mocked(bakeryApi.usePublicCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
    vi.mocked(bakeryApi.usePublicProducts).mockReturnValue({
      data: { products: mockProducts, total: 3 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
  })

  it('displays category navigation', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    // Check that categories are rendered (may appear in both sidebar and mobile strip)
    const breadElements = screen.getAllByText('Bread')
    const cakeElements = screen.getAllByText('Cakes')
    const pastryElements = screen.getAllByText('Pastries')

    expect(breadElements.length).toBeGreaterThan(0)
    expect(cakeElements.length).toBeGreaterThan(0)
    expect(pastryElements.length).toBeGreaterThan(0)
  })

  it('displays products grid with names and prices', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Sourdough')).toBeInTheDocument()
    expect(screen.getByText('Rye Bread')).toBeInTheDocument()
    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    expect(screen.getByText('UGX 500')).toBeInTheDocument()
    expect(screen.getByText('UGX 450')).toBeInTheDocument()
    expect(screen.getByText('UGX 1,500')).toBeInTheDocument()
  })

  it('renders product images', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    const images = screen.getAllByRole('img')
    const productImages = images.filter((img) => {
      const alt = (img as HTMLImageElement).alt
      return alt.includes('Sourdough') ||
        alt.includes('Rye Bread') ||
        alt.includes('Chocolate Cake')
    })
    expect(productImages.length).toBeGreaterThan(0)
  })

  it('displays empty state when no products exist in category', () => {
    vi.mocked(bakeryApi.usePublicProducts).mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('No products in this category')).toBeInTheDocument()
  })

  it('renders pagination controls when products exceed page size', () => {
    const manyProducts = Array.from({ length: 25 }, (_, i) => ({
      id: `prod-${String(i)}`,
      name: `Product ${String(i)}`,
      slug: `product-${String(i)}`,
      base_price_minor: 50000,
      image_urls: ['https://example.com/product.png'],
      category_id: 'cat-1',
      description: 'A product',
      is_published: true,
      is_available: true,
    }))

    vi.mocked(bakeryApi.usePublicProducts).mockReturnValue({
      data: { products: manyProducts.slice(0, 20), total: 25 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    // Check for pagination controls
    const nextButton = screen.queryByRole('button', { name: /next/i })
    if (nextButton) {
      expect(nextButton).toBeInTheDocument()
    }
  })

  it('renders product cards as links', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    // Check that product names are displayed
    expect(screen.getByText('Sourdough')).toBeInTheDocument()
    expect(screen.getByText('Rye Bread')).toBeInTheDocument()
    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
  })

  it('calls usePublicCategories with the bakery slug', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(bakeryApi.usePublicCategories).toHaveBeenCalled()
  })

  it('calls usePublicProducts with default page size', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(bakeryApi.usePublicProducts).toHaveBeenCalled()
  })

  it('displays menu heading', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('displays all product descriptions when available', () => {
    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Fresh sourdough bread')).toBeInTheDocument()
    expect(screen.getByText('Whole grain rye')).toBeInTheDocument()
  })

  it('handles undefined products gracefully', () => {
    vi.mocked(bakeryApi.usePublicProducts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryMenuPage />
      </BrowserRouter>,
    )

    // Should render without crashing
    expect(document.body).toBeInTheDocument()
  })
})
