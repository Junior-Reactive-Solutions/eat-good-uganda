/**
 * OpenAPI 3.1 Specification Generator
 *
 * This module builds a complete OpenAPI 3.1 spec for the Eat Good Uganda API
 * without relying on zod-to-openapi's extension methods, which have compatibility
 * issues with zod v4. Instead, we build the spec object manually using the OpenAPI structure.
 */

// Define the complete OpenAPI spec object
export function getOpenAPISpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Eat Good Uganda API',
      version: '1.0.0',
      description: 'Multi-tenant bakery commerce platform API',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development',
      },
      {
        url: 'https://api.eatgood.ug',
        description: 'Production',
      },
    ],
    tags: [
      { name: 'Public', description: 'Public routes (no authentication)' },
      { name: 'Customer', description: 'Customer account and order management' },
      { name: 'Bakery', description: 'Bakery staff operations' },
      { name: 'Admin', description: 'Super-admin platform management' },
      { name: 'Webhooks', description: 'Inbound webhooks from payment providers' },
      { name: 'Internal', description: 'Internal routes (keep-alive, migrations)' },
    ],
    components: {
      securitySchemes: {
        customerSession: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'customer_session',
          description: 'Customer authentication token (HTTPOnly cookie)',
        },
        bakerySession: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'bakery_session',
          description: 'Bakery staff authentication token (HTTPOnly cookie)',
        },
        superAdminSession: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'super_admin_session',
          description: 'Super-admin authentication token (HTTPOnly cookie)',
        },
        webhookHmac: {
          type: 'apiKey' as const,
          in: 'header' as const,
          name: 'X-Signature',
          description: 'HMAC signature for webhook validation',
        },
      },
      schemas: {
        Error: {
          type: 'object' as const,
          properties: {
            error: { type: 'string', description: 'Error code' },
            message: { type: 'string', description: 'Human-readable error message' },
            details: { type: 'object', additionalProperties: true },
          },
          required: ['error'],
        },
        Pagination: {
          type: 'object' as const,
          properties: {
            page: { type: 'integer', minimum: 1 },
            page_size: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            total_pages: { type: 'integer', minimum: 0 },
          },
          required: ['page', 'page_size', 'total', 'total_pages'],
        },
      },
    },
    paths: {
      '/v1/public/bakeries': {
        get: {
          tags: ['Public'],
          summary: 'List bakeries',
          description: 'List active bakeries, optionally filtered by location and search term.',
          parameters: [
            {
              name: 'lat',
              in: 'query',
              schema: { type: 'number' },
              description: 'Latitude for distance-based sorting',
            },
            {
              name: 'lng',
              in: 'query',
              schema: { type: 'number' },
              description: 'Longitude for distance-based sorting',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string', maxLength: 100 },
              description: 'Search term for bakery name',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number (1-indexed)',
            },
            {
              name: 'page_size',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 50 },
              description: 'Items per page',
            },
          ],
          responses: {
            '200': {
              description: 'List of bakeries',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bakeries: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            slug: { type: 'string' },
                            display_name: { type: 'string' },
                            status: { type: 'string', enum: ['active', 'pending', 'suspended', 'archived'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/public/bakeries/{slug}': {
        get: {
          tags: ['Public'],
          summary: 'Get bakery profile',
          description: 'Retrieve full bakery profile including theme settings.',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Bakery slug identifier',
            },
          ],
          responses: {
            '200': {
              description: 'Bakery profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bakery: { type: 'object' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Bakery not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/v1/customer/auth/signup': {
        post: {
          tags: ['Customer'],
          summary: 'Register customer account',
          description: 'Create a new customer account with email, password, and name.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 10 },
                    full_name: { type: 'string', minLength: 2 },
                    phone: { type: 'string' },
                  },
                  required: ['email', 'password', 'full_name'],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Account created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          email: { type: 'string', format: 'email' },
                          full_name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '409': {
              description: 'Email already registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/v1/customer/auth/login': {
        post: {
          tags: ['Customer'],
          summary: 'Customer login',
          description: 'Authenticate with email and password. Sets secure HTTPOnly cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 1 },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/v1/customer/auth/logout': {
        post: {
          tags: ['Customer'],
          summary: 'Customer logout',
          description: 'Clear session cookie.',
          security: [{ customerSession: [] }],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { ok: { type: 'boolean' } },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/customer/orders': {
        post: {
          tags: ['Customer'],
          summary: 'Create order',
          description: 'Create a new order as an authenticated customer.',
          security: [{ customerSession: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Order created',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Customer'],
          summary: 'List customer orders',
          description: 'Retrieve all orders for the authenticated customer.',
          security: [{ customerSession: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'page_size',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
            },
          ],
          responses: {
            '200': {
              description: 'List of orders',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/v1/bakery/auth/signup': {
        post: {
          tags: ['Bakery'],
          summary: 'Register bakery account',
          description: 'Create a new bakery account. Account requires platform approval before login is allowed.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Bakery registration submitted',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/v1/bakery/auth/login': {
        post: {
          tags: ['Bakery'],
          summary: 'Bakery staff login',
          description: 'Authenticate as bakery owner or staff. Sets secure HTTPOnly cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/v1/admin/auth/login': {
        post: {
          tags: ['Admin'],
          summary: 'Super-admin login',
          description: 'Authenticate with email, password, and 2FA TOTP code.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/v1/public/orders': {
        post: {
          tags: ['Public'],
          summary: 'Create order (guest checkout)',
          description: 'Create an order without authentication. Returns claim token for order tracking.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Order created for guest',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/v1/internal/health': {
        get: {
          tags: ['Internal'],
          summary: 'Health check',
          description: 'Returns 200 if API is running. Used by load balancers and uptime monitors.',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    externalDocs: {
      url: 'https://github.com/Junior-Reactive-Solutions/eat-good-uganda',
      description: 'API Documentation and Source Code',
    },
  }
}
