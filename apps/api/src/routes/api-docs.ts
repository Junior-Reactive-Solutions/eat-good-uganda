import { type Request, type Response, type NextFunction, Router } from 'express'
import swaggerUi from 'swagger-ui-express'

import { env } from '../env'
import { getOpenAPISpec } from '../lib/openapi'

const router = Router()

// Generate the spec at startup
const openAPISpec = getOpenAPISpec()

/**
 * Middleware to protect the raw OpenAPI spec endpoint in production
 * Uses HTTP Basic Auth with credentials from environment variables
 */
function basicAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV !== 'production') {
    next()
    return
  }

  // In production, check for SWAGGER_BASIC_AUTH env var (format: "username:password")
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: 'unauthenticated', message: 'Basic auth required' })
    return
  }

  const [scheme, credentials] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'basic' || !credentials) {
    res.status(401).json({ error: 'unauthenticated', message: 'Invalid auth scheme' })
    return
  }

  try {
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
    const expectedCreds = process.env.SWAGGER_BASIC_AUTH || 'swagger:changeme'

    if (decoded !== expectedCreds) {
      res.status(403).json({ error: 'forbidden', message: 'Invalid credentials' })
      return
    }

    next()
  } catch {
    res.status(400).json({ error: 'validation_failed', message: 'Invalid basic auth format' })
  }
}

/**
 * GET /api-docs
 * Swagger UI - browsable API documentation
 * Protected by Basic Auth in production
 */
router.use('/api-docs', basicAuthMiddleware, swaggerUi.serve)
router.get('/api-docs', basicAuthMiddleware, swaggerUi.setup(openAPISpec))

/**
 * GET /api-docs/openapi.json
 * Raw OpenAPI 3.1 specification
 * Protected by Basic Auth in production
 */
router.get('/api-docs/openapi.json', basicAuthMiddleware, (_req: Request, res: Response) => {
  res.json(openAPISpec)
})

export const apiDocsRouter = router
