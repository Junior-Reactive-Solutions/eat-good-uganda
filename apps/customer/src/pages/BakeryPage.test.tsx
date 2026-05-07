/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import * as bakeryApi from '../features/bakery/api'

import BakeryPage from './BakeryPage'

// Mock the API hooks
vi.mock('../features/bakery/api')
vi.mock('../lib/cloudinary', () => ({
  default: (url: string) => url,
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: 'test-bakery-slug' }),
  }
})

const mockBakery = {
  id: 'test-bakery-1',
  slug: 'test-bakery-slug',
  display_name: 'Test Bakery',
  tagline: 'Fresh baked goods',
  description: 'A great bakery',
  address_line1: '123 Main St',
  city: 'Kampala',
  phone: '+256123456789',
  primary_color: '#FF6B6B',
  accent_color: '#FFA5A5',
  logo_url: 'https://example.com/logo.png',
  hero_image_url: 'https://example.com/hero.png',
}

const mockCategories = [
  { id: 'cat-1', name: 'Bread', slug: 'bread' },
  { id: 'cat-2', name: 'Cakes', slug: 'cakes' },
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

describe('BakeryPage', () => {
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
      data: { products: mockProducts, total: 2 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
  })

  it('displays loading spinner while loading bakery', () => {
    vi.mocked(bakeryApi.usePublicBakery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays not found message when bakery does not exist', () => {
    vi.mocked(bakeryApi.usePublicBakery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Bakery not found')).toBeInTheDocument()
  })

  it('displays bakery hero image when available', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    const images = screen.getAllByAltText('Test Bakery')
    const heroImage = images.find((img) => (img as HTMLImageElement).src.includes('hero.png'))
    expect(heroImage).toBeInTheDocument()
  })

  it('displays bakery info card with name, tagline, and description', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Test Bakery')).toBeInTheDocument()
    expect(screen.getByText('Fresh baked goods')).toBeInTheDocument()
    expect(screen.getByText('A great bakery')).toBeInTheDocument()
  })

  it('displays bakery address and phone', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
    expect(screen.getByText(/\+256123456789/)).toBeInTheDocument()
  })

  it('displays all product categories', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Cakes')).toBeInTheDocument()
  })

  it('displays featured products with names and prices', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Sourdough')).toBeInTheDocument()
    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    expect(screen.getByText('UGX 500')).toBeInTheDocument() // 50000 / 100
    expect(screen.getByText('UGX 1,500')).toBeInTheDocument() // 150000 / 100
  })

  it('displays featured products grid with images', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    const images = screen.getAllByRole('img')
    const productImages = images.filter(
      (img) =>
        (img as HTMLImageElement).alt === 'Sourdough' ||
        (img as HTMLImageElement).alt === 'Chocolate Cake',
    )

    expect(productImages).toHaveLength(2)
  })

  it('displays browse menu button', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    const browseButton = screen.getByRole('link', { name: /browse menu/i })
    expect(browseButton).toBeInTheDocument()
    expect(browseButton).toHaveAttribute('href', '/b/test-bakery-slug/menu')
  })

  it('displays empty state when no products exist', () => {
    vi.mocked(bakeryApi.usePublicProducts).mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('No products yet')).toBeInTheDocument()
    expect(
      screen.getByText(/This bakery hasn't added any products yet/),
    ).toBeInTheDocument()
  })

  it('renders category links with correct href paths', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    const breadLink = screen.getByRole('link', { name: 'Bread' })
    const cakesLink = screen.getByRole('link', { name: 'Cakes' })

    expect(breadLink).toHaveAttribute(
      'href',
      '/b/test-bakery-slug/menu?category=bread',
    )
    expect(cakesLink).toHaveAttribute(
      'href',
      '/b/test-bakery-slug/menu?category=cakes',
    )
  })

  it('renders product view buttons with correct href paths', () => {
    render(
      <BrowserRouter>
        <BakeryPage />
      </BrowserRouter>,
    )

    const sourdoughButton = screen.getAllByRole('link', { name: 'View' })[0]
    expect(sourdoughButton).toHaveAttribute(
      'href',
      '/b/test-bakery-slug/products/sourdough',
    )
  })
})
