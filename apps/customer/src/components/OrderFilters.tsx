import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'

interface OrderFiltersProps {
  onFiltersChange: (filters: Record<string, string | undefined>) => void
  isLoading?: boolean
}

export function OrderFilters({ onFiltersChange, isLoading = false }: OrderFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onFiltersChange({
      search: value || undefined,
    })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setStatusFilter(value)
    onFiltersChange({
      status: value || undefined,
    })
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateFromFilter(value)
    onFiltersChange({
      dateFrom: value || undefined,
    })
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateToFilter(value)
    onFiltersChange({
      dateTo: value || undefined,
    })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    onFiltersChange({
      search: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <Input
          label="Order Number"
          placeholder="Search by order number..."
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={isLoading}
          type="text"
        />

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">Status</label>
          <select
            className="w-full rounded-md border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg disabled:opacity-50"
            onChange={handleStatusChange}
            value={statusFilter}
            disabled={isLoading}
          >
            <option value="">All statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">From Date</label>
          <input
            type="date"
            value={dateFromFilter}
            onChange={handleDateFromChange}
            disabled={isLoading}
            className="w-full rounded-md border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg disabled:opacity-50"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-platform-fg mb-1">To Date</label>
          <input
            type="date"
            value={dateToFilter}
            onChange={handleDateToChange}
            disabled={isLoading}
            className="w-full rounded-md border border-platform-border bg-platform-bg px-3 py-2 text-platform-fg disabled:opacity-50"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {(searchQuery || statusFilter || dateFromFilter || dateToFilter) && (
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={handleClearFilters}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
