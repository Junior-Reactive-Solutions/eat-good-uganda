import type { Product, ProductCategory } from '@eatgood/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

// Input types for mutations
export type CreateProductInput = {
  name: string
  description?: string | null
  base_price_minor: number
  category_id?: string | null
  image_urls?: string[]
  is_published?: boolean
  is_available?: boolean
  requires_advance_notice_hours?: number | null
  sort_order?: number
  tags?: string[]
}

export type UpdateProductInput = Partial<CreateProductInput>

export type CreateCategoryInput = {
  name: string
  slug?: string
  sort_order?: number
}

// Response types
export type PaginatedProducts = {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginatedCategories = {
  items: ProductCategory[]
  total: number
}

// Query keys
export const menuQueryKeys = {
  all: ['menu'] as const,
  products: ['menu', 'products'] as const,
  productsList: (page: number, pageSize: number) =>
    ['menu', 'products', 'list', page, pageSize] as const,
  productDetail: (id: string) => ['menu', 'products', 'detail', id] as const,
  categories: ['menu', 'categories'] as const,
}

// Queries
export function useProducts(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: menuQueryKeys.productsList(page, pageSize),
    queryFn: async () => {
      const { data } = await api.get<PaginatedProducts>('/v1/bakery/products', {
        params: { page, pageSize },
      })
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: menuQueryKeys.productDetail(productId),
    queryFn: async () => {
      const { data } = await api.get<Product>(`/v1/bakery/products/${productId}`)
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!productId,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: menuQueryKeys.categories,
    queryFn: async () => {
      const { data } = await api.get<PaginatedCategories>('/v1/bakery/categories')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

// Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const { data } = await api.post<Product>('/v1/bakery/products', input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuQueryKeys.products })
    },
  })
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const { data } = await api.patch<Product>(`/v1/bakery/products/${productId}`, input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: menuQueryKeys.productDetail(productId),
      })
      void queryClient.invalidateQueries({ queryKey: menuQueryKeys.products })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/v1/bakery/products/${productId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuQueryKeys.products })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data } = await api.post<ProductCategory>('/v1/bakery/categories', input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuQueryKeys.categories })
    },
  })
}
