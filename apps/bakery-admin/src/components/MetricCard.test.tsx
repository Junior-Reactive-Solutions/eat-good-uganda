import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IconPaymentBank } from '../components/icons'

import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Sales" value="500,000 UGX" />)

    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('500,000 UGX')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<MetricCard label="Total Sales" value="500,000 UGX" subtitle="Current month" />)

    expect(screen.getByText('Current month')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        icon={<IconPaymentBank size="md" color="default" alt="" />}
      />,
    )

    // Icon should render as SVG element
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('renders trend indicator with up direction', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        trend={{ direction: 'up', percentage: 12 }}
      />,
    )

    expect(screen.getByText(/12%/)).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('renders trend indicator with down direction', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        trend={{ direction: 'down', percentage: 5 }}
      />,
    )

    expect(screen.getByText(/5%/)).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('applies up trend styling (green)', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        trend={{ direction: 'up', percentage: 12 }}
      />,
    )

    const trendText = screen.getByText(/↑/)
    expect(trendText).toHaveClass('text-green-600')
  })

  it('applies down trend styling (red)', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        trend={{ direction: 'down', percentage: 5 }}
      />,
    )

    const trendText = screen.getByText(/↓/)
    expect(trendText).toHaveClass('text-red-600')
  })

  it('renders numeric value', () => {
    render(<MetricCard label="Total Orders" value={1234} />)

    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('has proper card styling classes', () => {
    render(<MetricCard label="Total Sales" value="500,000 UGX" />)

    const card = document.querySelector('.rounded-lg')
    expect(card).toHaveClass('border-platform-border')
    expect(card).toHaveClass('bg-platform-surface')
    expect(card).toHaveClass('p-6')
  })

  it('renders all elements together', () => {
    render(
      <MetricCard
        label="Total Sales"
        value="500,000 UGX"
        subtitle="Current month"
        icon={<IconPaymentBank size="md" color="default" alt="" />}
        trend={{ direction: 'up', percentage: 12 }}
      />,
    )

    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('500,000 UGX')).toBeInTheDocument()
    expect(screen.getByText('Current month')).toBeInTheDocument()
    expect(screen.getByText(/12%/)).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })
})
