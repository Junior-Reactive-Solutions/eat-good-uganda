import type { Bakery, ProductCategory, Product } from '@eatgood/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

export type PublicBakery = {
  id: string
  slug: string
  display_name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  primary_color: string
  accent_color: string | null
  address_line1: string
  address_line2: string | null
  city: string
  accepts_pickup: boolean
  accepts_delivery: boolean
  delivery_radius_km: number | null
  distance_km: number | null
}

export type ProductDetail = Product & {
  variants: Array<{
    id: string
    name: string
    price_minor: number
    sku: string
    sort_order: number
    is_available: boolean
  }>
}

type Params = {
  lat?: number | undefined
  lng?: number | undefined
  search?: string | undefined
  page?: number | undefined
}

export function usePublicBakeries(params: Params = {}) {
  return useQuery({
    queryKey: ['public-bakeries', params],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.lat !== undefined) qs.set('lat', String(params.lat))
      if (params.lng !== undefined) qs.set('lng', String(params.lng))
      if (params.search) qs.set('search', params.search)
      if (params.page !== undefined) qs.set('page', String(params.page))
      const { data } = await api.get<{ bakeries: PublicBakery[] }>(
        `/v1/public/bakeries?${qs.toString()}`,
      )
      return data.bakeries
    },
    staleTime: 30_000,
  })
}

export const usePublicBakery = (slug: string) => {
  return useQuery({
    queryKey: ['public-bakery', slug],
    queryFn: async () => {
      const { data } = await api.get<{ bakery: Bakery }>(`/v1/public/bakeries/${slug}`)
      return data.bakery
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const usePublicCategories = (slug: string) => {
  return useQuery({
    queryKey: ['public-categories', slug],
    queryFn: async () => {
      const { data } = await api.get<{ categories: ProductCategory[] }>(
        `/v1/public/bakeries/${slug}/categories`,
      )
      return data.categories
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export type ListProductsParams = {
  category?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export const usePublicProducts = (slug: string, params: ListProductsParams = {}) => {
  const { category, page = 1, pageSize = 20 } = params
  return useQuery({
    queryKey: ['public-products', slug, category, page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        products: Product[]
        total: number
        page: number
        pageSize: number
      }>(`/v1/public/bakeries/${slug}/products`, {
        params: {
          category,
          page,
          page_size: pageSize,
        },
      })
      return {
        products: data.products,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const usePublicProduct = (slug: string, productSlug: string) => {
  return useQuery({
    queryKey: ['public-product', slug, productSlug],
    queryFn: async () => {
      const { data } = await api.get<{ product: ProductDetail }>(
        `/v1/public/bakeries/${slug}/products/${productSlug}`,
      )
      return data.product
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
