import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'

import { App } from './App'
import './index.css'

// Initialize Sentry for error tracking (if DSN is provided)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1, // 10% of sessions recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors recorded
  })
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
