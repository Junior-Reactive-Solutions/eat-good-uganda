/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DataExportPage from '../DataExportPage'

import * as exportsApi from '@/features/exports/api'

// Mock the API module
vi.mock('@/features/exports/api')

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const mockExports: exportsApi.ExportRecord[] = [
  {
    id: 'export-1',
    resource: 'bakeries',
    createdAt: '2026-01-01T10:00:00Z',
    rowCount: 50,
    status: 'completed',
  },
  {
    id: 'export-2',
    resource: 'customers',
    createdAt: '2026-01-02T11:00:00Z',
    rowCount: 150,
    status: 'completed',
  },
]

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(<QueryClientProvider client={mockQueryClient}>{component}</QueryClientProvider>)
}

const defaultMocks = {
  useExports: {
    data: { exports: [], pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 } },
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isPending: false,
    status: 'success' as const,
  },
  useTriggerExport: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
}

describe('DataExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(exportsApi.useExports).mockReturnValue(defaultMocks.useExports as any)
    vi.mocked(exportsApi.useTriggerExport).mockReturnValue(defaultMocks.useTriggerExport as any)
    vi.mocked(exportsApi.downloadExport).mockImplementation(() => {})
  })

  it('renders the page title and description', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Data Exports')).toBeInTheDocument()
    expect(screen.getByText(/Export platform data in CSV format/i)).toBeInTheDocument()
  })

  it('renders export form with resource selector', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Create New Export')).toBeInTheDocument()
    expect(screen.getByLabelText('Resource')).toBeInTheDocument()
  })

  it('renders format selector showing CSV only', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('CSV (default)')).toBeInTheDocument()
  })

  it('renders optional date range fields', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('End Date')).toBeInTheDocument()
  })

  it('renders generate export button', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Generate Export')).toBeInTheDocument()
  })

  it('allows changing resource type', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<DataExportPage />)

    const resourceSelect = screen.getByLabelText('Resource')
    await user.selectOptions(resourceSelect, 'customers')

    expect(resourceSelect).toHaveValue('customers')
  })

  it('renders recent exports section', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Recent Exports')).toBeInTheDocument()
  })

  it('displays export records in table', () => {
    vi.mocked(exportsApi.useExports).mockReturnValue({
      data: {
        exports: mockExports,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Bakeries')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
  })

  it('shows row counts for exports', () => {
    vi.mocked(exportsApi.useExports).mockReturnValue({
      data: {
        exports: mockExports,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('shows download buttons for each export', () => {
    vi.mocked(exportsApi.useExports).mockReturnValue({
      data: {
        exports: mockExports,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<DataExportPage />)

    const downloadButtons = screen.getAllByLabelText(/download/i)
    expect(downloadButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows empty state when no exports exist', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('No exports found. Create one to get started.')).toBeInTheDocument()
  })

  it('shows status badges for exports', () => {
    vi.mocked(exportsApi.useExports).mockReturnValue({
      data: {
        exports: mockExports,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<DataExportPage />)

    const completedBadges = screen.getAllByText('Completed')
    expect(completedBadges.length).toBeGreaterThan(0)
  })

  it('displays pagination info when multiple pages exist', () => {
    vi.mocked(exportsApi.useExports).mockReturnValue({
      data: {
        exports: mockExports,
        pagination: { page: 1, pageSize: 20, totalCount: 40, totalPages: 2 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })

  it('renders date range section in form', () => {
    renderWithQueryClient(<DataExportPage />)

    expect(screen.getByText('Date Range (Optional)')).toBeInTheDocument()
  })
})
