import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CartSwitchDialog } from './CartSwitchDialog'

describe('CartSwitchDialog', () => {
  it('does not display when not open', () => {
    const { container } = render(
      <CartSwitchDialog
        isOpen={false}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    const dialog = container.querySelector('[role="dialog"]')
    if (dialog) {
      expect(dialog).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('displays dialog when open', () => {
    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('displays new bakery name in warning text', () => {
    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="Delicious Bakery"
        currentBakeryName="Another Bakery"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText(/Delicious Bakery/)).toBeInTheDocument()
  })

  it('displays current bakery name in warning text', () => {
    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="My Favorite Bakery"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText(/My Favorite Bakery/)).toBeInTheDocument()
  })

  it('has cancel button that closes dialog', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has confirm button that calls onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={onConfirm}
      />,
    )

    const confirmButton = screen.getByRole('button', {
      name: /clear and continue/i,
    })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalled()
  })

  it('closes dialog after confirmation', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    const confirmButton = screen.getByRole('button', {
      name: /clear and continue/i,
    })
    await user.click(confirmButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays warning about clearing cart', () => {
    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/You can only order from one bakery/i),
    ).toBeInTheDocument()
  })

  it('displays two action buttons', () => {
    render(
      <CartSwitchDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        newBakeryName="New Bakery"
        currentBakeryName="Current Bakery"
        onConfirm={vi.fn()}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })
})
