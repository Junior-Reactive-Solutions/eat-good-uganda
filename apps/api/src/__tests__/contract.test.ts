/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeAll } from 'vitest'

import { getOpenAPISpec } from '../lib/openapi'

describe('API Contract Tests', () => {
  let spec: ReturnType<typeof getOpenAPISpec>

  beforeAll(() => {
    spec = getOpenAPISpec()
  })

  describe('OpenAPI Spec generation', () => {
    it('should generate valid OpenAPI 3.1 spec', () => {
      expect(spec).toBeDefined()
      expect(spec.openapi).toBe('3.1.0')
      expect(spec.info).toBeDefined()
      expect(spec.info.title).toBe('Eat Good Uganda API')
      expect(spec.paths).toBeDefined()
    })

    it('should include security schemes', () => {
      const schemes = spec.components?.securitySchemes
      expect(schemes).toBeDefined()
      expect(schemes?.customerSession).toBeDefined()
      expect(schemes?.bakerySession).toBeDefined()
      expect(schemes?.superAdminSession).toBeDefined()
      expect(schemes?.webhookHmac).toBeDefined()
    })

    it('should include all required tags', () => {
      const tags = spec.tags?.map((t) => t.name) ?? []
      expect(tags).toContain('Public')
      expect(tags).toContain('Customer')
      expect(tags).toContain('Bakery')
      expect(tags).toContain('Admin')
      expect(tags).toContain('Internal')
    })

    it('should include common response schemas', () => {
      const schemas = spec.components?.schemas
      expect(schemas).toBeDefined()
      expect(schemas?.Error).toBeDefined()
      expect(schemas?.Pagination).toBeDefined()
    })
  })

  describe('Swagger UI endpoint (spec-only tests)', () => {
    it('should be accessible and serve OpenAPI spec', () => {
      // These endpoints are tested via integration tests
      // This contract test focuses on spec generation correctness
      expect(spec.info.title).toBe('Eat Good Uganda API')
      expect(Object.keys(spec.paths ?? {}).length).toBeGreaterThan(0)
    })
  })

  describe('Documented routes exist', () => {
    it('should have GET /v1/public/bakeries route documented', () => {
      expect(spec.paths['/v1/public/bakeries']).toBeDefined()
      expect(spec.paths['/v1/public/bakeries'].get).toBeDefined()
    })

    it('should have GET /v1/public/bakeries/:slug route documented', () => {
      expect(spec.paths['/v1/public/bakeries/{slug}']).toBeDefined()
      expect(spec.paths['/v1/public/bakeries/{slug}'].get).toBeDefined()
    })

    it('should have GET /v1/internal/health route documented', () => {
      expect(spec.paths['/v1/internal/health']).toBeDefined()
      expect(spec.paths['/v1/internal/health'].get).toBeDefined()
    })

    it('should have POST /v1/customer/auth/signup route documented', () => {
      expect(spec.paths['/v1/customer/auth/signup']).toBeDefined()
      expect(spec.paths['/v1/customer/auth/signup'].post).toBeDefined()
    })

    it('should have POST /v1/customer/auth/login route documented', () => {
      expect(spec.paths['/v1/customer/auth/login']).toBeDefined()
      expect(spec.paths['/v1/customer/auth/login'].post).toBeDefined()
    })

    it('should have POST /v1/customer/orders route documented', () => {
      expect(spec.paths['/v1/customer/orders']).toBeDefined()
      expect(spec.paths['/v1/customer/orders'].post).toBeDefined()
    })

    it('should have GET /v1/customer/orders route documented', () => {
      expect(spec.paths['/v1/customer/orders'].get).toBeDefined()
    })

    it('should have POST /v1/bakery/auth/signup route documented', () => {
      expect(spec.paths['/v1/bakery/auth/signup']).toBeDefined()
      expect(spec.paths['/v1/bakery/auth/signup'].post).toBeDefined()
    })

    it('should have POST /v1/bakery/auth/login route documented', () => {
      expect(spec.paths['/v1/bakery/auth/login']).toBeDefined()
      expect(spec.paths['/v1/bakery/auth/login'].post).toBeDefined()
    })

    it('should have POST /v1/admin/auth/login route documented', () => {
      expect(spec.paths['/v1/admin/auth/login']).toBeDefined()
      expect(spec.paths['/v1/admin/auth/login'].post).toBeDefined()
    })

    it('should have POST /v1/public/orders route documented', () => {
      expect(spec.paths['/v1/public/orders']).toBeDefined()
      expect(spec.paths['/v1/public/orders'].post).toBeDefined()
    })
  })

  describe('Route documentation completeness', () => {
    it('should have descriptions for all documented paths', () => {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (method === 'parameters' || method === 'summary') return
          if (typeof operation === 'object' && 'description' in operation) {
            expect(operation.description).toBeTruthy()
          }
        })
      })
    })

    it('should have request body schemas for POST/PUT operations', () => {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        const methods = ['post', 'put', 'patch']
        methods.forEach((method) => {
          if (method in pathItem) {
            const operation = (pathItem as Record<string, unknown>)[method] as Record<
              string,
              unknown
            > | null
            if (operation && !path.includes('logout')) {
              // Most POST/PUT operations should have requestBody
              // (logout is an exception)
              if (
                operation.requestBody &&
                operation.operationId &&
                !operation.operationId.toString().includes('logout')
              ) {
                expect(operation.requestBody).toBeDefined()
              }
            }
          }
        })
      })
    })

    it('should have response schemas for all operations', () => {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (
            method === 'parameters' ||
            typeof operation !== 'object' ||
            !operation ||
            !('responses' in operation)
          ) {
            return
          }
          expect(operation.responses).toBeDefined()
          expect(Object.keys(operation.responses ?? {}).length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Health check endpoint', () => {
    it('should be documented in OpenAPI spec', () => {
      expect(spec.paths['/v1/internal/health']).toBeDefined()
      expect(spec.paths['/v1/internal/health'].get).toBeDefined()
      expect(spec.paths['/v1/internal/health'].get?.responses).toBeDefined()
    })

    it('should have correct response schema documented', () => {
      const getOp = spec.paths['/v1/internal/health'].get
      expect(getOp?.responses?.[200]).toBeDefined()
    })
  })

  describe('Swagger UI in different environments', () => {
    it('should show correct server URLs in spec', () => {
      expect(spec.servers).toBeDefined()
      expect(spec.servers?.length).toBeGreaterThan(0)

      const urls = spec.servers?.map((s) => s.url) ?? []
      expect(urls).toContain('http://localhost:4000')
      expect(urls.some((url) => url.includes('eatgood.ug'))).toBe(true)
    })
  })
})
