/**
 * Contract tests for the OpenAPI 3.1 specification.
 *
 * These tests run against the spec object directly (no server needed) and
 * verify:
 *  1. The spec is structurally valid (required top-level fields present).
 *  2. Every path required by docs/05-API_SPEC.md is documented.
 *  3. Every $ref in the spec resolves against components.schemas.
 *  4. Every path operation has at least one documented response.
 *  5. Security schemes declared on operations are registered in components.
 */

import { describe, expect, it } from 'vitest'

import { getOpenAPISpec } from '../src/lib/openapi'

const spec = getOpenAPISpec()

// ─── Required routes from docs/05-API_SPEC.md ────────────────────────────────

const REQUIRED_PATHS: Array<{ path: string; method: string }> = [
  // Public
  { path: '/v1/public/bakeries', method: 'get' },
  { path: '/v1/public/bakeries/{slug}', method: 'get' },
  { path: '/v1/public/bakeries/{slug}/products', method: 'get' },
  { path: '/v1/public/bakeries/{slug}/products/{productSlug}', method: 'get' },
  { path: '/v1/public/bakeries/{slug}/categories', method: 'get' },
  { path: '/v1/public/contact', method: 'post' },
  { path: '/v1/public/orders', method: 'post' },
  // Customer auth
  { path: '/v1/customer/auth/signup', method: 'post' },
  { path: '/v1/customer/auth/login', method: 'post' },
  { path: '/v1/customer/auth/logout', method: 'post' },
  { path: '/v1/customer/auth/refresh', method: 'post' },
  { path: '/v1/customer/auth/forgot-password', method: 'post' },
  { path: '/v1/customer/auth/reset-password', method: 'post' },
  { path: '/v1/customer/auth/verify-email', method: 'post' },
  // Customer profile
  { path: '/v1/customer/me', method: 'get' },
  { path: '/v1/customer/me', method: 'patch' },
  { path: '/v1/customer/me', method: 'delete' },
  { path: '/v1/customer/favourite-bakery', method: 'post' },
  { path: '/v1/customer/favourite-bakery', method: 'delete' },
  // Customer orders
  { path: '/v1/customer/orders', method: 'post' },
  { path: '/v1/customer/orders', method: 'get' },
  { path: '/v1/customer/orders/{id}', method: 'get' },
  { path: '/v1/customer/orders/{id}/cancel', method: 'post' },
  { path: '/v1/customer/orders/{id}/pay', method: 'post' },
  { path: '/v1/customer/orders/{id}/payment-status', method: 'get' },
  { path: '/v1/customer/orders/{id}/messages', method: 'get' },
  { path: '/v1/customer/orders/{id}/messages', method: 'post' },
  // Bakery auth
  { path: '/v1/bakery/auth/signup', method: 'post' },
  { path: '/v1/bakery/auth/login', method: 'post' },
  { path: '/v1/bakery/auth/logout', method: 'post' },
  { path: '/v1/bakery/auth/refresh', method: 'post' },
  // Bakery me
  { path: '/v1/bakery/me', method: 'get' },
  { path: '/v1/bakery/me/password', method: 'patch' },
  // Bakery profile
  { path: '/v1/bakery/profile', method: 'get' },
  { path: '/v1/bakery/profile', method: 'patch' },
  // Bakery staff
  { path: '/v1/bakery/staff', method: 'get' },
  { path: '/v1/bakery/staff', method: 'post' },
  { path: '/v1/bakery/staff/{id}', method: 'patch' },
  { path: '/v1/bakery/staff/{id}', method: 'delete' },
  // Bakery categories
  { path: '/v1/bakery/categories', method: 'get' },
  { path: '/v1/bakery/categories', method: 'post' },
  { path: '/v1/bakery/categories/{id}', method: 'patch' },
  { path: '/v1/bakery/categories/{id}', method: 'delete' },
  // Bakery products
  { path: '/v1/bakery/products', method: 'get' },
  { path: '/v1/bakery/products', method: 'post' },
  { path: '/v1/bakery/products/{id}', method: 'get' },
  { path: '/v1/bakery/products/{id}', method: 'patch' },
  { path: '/v1/bakery/products/{id}', method: 'delete' },
  { path: '/v1/bakery/products/{id}/variants', method: 'post' },
  { path: '/v1/bakery/products/{id}/variants/{variantId}', method: 'patch' },
  { path: '/v1/bakery/products/{id}/variants/{variantId}', method: 'delete' },
  // Bakery orders
  { path: '/v1/bakery/orders', method: 'get' },
  { path: '/v1/bakery/orders/{id}', method: 'get' },
  { path: '/v1/bakery/orders/{id}', method: 'patch' },
  { path: '/v1/bakery/orders/{id}/messages', method: 'post' },
  // Bakery metrics
  { path: '/v1/bakery/metrics/today', method: 'get' },
  { path: '/v1/bakery/metrics/range', method: 'get' },
  { path: '/v1/bakery/metrics/top-products', method: 'get' },
  // Bakery customers
  { path: '/v1/bakery/customers', method: 'get' },
  { path: '/v1/bakery/customers/{id}', method: 'get' },
  // Bakery payment methods
  { path: '/v1/bakery/payment-methods', method: 'get' },
  { path: '/v1/bakery/payment-methods/mtn-momo', method: 'put' },
  { path: '/v1/bakery/payment-methods/airtel-money', method: 'put' },
  { path: '/v1/bakery/payment-methods/bank-transfer', method: 'put' },
  { path: '/v1/bakery/payment-methods/cash-on-delivery', method: 'put' },
  // Admin auth
  { path: '/v1/admin/auth/login', method: 'post' },
  { path: '/v1/admin/auth/logout', method: 'post' },
  // Admin bakeries
  { path: '/v1/admin/bakeries', method: 'get' },
  { path: '/v1/admin/bakeries/{id}', method: 'get' },
  { path: '/v1/admin/bakeries/{id}/approve', method: 'post' },
  { path: '/v1/admin/bakeries/{id}/suspend', method: 'post' },
  { path: '/v1/admin/bakeries/{id}/unsuspend', method: 'post' },
  { path: '/v1/admin/bakeries/{id}/archive', method: 'post' },
  // Admin customers
  { path: '/v1/admin/customers', method: 'get' },
  { path: '/v1/admin/customers/{id}', method: 'get' },
  { path: '/v1/admin/customers/{id}/disable', method: 'post' },
  // Admin orders
  { path: '/v1/admin/orders', method: 'get' },
  { path: '/v1/admin/orders/{id}', method: 'get' },
  // Admin metrics
  { path: '/v1/admin/metrics/platform', method: 'get' },
  { path: '/v1/admin/metrics/by-bakery', method: 'get' },
  // Admin misc
  { path: '/v1/admin/audit-log', method: 'get' },
  { path: '/v1/admin/superadmins', method: 'get' },
  { path: '/v1/admin/superadmins', method: 'post' },
  // Webhooks
  { path: '/v1/webhooks/mtn-momo', method: 'post' },
  { path: '/v1/webhooks/airtel-money', method: 'post' },
  // Internal
  { path: '/v1/internal/health', method: 'get' },
  { path: '/v1/internal/ready', method: 'get' },
  { path: '/v1/internal/seed', method: 'post' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SpecPaths = Record<string, Record<string, unknown>>
type SpecOperation = {
  responses?: Record<string, unknown>
  security?: Array<Record<string, unknown[]>>
}

function getOperation(path: string, method: string): SpecOperation | undefined {
  const pathItem = (spec.paths as SpecPaths)[path]
  if (!pathItem) return undefined
  return pathItem[method] as SpecOperation | undefined
}

function resolveRef(ref: string): boolean {
  if (!ref.startsWith('#/components/')) return true
  const parts = ref.replace('#/', '').split('/')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = spec
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return false
    current = current[part as keyof typeof current]
  }
  return current != null
}

function collectRefs(obj: unknown, refs: string[] = []): string[] {
  if (obj == null || typeof obj !== 'object') return refs
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === '$ref' && typeof value === 'string') {
      refs.push(value)
    } else {
      collectRefs(value, refs)
    }
  }
  return refs
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OpenAPI spec — structural validity', () => {
  it('has openapi version 3.1.x', () => {
    expect(spec.openapi).toMatch(/^3\.1\./)
  })

  it('has info with title and version', () => {
    expect(spec.info.title).toBeTruthy()
    expect(spec.info.version).toBeTruthy()
  })

  it('has at least one server', () => {
    expect(spec.servers.length).toBeGreaterThan(0)
  })

  it('has all four security schemes', () => {
    const schemes = Object.keys(spec.components.securitySchemes)
    expect(schemes).toContain('customerSession')
    expect(schemes).toContain('bakerySession')
    expect(schemes).toContain('superAdminSession')
    expect(schemes).toContain('webhookHmac')
  })

  it('has Error and Pagination component schemas', () => {
    const schemas = Object.keys(spec.components.schemas)
    expect(schemas).toContain('Error')
    expect(schemas).toContain('Pagination')
  })
})

describe('OpenAPI spec — required paths', () => {
  for (const { path, method } of REQUIRED_PATHS) {
    it(`${method.toUpperCase()} ${path}`, () => {
      const operation = getOperation(path, method)
      expect(operation, `${method.toUpperCase()} ${path} is missing from the spec`).toBeDefined()
    })
  }
})

describe('OpenAPI spec — every operation has at least one response', () => {
  const paths = spec.paths as SpecPaths
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete']

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of httpMethods) {
      const op = (pathItem as Record<string, unknown>)[method]
      if (!op) continue

      it(`${method.toUpperCase()} ${path} has at least one response code`, () => {
        const responses = (op as SpecOperation).responses ?? {}
        expect(Object.keys(responses).length).toBeGreaterThan(0)
      })
    }
  }
})

describe('OpenAPI spec — $refs resolve', () => {
  const allRefs = collectRefs(spec.paths)

  it('has at least one $ref in the spec', () => {
    expect(allRefs.length).toBeGreaterThan(0)
  })

  for (const ref of [...new Set(allRefs)]) {
    it(`$ref "${ref}" resolves`, () => {
      expect(resolveRef(ref), `$ref "${ref}" does not resolve`).toBe(true)
    })
  }
})

describe('OpenAPI spec — security schemes on operations are registered', () => {
  const paths = spec.paths as SpecPaths
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete']
  const registeredSchemes = new Set(Object.keys(spec.components.securitySchemes))

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of httpMethods) {
      const op = (pathItem as Record<string, unknown>)[method]
      if (!op) continue
      const security = (op as SpecOperation).security
      if (!security?.length) continue

      for (const requirement of security) {
        for (const schemeName of Object.keys(requirement)) {
          it(`${method.toUpperCase()} ${path} uses registered scheme "${schemeName}"`, () => {
            expect(
              registeredSchemes.has(schemeName),
              `Scheme "${schemeName}" on ${method.toUpperCase()} ${path} is not registered in components.securitySchemes`,
            ).toBe(true)
          })
        }
      }
    }
  }
})
