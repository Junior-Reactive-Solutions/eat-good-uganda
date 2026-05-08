import type { Product } from '@eatgood/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductCard } from './ProductCard'

// Sample product for testing
const mockProduct: Product = {
  id: 'prod-1',
  bakery_id: 'bakery-1',
  category_id: 'cat-1',
  slug: 'chocolate-cake',
  name: 'Chocolate Cake',
  description: 'Delicious chocolate cake',
  base_price_minor: 50000, // 500 UGX
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
}

const mockProductUnpublished: Product = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Vanilla Cake',
  is_published: false,
}

const mockProductUnavailable: Product = {
  ...mockProduct,
  id: 'prod-3',
  name: 'Strawberry Cake',
  is_available: false,
}

const mockProductNoImage: Product = {
  ...mockProduct,
  id: 'prod-4',
  name: 'Carrot Cake',
  image_urls: [],
}

const mockProductUncategorized: Product = {
  ...mockProduct,
  id: 'prod-5',
  name: 'Vanilla Cupcakes',
  category_id: null,
}

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ProductCard', () => {
  const mockOnDelete = vi.fn()
  const mockOnTogglePublish = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders product name', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
  })

  it('renders formatted price in UGX currency', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    // 50000 minor units = 500 UGX
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  it('displays published status badge when product is published', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByLabelText('Published')).toBeInTheDocument()
  })

  it('displays draft status badge when product is unpublished', () => {
    renderWithRouter(
      <ProductCard
        product={mockProductUnpublished}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByLabelText('Draft')).toBeInTheDocument()
  })

  it('displays availability status when available', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('displays unavailable status when not available', () => {
    renderWithRouter(
      <ProductCard
        product={mockProductUnavailable}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('displays category name when provided', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
        categoryName="Cakes"
      />,
    )

    expect(screen.getByText(/Category: Cakes/)).toBeInTheDocument()
  })

  it('displays "Uncategorized" when category_id is null and no categoryName provided', () => {
    renderWithRouter(
      <ProductCard
        product={mockProductUncategorized}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  it('renders product image when image_urls is not empty', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const img = screen.getByAltText('Chocolate Cake')
    expect(img).toBeInTheDocument()
    expect((img as HTMLImageElement).src).toBe('https://example.com/cake.jpg')
  })

  it('renders fallback icon when no image_urls', () => {
    const { container } = renderWithRouter(
      <ProductCard
        product={mockProductNoImage}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    // Check for the Utensils icon SVG (lucide-react renders as SVG with specific class)
    const utensilsIcon = container.querySelector('.lucide-utensils')
    expect(utensilsIcon).toBeInTheDocument()
  })

  it('renders edit button with link to edit page', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const editLink = screen.getByRole('link', { name: /Edit/i })
    expect(editLink).toBeInTheDocument()
    expect(editLink).toHaveAttribute('href', '/menu/edit/prod-1')
  })

  it('renders publish/unpublish toggle button', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const toggleBtn = screen.getByRole('button', { name: /Unpublish Chocolate Cake/i })
    expect(toggleBtn).toBeInTheDocument()
  })

  it('calls onTogglePublish with correct args when toggle button clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const toggleBtn = screen.getByRole('button', { name: /Unpublish Chocolate Cake/i })
    await user.click(toggleBtn)

    expect(mockOnTogglePublish).toHaveBeenCalledWith('prod-1', false)
  })

  it('toggles publish state correctly for unpublished product', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <ProductCard
        product={mockProductUnpublished}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const toggleBtn = screen.getByRole('button', { name: /Publish Vanilla Cake/i })
    await user.click(toggleBtn)

    expect(mockOnTogglePublish).toHaveBeenCalledWith('prod-2', true)
  })

  it('renders delete button', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const deleteBtn = screen.getByRole('button', { name: /Delete Chocolate Cake/i })
    expect(deleteBtn).toBeInTheDocument()
  })

  it('shows confirmation dialog before calling onDelete', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => true)
    window.confirm = mockConfirm

    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const deleteBtn = screen.getByRole('button', { name: /Delete Chocolate Cake/i })
    await user.click(deleteBtn)

    expect(mockConfirm).toHaveBeenCalledWith('Delete "Chocolate Cake"? This cannot be undone.')
    expect(mockOnDelete).toHaveBeenCalledWith('prod-1')
  })

  it('does not call onDelete when user cancels confirmation', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    window.confirm = mockConfirm

    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const deleteBtn = screen.getByRole('button', { name: /Delete Chocolate Cake/i })
    await user.click(deleteBtn)

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('displays correct green colors for published status', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const publishedBadge = screen.getByLabelText('Published')
    expect(publishedBadge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('displays correct gray colors for draft status', () => {
    renderWithRouter(
      <ProductCard
        product={mockProductUnpublished}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const draftBadge = screen.getByLabelText('Draft')
    expect(draftBadge).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('has proper flex layout for full height distribution', () => {
    const { container } = renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const card = container.querySelector('.h-full.flex.flex-col')
    expect(card).toBeInTheDocument()
  })

  it('shows Eye icon when product is unpublished', () => {
    const { container } = renderWithRouter(
      <ProductCard
        product={mockProductUnpublished}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    // Check for Eye icon SVG (unpublished state)
    const eyeIcon = container.querySelector('.lucide-eye')
    expect(eyeIcon).toBeInTheDocument()
  })

  it('shows EyeOff icon when product is published', () => {
    const { container } = renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    // Check for EyeOff icon SVG (published state)
    const eyeOffIcon = container.querySelector('.lucide-eye-off')
    expect(eyeOffIcon).toBeInTheDocument()
  })

  it('renders all three action buttons', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    const editLink = screen.getByRole('link')
    const allButtons = screen.getAllByRole('button')
    // There should be 3 buttons: edit (inside link), publish toggle, and delete
    expect(editLink).toBeInTheDocument()
    expect(allButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('handles different product names with special characters', () => {
    const productWithSpecialName: Product = {
      ...mockProduct,
      id: 'prod-6',
      name: 'Coffee & Cream Cake',
    }

    renderWithRouter(
      <ProductCard
        product={productWithSpecialName}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText('Coffee & Cream Cake')).toBeInTheDocument()
  })

  it('correctly formats large prices', () => {
    const expensiveProduct: Product = {
      ...mockProduct,
      id: 'prod-7',
      base_price_minor: 5000000, // 50,000 UGX
    }

    renderWithRouter(
      <ProductCard
        product={expensiveProduct}
        onDelete={mockOnDelete}
        onTogglePublish={mockOnTogglePublish}
      />,
    )

    expect(screen.getByText(/50,000/)).toBeInTheDocument()
  })
})
