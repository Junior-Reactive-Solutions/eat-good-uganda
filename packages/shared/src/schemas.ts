// Extend Zod with OpenAPI support if zod-to-openapi is available
// This is optional and only needed by the API package
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { z } = require('zod')
  extendZodWithOpenApi(z)
} catch {
  // zod-to-openapi is optional (only used by API package)
  // Silently ignore if not available
}

export * from './schemas/auth'
export * from './schemas/orders'
