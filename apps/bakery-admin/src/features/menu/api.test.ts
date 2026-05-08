import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { api } from '../../lib/api'

import {
  useProducts,
  useProductDetail,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
} from './api'

// Mock the api module
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockProduct = {
  id: 'prod-123',
  bakery_id: 'bakery-456',
  category_id: 'cat-789',
  slug: 'chocolate-cake',
  name: 'Chocolate Cake',
  description: 'Delicious chocolate cake',
  base_price_minor: 25000,
  currency_code: 'UGX',
  image_urls: ['https://example.com/cake.jpg'],
  is_published: true,
  is_available: true,
  requires_advance_notice_hours: null,
  sort_order: 1,
  tags: ['dessert', 'chocolate'],
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  deleted_at: null,
}

const mockCategory = {
  id: 'cat-789',
  bakery_id: 'bakery-456',
  name: 'Cakes',
  slug: 'cakes',
  sort_order: 1,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
}

describe('Menu API Hooks', () => {
  let queryClient: QueryClient
  let mockApiGet: ReturnType<typeof vi.fn>
  let mockApiPost: ReturnType<typeof vi.fn>
  let mockApiPatch: ReturnType<typeof vi.fn>
  let mockApiDelete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockApiGet = vi.mocked(api.get) as ReturnType<typeof vi.fn>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockApiPost = vi.mocked(api.post) as ReturnType<typeof vi.fn>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockApiPatch = vi.mocked(api.patch) as ReturnType<typeof vi.fn>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockApiDelete = vi.mocked(api.delete) as ReturnType<typeof vi.fn>
    const clearMocks = (): void => {
      mockApiGet.mockClear()
      mockApiPost.mockClear()
      mockApiPatch.mockClear()
      mockApiDelete.mockClear()
    }
    clearMocks()
  })

  describe('useProducts', () => {
    it('should load products with pagination', async () => {
      const mockData = {
        items: [mockProduct],
        total: 50,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      }

      mockApiGet.mockResolvedValue({ data: mockData })

      const { result } = renderHook(() => useProducts(1, 20), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockData)
      expect(mockApiGet).toHaveBeenCalledWith('/v1/bakery/products', {
        params: { page: 1, pageSize: 20 },
      })
    })

    it('should handle loading state', async () => {
      mockApiGet.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: {
                  items: [],
                  total: 0,
                  page: 1,
                  pageSize: 20,
                  totalPages: 0,
                },
              })
            }, 100)
          }),
      )

      const { result } = renderHook(() => useProducts(1, 20), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })

    it('should handle error state', async () => {
      const error = new Error('Network error')
      mockApiGet.mockRejectedValue(error)

      const { result } = renderHook(() => useProducts(1, 20), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should respect pagination parameters', async () => {
      const mockData = {
        items: [mockProduct],
        total: 50,
        page: 2,
        pageSize: 10,
        totalPages: 5,
      }

      mockApiGet.mockResolvedValue({ data: mockData })

      renderHook(() => useProducts(2, 10), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith('/v1/bakery/products', {
          params: { page: 2, pageSize: 10 },
        })
      })
    })
  })

  describe('useProductDetail', () => {
    it('should load product detail', async () => {
      mockApiGet.mockResolvedValue({ data: mockProduct })

      const { result } = renderHook(() => useProductDetail('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockProduct)
      expect(mockApiGet).toHaveBeenCalledWith('/v1/bakery/products/prod-123')
    })

    it('should be disabled when productId is empty', () => {
      const { result } = renderHook(() => useProductDetail(''), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(false)
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('should handle loading state for product detail', async () => {
      mockApiGet.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: mockProduct })
            }, 100)
          }),
      )

      const { result } = renderHook(() => useProductDetail('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })

    it('should handle error state for product detail', async () => {
      const error = new Error('Product not found')
      mockApiGet.mockRejectedValue(error)

      const { result } = renderHook(() => useProductDetail('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })
  })

  describe('useCategories', () => {
    it('should load categories', async () => {
      const mockData = {
        items: [mockCategory],
        total: 1,
      }

      mockApiGet.mockResolvedValue({ data: mockData })

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockData)
      expect(mockApiGet).toHaveBeenCalledWith('/v1/bakery/categories')
    })

    it('should handle loading state for categories', async () => {
      mockApiGet.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: {
                  items: [],
                  total: 0,
                },
              })
            }, 100)
          }),
      )

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })

    it('should handle error state for categories', async () => {
      const error = new Error('Failed to load categories')
      mockApiGet.mockRejectedValue(error)

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })
  })

  describe('useCreateProduct', () => {
    it('should create a product successfully', async () => {
      mockApiPost.mockResolvedValue({ data: mockProduct })

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Chocolate Cake',
        description: 'Delicious chocolate cake',
        base_price_minor: 25000,
        category_id: 'cat-789',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockProduct)
      expect(mockApiPost).toHaveBeenCalledWith('/v1/bakery/products', input)
    })

    it('should handle mutation error', async () => {
      const error = new Error('Validation error')
      mockApiPost.mockRejectedValue(error)

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: '',
        description: 'Delicious chocolate cake',
        base_price_minor: 25000,
        category_id: 'cat-789',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should invalidate products query on success', async () => {
      mockApiPost.mockResolvedValue({ data: mockProduct })

      // Pre-populate the cache with products
      await queryClient.prefetchQuery({
        queryKey: ['menu', 'products', 'list', 1, 20],
        queryFn: () =>
          Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
          }),
      })

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Chocolate Cake',
        description: 'Delicious chocolate cake',
        base_price_minor: 25000,
        category_id: 'cat-789',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that the products query was invalidated
      expect(queryClient.getQueryState(['menu', 'products', 'list', 1, 20])?.isInvalidated).toBe(
        true,
      )
    })
  })

  describe('useUpdateProduct', () => {
    it('should update a product successfully', async () => {
      mockApiPatch.mockResolvedValue({ data: mockProduct })

      const { result } = renderHook(() => useUpdateProduct('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Updated Cake',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockProduct)
      expect(mockApiPatch).toHaveBeenCalledWith('/v1/bakery/products/prod-123', input)
    })

    it('should handle update error', async () => {
      const error = new Error('Update failed')
      mockApiPatch.mockRejectedValue(error)

      const { result } = renderHook(() => useUpdateProduct('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Updated Cake',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should invalidate product detail and list queries on success', async () => {
      mockApiPatch.mockResolvedValue({ data: mockProduct })

      // Pre-populate the cache with product detail
      await queryClient.prefetchQuery({
        queryKey: ['menu', 'products', 'detail', 'prod-123'],
        queryFn: () => Promise.resolve(mockProduct),
      })

      await queryClient.prefetchQuery({
        queryKey: ['menu', 'products', 'list', 1, 20],
        queryFn: () =>
          Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
          }),
      })

      const { result } = renderHook(() => useUpdateProduct('prod-123'), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Updated Cake',
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that both queries were invalidated
      expect(
        queryClient.getQueryState(['menu', 'products', 'detail', 'prod-123'])?.isInvalidated,
      ).toBe(true)
      expect(queryClient.getQueryState(['menu', 'products', 'list', 1, 20])?.isInvalidated).toBe(
        true,
      )
    })
  })

  describe('useDeleteProduct', () => {
    it('should delete a product successfully', async () => {
      mockApiDelete.mockResolvedValue({})

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate('prod-123')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockApiDelete).toHaveBeenCalledWith('/v1/bakery/products/prod-123')
    })

    it('should handle delete error', async () => {
      const error = new Error('Delete failed')
      mockApiDelete.mockRejectedValue(error)

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate('prod-123')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should invalidate products query on success', async () => {
      mockApiDelete.mockResolvedValue({})

      // Pre-populate the cache with products
      await queryClient.prefetchQuery({
        queryKey: ['menu', 'products', 'list', 1, 20],
        queryFn: () =>
          Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
          }),
      })

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate('prod-123')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that the products query was invalidated
      expect(queryClient.getQueryState(['menu', 'products', 'list', 1, 20])?.isInvalidated).toBe(
        true,
      )
    })
  })

  describe('useCreateCategory', () => {
    it('should create a category successfully', async () => {
      mockApiPost.mockResolvedValue({ data: mockCategory })

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Cakes',
        slug: 'cakes',
        sort_order: 1,
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCategory)
      expect(mockApiPost).toHaveBeenCalledWith('/v1/bakery/categories', input)
    })

    it('should handle category creation error', async () => {
      const error = new Error('Category creation failed')
      mockApiPost.mockRejectedValue(error)

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Cakes',
        slug: 'cakes',
        sort_order: 1,
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should invalidate categories query on success', async () => {
      mockApiPost.mockResolvedValue({ data: mockCategory })

      // Pre-populate the cache with categories
      await queryClient.prefetchQuery({
        queryKey: ['menu', 'categories'],
        queryFn: () =>
          Promise.resolve({
            items: [],
            total: 0,
          }),
      })

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(queryClient),
      })

      const input = {
        name: 'Cakes',
        slug: 'cakes',
        sort_order: 1,
      }

      result.current.mutate(input)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that the categories query was invalidated
      expect(queryClient.getQueryState(['menu', 'categories'])?.isInvalidated).toBe(true)
    })
  })
})
