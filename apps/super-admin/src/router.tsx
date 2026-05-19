import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoadingSpinner } from './components/LoadingSpinner'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAdminAuth } from './middleware/requireAdminAuth'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const BakeriesPage = lazy(() => import('./pages/BakeriesPage'))
const BakeryDetailPage = lazy(() => import('./pages/BakeryDetailPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))
const BakeryStaffPage = lazy(() => import('./pages/BakeryStaffPage'))
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const DataExportPage = lazy(() => import('./pages/DataExportPage'))

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
      {
        path: 'bakeries',
        element: (
          <Lazy>
            <BakeriesPage />
          </Lazy>
        ),
      },
      {
        path: 'bakeries/:bakeryId',
        element: (
          <Lazy>
            <BakeryDetailPage />
          </Lazy>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <Lazy>
            <AuditLogsPage />
          </Lazy>
        ),
      },
      {
        path: 'staff',
        element: (
          <Lazy>
            <BakeryStaffPage />
          </Lazy>
        ),
      },
      {
        path: 'users',
        element: (
          <Lazy>
            <UserManagementPage />
          </Lazy>
        ),
      },
      {
        path: 'support',
        element: (
          <Lazy>
            <SupportPage />
          </Lazy>
        ),
      },
      {
        path: 'exports',
        element: (
          <Lazy>
            <DataExportPage />
          </Lazy>
        ),
      },
    ],
  },
])
