import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { MetricCard } from '../MetricCard'

describe('MetricCard', () => {
  it('should render title and value correctly', () => {
    render(
      <MetricCard
        title="Total Orders"
        value={1234}
      />
    )

    expect(screen.getByText('Total Orders')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('should format numbers with commas', () => {
    render(
      <MetricCard
        title="Revenue"
        value={1000000}
      />
    )

    expect(screen.getByText('1,000,000')).toBeInTheDocument()
  })

  it('should format currency values correctly (cents to dollars)', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value={125000000}
        isCurrency={true}
      />
    )

    expect(screen.getByText('$1,250,000')).toBeInTheDocument()
  })

  it('should show loading skeleton when loading=true', () => {
    const { container } = render(
      <MetricCard
        title="Loading Metric"
        value={0}
        loading={true}
      />
    )

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should show error message when error is provided', () => {
    render(
      <MetricCard
        title="Metric"
        value={0}
        error="Failed to load data"
      />
    )

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('should display change indicator with up arrow for positive trend', () => {
    const { container } = render(
      <MetricCard
        title="Orders"
        value={5840}
        trend={{
          direction: 'up',
          percentage: 12.5,
          period: 'vs last month',
        }}
      />
    )

    expect(screen.getByText('12.5%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
    // Check for up arrow SVG
    const upArrow = container.querySelector('svg')
    expect(upArrow).toBeInTheDocument()
  })

  it('should display change indicator with down arrow for negative trend', () => {
    render(
      <MetricCard
        title="Errors"
        value={240}
        trend={{
          direction: 'down',
          percentage: 8.3,
        }}
      />
    )

    expect(screen.getByText('8.3%')).toBeInTheDocument()
  })

  it('should handle missing trend gracefully', () => {
    render(
      <MetricCard
        title="Metric"
        value={100}
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.queryByText(/\d+\.?\d*%/)).not.toBeInTheDocument()
  })

  it('should trigger click handler on click', async () => {
    const handleClick = vi.fn()
    render(
      <MetricCard
        title="Clickable Metric"
        value={100}
        onClick={handleClick}
      />
    )

    const card = screen.getByRole('button')
    await userEvent.click(card)

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should trigger click handler on Enter key press', async () => {
    const handleClick = vi.fn()
    render(
      <MetricCard
        title="Keyboard Metric"
        value={100}
        onClick={handleClick}
      />
    )

    const card = screen.getByRole('button')
    await userEvent.keyboard('{Enter}')
    card.focus()
    await userEvent.keyboard('{Enter}')

    expect(handleClick).toHaveBeenCalled()
  })

  it('should have accessible aria-label', () => {
    const { container } = render(
      <MetricCard
        title="Total Orders"
        value={5840}
      />
    )

    const card = container.querySelector('div[aria-label]')
    expect(card).toHaveAttribute('aria-label', 'Total Orders: 5,840')
  })

  it('should handle string values directly', () => {
    render(
      <MetricCard
        title="Status"
        value="Active"
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should display prefix and suffix', () => {
    render(
      <MetricCard
        title="Price"
        value={99}
        prefix="UGX"
        suffix="/month"
      />
    )

    expect(screen.getByText('UGX')).toBeInTheDocument()
    expect(screen.getByText('/month')).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    render(
      <MetricCard
        title="Orders"
        value={100}
        icon={<span data-testid="test-icon">📦</span>}
      />
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MetricCard
        title="Metric"
        value={100}
        className="custom-class"
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('should support vertical layout (default)', () => {
    const { container } = render(
      <MetricCard
        title="Metric"
        value={100}
        layout="vertical"
      />
    )

    const flexDiv = container.querySelector('.flex-col')
    expect(flexDiv).toBeInTheDocument()
  })

  it('should support horizontal layout', () => {
    const { container } = render(
      <MetricCard
        title="Metric"
        value={100}
        layout="horizontal"
      />
    )

    const flexDiv = container.querySelector('.flex-row')
    expect(flexDiv).toBeInTheDocument()
  })

  it('should handle large numbers with commas', () => {
    render(
      <MetricCard
        title="Total"
        value={9999999}
      />
    )

    expect(screen.getByText('9,999,999')).toBeInTheDocument()
  })

  it('should handle zero value', () => {
    render(
      <MetricCard
        title="Count"
        value={0}
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should not show trend when loading', () => {
    render(
      <MetricCard
        title="Metric"
        value={100}
        loading={true}
        trend={{
          direction: 'up',
          percentage: 10,
        }}
      />
    )

    expect(screen.queryByText('10%')).not.toBeInTheDocument()
  })

  it('should not show trend when error is present', () => {
    render(
      <MetricCard
        title="Metric"
        value={100}
        error="Failed"
        trend={{
          direction: 'up',
          percentage: 10,
        }}
      />
    )

    expect(screen.queryByText('10%')).not.toBeInTheDocument()
  })

  it('should format currency with no decimal places', () => {
    render(
      <MetricCard
        title="Amount"
        value={50050}
        isCurrency={true}
      />
    )

    expect(screen.getByText('$501')).toBeInTheDocument()
  })

  it('should be keyboard accessible for button role', () => {
    const handleClick = vi.fn()
    render(
      <MetricCard
        title="Button Metric"
        value={100}
        onClick={handleClick}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('tabIndex', '0')
  })

  it('should not be a button when no onClick provided', () => {
    render(
      <MetricCard
        title="Static Metric"
        value={100}
      />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
