import { Navigate, useLocation } from 'react-router-dom'

import { LoadingSpinner } from '../../components/LoadingSpinner'

import { useMe } from './hooks'

type Props = { children: React.ReactNode }

export function RequireAuth({ children }: Props) {
  const { data: me, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner />

  if (!me) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
