import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { LoadingSpinner } from './components/LoadingSpinner'
import { BakeryProvider } from './contexts/bakery'
import { useMe } from './features/auth/hooks'
import { RequireAuth } from './features/auth/RequireAuth'
import { DashboardLayout } from './layouts/DashboardLayout'
import { ProductFormPage } from './pages/ProductFormPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const MenuPage = lazy(() => import('./pages/MenuPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

// Dashboard wrapper that provides BakeryProvider
function DashboardWithProvider() {
  const { data: me } = useMe()

  if (!me) {
    return <LoadingSpinner />
  }

  return (
    <BakeryProvider me={me}>
      <DashboardLayout />
    </BakeryProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <DashboardWithProvider />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      {
        path: 'orders',
        element: (
          <Lazy>
            <OrdersPage />
          </Lazy>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <Lazy>
            <OrderDetailPage />
          </Lazy>
        ),
      },
      {
        path: 'menu',
        element: (
          <Lazy>
            <MenuPage />
          </Lazy>
        ),
      },
      {
        path: 'menu/create',
        element: (
          <Lazy>
            <ProductFormPage />
          </Lazy>
        ),
      },
      {
        path: 'menu/:productId/edit',
        element: (
          <Lazy>
            <ProductFormPage />
          </Lazy>
        ),
      },
    ],
  },
])
