import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Button } from '../components/Button'

export default function RouteErrorPage() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  const heading = is404 ? 'Page not found' : 'Something went wrong'
  const body = is404
    ? "The page you're looking for doesn't exist or may have moved."
    : "We hit an unexpected error. Try refreshing, or head back to the dashboard."

  return (
    <div className="min-h-screen flex items-center justify-center bg-platform-bg p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          {is404 ? '🔍' : '⚠️'}
        </div>
        <h1 className="text-2xl font-bold text-platform-fg mb-2">{heading}</h1>
        <p className="text-platform-fg-muted mb-8">{body}</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}
