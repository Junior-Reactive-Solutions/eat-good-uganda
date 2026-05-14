import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoadingSpinner } from './components/LoadingSpinner'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAdminAuth } from './middleware/requireAdminAuth'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
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
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <AdminDashboardPage />
          </Lazy>
        ),
      },
    ],
  },
])
