import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

type BakeryTheme = {
  primary_color: string
  accent_color: string | null
}

function useBakeryTheme(slug: string | undefined) {
  return useQuery<BakeryTheme | null>({
    queryKey: ['bakery', slug, 'theme'],
    queryFn: async () => {
      if (!slug) return null
      const res = await api.get<BakeryTheme>(`/v1/public/bakeries/${slug}/theme`)
      return res.data
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  })
}

type Props = { children: React.ReactNode }

export function BakeryThemeProvider({ children }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const { data: theme } = useBakeryTheme(slug)

  useEffect(() => {
    const root = document.documentElement
    if (theme?.primary_color) {
      root.style.setProperty('--bakery-primary', theme.primary_color)
      root.style.setProperty('--bakery-primary-foreground', '#ffffff')
      if (theme.accent_color) {
        root.style.setProperty('--bakery-accent', theme.accent_color)
      }
    }
    return () => {
      root.style.removeProperty('--bakery-primary')
      root.style.removeProperty('--bakery-primary-foreground')
      root.style.removeProperty('--bakery-accent')
    }
  }, [theme])

  return <>{children}</>
}
