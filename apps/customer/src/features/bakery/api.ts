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
