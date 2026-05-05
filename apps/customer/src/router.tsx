import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { LoadingSpinner } from './components/LoadingSpinner'
import { RequireAuth } from './features/auth/RequireAuth'
import { AccountLayout } from './layouts/AccountLayout'
import { PublicLayout } from './layouts/PublicLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const BakeryPage = lazy(() => import('./pages/BakeryPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <HomePage />
          </Lazy>
        ),
      },
      {
        path: 'b/:slug',
        element: (
          <Lazy>
            <BakeryPage />
          </Lazy>
        ),
      },
      {
        path: 'b/:slug/products/:productSlug',
        element: (
          <Lazy>
            <ProductPage />
          </Lazy>
        ),
      },
      {
        path: 'b/:slug/checkout',
        element: (
          <Lazy>
            <CheckoutPage />
          </Lazy>
        ),
      },
      {
        path: 'login',
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: 'signup',
        element: (
          <Lazy>
            <SignupPage />
          </Lazy>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Lazy>
            <ForgotPasswordPage />
          </Lazy>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Lazy>
            <ResetPasswordPage />
          </Lazy>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <Lazy>
            <VerifyEmailPage />
          </Lazy>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Lazy>
            <PrivacyPage />
          </Lazy>
        ),
      },
      {
        path: 'terms',
        element: (
          <Lazy>
            <TermsPage />
          </Lazy>
        ),
      },
      {
        path: 'about',
        element: (
          <Lazy>
            <AboutPage />
          </Lazy>
        ),
      },
      {
        path: 'contact',
        element: (
          <Lazy>
            <ContactPage />
          </Lazy>
        ),
      },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: (
              <Lazy>
                <AccountPage />
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
        ],
      },
    ],
  },
])
