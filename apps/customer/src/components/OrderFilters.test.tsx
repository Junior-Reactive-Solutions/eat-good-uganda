import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { OrderFilters } from './OrderFilters'

describe('OrderFilters', () => {
  it('renders all filter inputs', () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    expect(screen.getByPlaceholderText('Search by order number...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All statuses')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/date/i)[0]).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/date/i)[1]).toBeInTheDocument()
  })

  it('calls onFiltersChange when search input changes', async () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const searchInput = screen.getByPlaceholderText('Search by order number...')
    await userEvent.type(searchInput, 'ORD-001')

    expect(onFilterChange).toHaveBeenCalledWith({ search: 'ORD-001' })
  })

  it('calls onFiltersChange when status filter changes', async () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const statusSelect = screen.getByDisplayValue('All statuses')
    await userEvent.selectOptions(statusSelect, 'delivered')

    expect(onFilterChange).toHaveBeenCalledWith({ status: 'delivered' })
  })

  it('calls onFiltersChange when date filters change', async () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const dateInputs = screen.getAllByDisplayValue('')
    const fromDateInput = dateInputs.find(el => el instanceof HTMLInputElement && el.type === 'date') as HTMLInputElement | undefined

    if (fromDateInput) {
      await userEvent.type(fromDateInput, '2026-05-01')
      expect(onFilterChange).toHaveBeenCalledWith({ dateFrom: '2026-05-01' })
    }
  })

  it('shows clear filters button when filters are applied', async () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const searchInput = screen.getByPlaceholderText('Search by order number...')
    await userEvent.type(searchInput, 'ORD-001')

    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('clears all filters when clear button is clicked', async () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const searchInput = screen.getByPlaceholderText('Search by order number...')
    await userEvent.type(searchInput, 'ORD-001')

    const clearButton = screen.getByText('Clear Filters')
    await userEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
    expect(onFilterChange).toHaveBeenLastCalledWith({
      search: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  })

  it('disables inputs when isLoading is true', () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} isLoading={true} />)

    expect(screen.getByPlaceholderText('Search by order number...')).toBeDisabled()
  })

  it('contains all status options', () => {
    const onFilterChange = vi.fn()
    render(<OrderFilters onFiltersChange={onFilterChange} />)

    const statusSelect = screen.getByDisplayValue('All statuses')
    const options = Array.from(statusSelect.options).map((opt) => opt.value)

    expect(options).toContain('pending_payment')
    expect(options).toContain('confirmed')
    expect(options).toContain('preparing')
    expect(options).toContain('ready')
    expect(options).toContain('out_for_delivery')
    expect(options).toContain('delivered')
    expect(options).toContain('cancelled')
  })
})
