import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { usePublicBakery } from './api'

type Props = { children: React.ReactNode }

export function BakeryThemeProvider({ children }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const { data: bakery } = usePublicBakery(slug ?? '')

  useEffect(() => {
    const root = document.documentElement
    if (bakery?.primary_color) {
      root.style.setProperty('--bakery-primary', bakery.primary_color)
      root.style.setProperty('--bakery-primary-foreground', '#ffffff')
      if (bakery.accent_color) {
        root.style.setProperty('--bakery-accent', bakery.accent_color)
      }
    }
    return () => {
      root.style.removeProperty('--bakery-primary')
      root.style.removeProperty('--bakery-primary-foreground')
      root.style.removeProperty('--bakery-accent')
    }
  }, [bakery])

  return <>{children}</>
}
