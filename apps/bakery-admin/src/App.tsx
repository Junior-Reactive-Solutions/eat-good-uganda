import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { RouterProvider } from 'react-router-dom'

import { useAuthSetup } from './features/auth/hooks'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function AuthSetup() {
  useAuthSetup()
  return null
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSetup />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm',
          style: { maxWidth: 360 },
        }}
      />
    </QueryClientProvider>
  )
}
