import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Button } from '../components/Button'
import { PageMeta } from '../components/PageMeta'

export default function RouteErrorPage() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  const heading = is404 ? 'Page not found' : 'Something went wrong'
  const body = is404
    ? "We couldn't find the page you were looking for. It may have moved or the link may be outdated."
    : "We hit an unexpected error loading this page. Try refreshing, or head back home."

  return (
    <div className="min-h-screen flex items-center justify-center bg-platform-bg p-4">
      <PageMeta title={heading} noIndex />
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          {is404 ? '🥐' : '⚠️'}
        </div>
        <h1 className="text-2xl font-bold text-platform-fg mb-2">{heading}</h1>
        <p className="text-platform-fg-muted mb-8">{body}</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary">Back Home</Button>
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
