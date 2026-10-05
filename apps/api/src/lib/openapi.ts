/**
 * OpenAPI 3.1 Specification — Eat Good Uganda API
 *
 * Built manually because @asteasolutions/zod-to-openapi has breaking
 * incompatibilities with zod v4. All paths from docs/05-API_SPEC.md
 * are documented here.
 */

// ─── Reusable inline schemas ────────────────────────────────────────────────

const ErrorSchema = { $ref: '#/components/schemas/Error' }
const PaginationSchema = { $ref: '#/components/schemas/Pagination' }

function paginatedResponse(itemSchema: Record<string, unknown>) {
  return {
    type: 'object' as const,
    properties: {
      data: { type: 'array' as const, items: itemSchema },
      pagination: PaginationSchema,
    },
  }
}

function errorResponse(description: string) {
  return {
    description,
    content: { 'application/json': { schema: ErrorSchema } },
  }
}

function jsonResponse(description: string, schema: Record<string, unknown>) {
  return {
    description,
    content: { 'application/json': { schema } },
  }
}

function jsonBody(schema: Record<string, unknown>) {
  return {
    required: true,
    content: { 'application/json': { schema } },
  }
}

// ─── Path parameters ────────────────────────────────────────────────────────

const pathParam = (name: string, description: string) => ({
  name,
  in: 'path' as const,
  required: true,
  schema: { type: 'string' as const },
  description,
})

const pageParams = [
  { name: 'page', in: 'query' as const, schema: { type: 'integer' as const, default: 1 } },
  {
    name: 'page_size',
    in: 'query' as const,
    schema: { type: 'integer' as const, default: 20, maximum: 100 },
  },
]

// ─── Spec ───────────────────────────────────────────────────────────────────

export function getOpenAPISpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Eat Good Uganda API',
      version: '1.0.0',
      description:
        'Multi-tenant bakery commerce platform. Routes are prefixed /v1/ and grouped by namespace: public, customer, bakery, admin, webhooks, internal.',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
      { url: 'https://api.eatgood.ug', description: 'Production' },
    ],
    tags: [
      { name: 'Public', description: 'Public routes — no authentication required' },
      { name: 'Customer', description: 'Customer account and order management' },
      { name: 'Bakery', description: 'Bakery staff operations (tenant comes from session token)' },
      { name: 'Admin', description: 'Super-admin platform management' },
      { name: 'Webhooks', description: 'Inbound webhooks from payment providers' },
      { name: 'Internal', description: 'Health checks, seed, and keep-alive' },
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
          description: 'HMAC signature for webhook payload validation',
        },
      },
      schemas: {
        Error: {
          type: 'object' as const,
          required: ['error'],
          properties: {
            error: { type: 'string', description: 'Stable snake_case error code' },
            message: { type: 'string', description: 'Human-readable message, safe to display' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              description: 'Validation error detail (validation_failed only)',
            },
          },
        },
        Pagination: {
          type: 'object' as const,
          required: ['page', 'page_size', 'total', 'total_pages'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            page_size: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            total_pages: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    paths: {
      // ── Public ───────────────────────────────────────────────────────────

      '/v1/public/bakeries': {
        get: {
          tags: ['Public'],
          summary: 'List bakeries',
          description:
            'List active bakeries sorted by distance when lat/lng supplied, otherwise by display_name.',
          parameters: [
            { name: 'lat', in: 'query' as const, schema: { type: 'number' as const } },
            { name: 'lng', in: 'query' as const, schema: { type: 'number' as const } },
            {
              name: 'category',
              in: 'query' as const,
              schema: { type: 'string' as const },
              description: 'Filter by category slug',
            },
            ...pageParams,
          ],
          responses: {
            '200': jsonResponse('List of bakeries', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/public/bakeries/{slug}': {
        get: {
          tags: ['Public'],
          summary: 'Get bakery profile',
          description: 'Full bakery profile including theme tokens.',
          parameters: [pathParam('slug', 'Bakery slug identifier')],
          responses: {
            '200': jsonResponse('Bakery profile', { type: 'object' as const }),
            '404': errorResponse('Bakery not found'),
          },
        },
      },

      '/v1/public/bakeries/{slug}/products': {
        get: {
          tags: ['Public'],
          summary: 'List bakery products',
          description: 'Published, available products for this bakery.',
          parameters: [
            pathParam('slug', 'Bakery slug'),
            { name: 'category', in: 'query' as const, schema: { type: 'string' as const } },
            ...pageParams,
          ],
          responses: {
            '200': jsonResponse('Products', paginatedResponse({ type: 'object' as const })),
            '404': errorResponse('Bakery not found'),
          },
        },
      },

      '/v1/public/bakeries/{slug}/products/{productSlug}': {
        get: {
          tags: ['Public'],
          summary: 'Get product detail',
          description: 'Full product detail including variants.',
          parameters: [pathParam('slug', 'Bakery slug'), pathParam('productSlug', 'Product slug')],
          responses: {
            '200': jsonResponse('Product detail', { type: 'object' as const }),
            '404': errorResponse('Product not found'),
          },
        },
      },

      '/v1/public/bakeries/{slug}/categories': {
        get: {
          tags: ['Public'],
          summary: 'List bakery categories',
          description: 'Category list for menu navigation.',
          parameters: [pathParam('slug', 'Bakery slug')],
          responses: {
            '200': jsonResponse('Categories', { type: 'object' as const }),
            '404': errorResponse('Bakery not found'),
          },
        },
      },

      '/v1/public/contact': {
        post: {
          tags: ['Public'],
          summary: 'Platform contact form',
          description: 'Submit a contact enquiry from the landing page.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['name', 'email', 'message'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              message: { type: 'string', maxLength: 2000 },
            },
          }),
          responses: {
            '200': jsonResponse('Enquiry received', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      '/v1/public/orders': {
        post: {
          tags: ['Public'],
          summary: 'Create order (guest checkout)',
          description:
            'Create an order without authentication. Email + phone + name inline. Returns a claim token emailed to the customer.',
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Order created', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      // ── Customer auth ────────────────────────────────────────────────────

      '/v1/customer/auth/signup': {
        post: {
          tags: ['Customer'],
          summary: 'Register customer account',
          description: 'Create a new customer account.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['email', 'password', 'full_name'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 10 },
              full_name: { type: 'string', minLength: 2 },
              phone: { type: 'string' },
            },
          }),
          responses: {
            '201': jsonResponse('Account created', { type: 'object' as const }),
            '409': errorResponse('Email already registered'),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      '/v1/customer/auth/login': {
        post: {
          tags: ['Customer'],
          summary: 'Customer login',
          description: 'Authenticate with email and password. Sets secure HTTPOnly cookie.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
          }),
          responses: {
            '200': jsonResponse('Login successful', { type: 'object' as const }),
            '401': errorResponse('Invalid credentials'),
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
            '200': jsonResponse('Logout successful', {
              type: 'object' as const,
              properties: { ok: { type: 'boolean' as const } },
            }),
          },
        },
      },

      '/v1/customer/auth/refresh': {
        post: {
          tags: ['Customer'],
          summary: 'Refresh access token',
          description: 'Exchange refresh token for a new access token.',
          responses: {
            '200': jsonResponse('Token refreshed', { type: 'object' as const }),
            '401': errorResponse('Invalid or expired refresh token'),
          },
        },
      },

      '/v1/customer/auth/forgot-password': {
        post: {
          tags: ['Customer'],
          summary: 'Request password reset',
          description: 'Send a password-reset email if the address exists.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          }),
          responses: {
            '200': jsonResponse('Reset email sent (always 200 to prevent enumeration)', {
              type: 'object' as const,
            }),
          },
        },
      },

      '/v1/customer/auth/reset-password': {
        post: {
          tags: ['Customer'],
          summary: 'Reset password',
          description: 'Set a new password using the token from the reset email.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['token', 'password'],
            properties: {
              token: { type: 'string' },
              password: { type: 'string', minLength: 10 },
            },
          }),
          responses: {
            '200': jsonResponse('Password updated', { type: 'object' as const }),
            '400': errorResponse('Invalid or expired token'),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      '/v1/customer/auth/verify-email': {
        post: {
          tags: ['Customer'],
          summary: 'Verify email address',
          description: 'Confirm email using token from verification email.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['token'],
            properties: { token: { type: 'string' } },
          }),
          responses: {
            '200': jsonResponse('Email verified', { type: 'object' as const }),
            '400': errorResponse('Invalid or expired token'),
          },
        },
      },

      // ── Customer profile ─────────────────────────────────────────────────

      '/v1/customer/me': {
        get: {
          tags: ['Customer'],
          summary: 'Get own profile',
          security: [{ customerSession: [] }],
          responses: {
            '200': jsonResponse('Customer profile', { type: 'object' as const }),
            '401': errorResponse('Unauthenticated'),
          },
        },
        patch: {
          tags: ['Customer'],
          summary: 'Update own profile',
          security: [{ customerSession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated profile', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
        delete: {
          tags: ['Customer'],
          summary: 'Delete own account (soft)',
          security: [{ customerSession: [] }],
          responses: {
            '200': jsonResponse('Account deleted', { type: 'object' as const }),
          },
        },
      },

      '/v1/customer/favourite-bakery': {
        post: {
          tags: ['Customer'],
          summary: 'Add favourite bakery',
          security: [{ customerSession: [] }],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['bakery_id'],
            properties: { bakery_id: { type: 'string', format: 'uuid' } },
          }),
          responses: {
            '200': jsonResponse('Favourite added', { type: 'object' as const }),
            '404': errorResponse('Bakery not found'),
          },
        },
        delete: {
          tags: ['Customer'],
          summary: 'Remove favourite bakery',
          security: [{ customerSession: [] }],
          responses: {
            '200': jsonResponse('Favourite removed', { type: 'object' as const }),
          },
        },
      },

      // ── Customer orders ──────────────────────────────────────────────────

      '/v1/customer/orders': {
        post: {
          tags: ['Customer'],
          summary: 'Create order',
          description: 'Create a new order as an authenticated customer.',
          security: [{ customerSession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Order created', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
        get: {
          tags: ['Customer'],
          summary: 'List own orders',
          description: 'All orders across all bakeries for the authenticated customer.',
          security: [{ customerSession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Orders', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/customer/orders/{id}': {
        get: {
          tags: ['Customer'],
          summary: 'Get order detail',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Order detail', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
          },
        },
      },

      '/v1/customer/orders/{id}/cancel': {
        post: {
          tags: ['Customer'],
          summary: 'Cancel order',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Order cancelled', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
            '409': errorResponse('Order cannot be cancelled in its current status'),
          },
        },
      },

      '/v1/customer/orders/{id}/pay': {
        post: {
          tags: ['Customer'],
          summary: 'Initiate payment',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Payment initiated', { type: 'object' as const }),
            '502': errorResponse('Payment provider error'),
          },
        },
      },

      '/v1/customer/orders/{id}/payment-status': {
        get: {
          tags: ['Customer'],
          summary: 'Poll payment status',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Payment status', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
          },
        },
      },

      '/v1/customer/orders/{id}/messages': {
        get: {
          tags: ['Customer'],
          summary: 'Get order messages',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Messages', { type: 'object' as const }),
          },
        },
        post: {
          tags: ['Customer'],
          summary: 'Send message to bakery',
          security: [{ customerSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['body'],
            properties: { body: { type: 'string', maxLength: 1000 } },
          }),
          responses: {
            '201': jsonResponse('Message sent', { type: 'object' as const }),
          },
        },
      },

      // ── Bakery auth ──────────────────────────────────────────────────────

      '/v1/bakery/auth/signup': {
        post: {
          tags: ['Bakery'],
          summary: 'Register bakery',
          description: 'Submit bakery registration. Platform approval required before login.',
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Registration submitted', { type: 'object' as const }),
            '409': errorResponse('Bakery slug or email already registered'),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      '/v1/bakery/auth/login': {
        post: {
          tags: ['Bakery'],
          summary: 'Bakery staff login',
          description: 'Authenticate as bakery owner or staff. Sets secure HTTPOnly cookie.',
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Login successful', { type: 'object' as const }),
            '401': errorResponse('Invalid credentials or bakery not approved'),
          },
        },
      },

      '/v1/bakery/auth/logout': {
        post: {
          tags: ['Bakery'],
          summary: 'Bakery logout',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Logout successful', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/auth/refresh': {
        post: {
          tags: ['Bakery'],
          summary: 'Refresh bakery access token',
          responses: {
            '200': jsonResponse('Token refreshed', { type: 'object' as const }),
            '401': errorResponse('Invalid or expired refresh token'),
          },
        },
      },

      // ── Bakery me ────────────────────────────────────────────────────────

      '/v1/bakery/me': {
        get: {
          tags: ['Bakery'],
          summary: 'Get current bakery user + bakery summary',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Current user', { type: 'object' as const }),
            '401': errorResponse('Unauthenticated'),
          },
        },
      },

      '/v1/bakery/me/password': {
        patch: {
          tags: ['Bakery'],
          summary: 'Change password',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['current_password', 'new_password'],
            properties: {
              current_password: { type: 'string' },
              new_password: { type: 'string', minLength: 10 },
            },
          }),
          responses: {
            '200': jsonResponse('Password changed', { type: 'object' as const }),
            '401': errorResponse('Current password incorrect'),
          },
        },
      },

      // ── Bakery profile ───────────────────────────────────────────────────

      '/v1/bakery/profile': {
        get: {
          tags: ['Bakery'],
          summary: 'Get bakery profile',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Bakery profile', { type: 'object' as const }),
          },
        },
        patch: {
          tags: ['Bakery'],
          summary: 'Update bakery profile',
          description: 'Update name, logo, colours, opening hours, etc.',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated profile', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      // ── Bakery staff ─────────────────────────────────────────────────────

      '/v1/bakery/staff': {
        get: {
          tags: ['Bakery'],
          summary: 'List bakery users',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Staff list', { type: 'object' as const }),
          },
        },
        post: {
          tags: ['Bakery'],
          summary: 'Invite staff member',
          description: 'Invite a new staff member (owner/manager only).',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Invitation sent', { type: 'object' as const }),
            '409': errorResponse('Email already a staff member'),
          },
        },
      },

      '/v1/bakery/staff/{id}': {
        patch: {
          tags: ['Bakery'],
          summary: 'Update staff member',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Staff user ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated staff member', { type: 'object' as const }),
            '404': errorResponse('Staff member not found'),
          },
        },
        delete: {
          tags: ['Bakery'],
          summary: 'Remove staff member',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Staff user ID')],
          responses: {
            '200': jsonResponse('Staff member removed', { type: 'object' as const }),
            '404': errorResponse('Staff member not found'),
          },
        },
      },

      // ── Bakery categories ────────────────────────────────────────────────

      '/v1/bakery/categories': {
        get: {
          tags: ['Bakery'],
          summary: 'List categories',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Categories', { type: 'object' as const }),
          },
        },
        post: {
          tags: ['Bakery'],
          summary: 'Create category',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Category created', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/categories/{id}': {
        patch: {
          tags: ['Bakery'],
          summary: 'Update category',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Category ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated category', { type: 'object' as const }),
            '404': errorResponse('Category not found'),
          },
        },
        delete: {
          tags: ['Bakery'],
          summary: 'Delete category',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Category ID')],
          responses: {
            '200': jsonResponse('Category deleted', { type: 'object' as const }),
            '404': errorResponse('Category not found'),
          },
        },
      },

      // ── Bakery products ──────────────────────────────────────────────────

      '/v1/bakery/products': {
        get: {
          tags: ['Bakery'],
          summary: 'List products',
          security: [{ bakerySession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Products', paginatedResponse({ type: 'object' as const })),
          },
        },
        post: {
          tags: ['Bakery'],
          summary: 'Create product',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Product created', { type: 'object' as const }),
            '422': errorResponse('Validation failed'),
          },
        },
      },

      '/v1/bakery/products/{id}': {
        get: {
          tags: ['Bakery'],
          summary: 'Get product',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID')],
          responses: {
            '200': jsonResponse('Product', { type: 'object' as const }),
            '404': errorResponse('Product not found'),
          },
        },
        patch: {
          tags: ['Bakery'],
          summary: 'Update product',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated product', { type: 'object' as const }),
            '404': errorResponse('Product not found'),
          },
        },
        delete: {
          tags: ['Bakery'],
          summary: 'Delete product (soft)',
          description: 'Only allowed when no active orders reference this product.',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID')],
          responses: {
            '200': jsonResponse('Product deleted', { type: 'object' as const }),
            '409': errorResponse('Product has active orders'),
          },
        },
      },

      '/v1/bakery/products/{id}/variants': {
        post: {
          tags: ['Bakery'],
          summary: 'Create product variant',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '201': jsonResponse('Variant created', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/products/{id}/variants/{variantId}': {
        patch: {
          tags: ['Bakery'],
          summary: 'Update product variant',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID'), pathParam('variantId', 'Variant ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated variant', { type: 'object' as const }),
          },
        },
        delete: {
          tags: ['Bakery'],
          summary: 'Delete product variant',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID'), pathParam('variantId', 'Variant ID')],
          responses: {
            '200': jsonResponse('Variant deleted', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/products/{id}/images': {
        post: {
          tags: ['Bakery'],
          summary: 'Upload product image',
          description: 'Obtain a Cloudinary signed upload URL.',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID')],
          responses: {
            '200': jsonResponse('Upload URL', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/products/{id}/images/{idx}': {
        delete: {
          tags: ['Bakery'],
          summary: 'Remove product image',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Product ID'), pathParam('idx', 'Image index')],
          responses: {
            '200': jsonResponse('Image removed', { type: 'object' as const }),
          },
        },
      },

      // ── Bakery orders ────────────────────────────────────────────────────

      '/v1/bakery/orders': {
        get: {
          tags: ['Bakery'],
          summary: 'List bakery orders',
          security: [{ bakerySession: [] }],
          parameters: [
            { name: 'status', in: 'query' as const, schema: { type: 'string' as const } },
            { name: 'from', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            ...pageParams,
          ],
          responses: {
            '200': jsonResponse('Orders', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/bakery/orders/{id}': {
        get: {
          tags: ['Bakery'],
          summary: 'Get order detail',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Order detail', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
          },
        },
        patch: {
          tags: ['Bakery'],
          summary: 'Update order status / add internal note',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Updated order', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
          },
        },
      },

      '/v1/bakery/orders/{id}/messages': {
        post: {
          tags: ['Bakery'],
          summary: 'Reply to customer',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['body'],
            properties: { body: { type: 'string', maxLength: 1000 } },
          }),
          responses: {
            '201': jsonResponse('Message sent', { type: 'object' as const }),
          },
        },
      },

      // ── Bakery metrics ───────────────────────────────────────────────────

      '/v1/bakery/metrics/today': {
        get: {
          tags: ['Bakery'],
          summary: "Today's metrics",
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Metrics', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/metrics/range': {
        get: {
          tags: ['Bakery'],
          summary: 'Metrics for date range',
          security: [{ bakerySession: [] }],
          parameters: [
            { name: 'from', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query' as const, schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': jsonResponse('Metrics', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/metrics/top-products': {
        get: {
          tags: ['Bakery'],
          summary: 'Top-selling products',
          security: [{ bakerySession: [] }],
          parameters: [
            { name: 'from', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            { name: 'limit', in: 'query' as const, schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            '200': jsonResponse('Top products', { type: 'object' as const }),
          },
        },
      },

      // ── Bakery customers ─────────────────────────────────────────────────

      '/v1/bakery/customers': {
        get: {
          tags: ['Bakery'],
          summary: 'List customers who have ordered from this bakery',
          security: [{ bakerySession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Customers', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/bakery/customers/{id}': {
        get: {
          tags: ['Bakery'],
          summary: 'Get customer order history with this bakery',
          security: [{ bakerySession: [] }],
          parameters: [pathParam('id', 'Customer ID')],
          responses: {
            '200': jsonResponse('Customer detail', { type: 'object' as const }),
            '404': errorResponse('Customer not found'),
          },
        },
      },

      // ── Bakery payment methods ───────────────────────────────────────────

      '/v1/bakery/payment-methods': {
        get: {
          tags: ['Bakery'],
          summary: 'List configured payment methods',
          security: [{ bakerySession: [] }],
          responses: {
            '200': jsonResponse('Payment methods', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/payment-methods/mtn-momo': {
        put: {
          tags: ['Bakery'],
          summary: 'Configure MTN MoMo credentials',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Credentials saved', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/payment-methods/airtel-money': {
        put: {
          tags: ['Bakery'],
          summary: 'Configure Airtel Money credentials',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Credentials saved', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/payment-methods/bank-transfer': {
        put: {
          tags: ['Bakery'],
          summary: 'Configure bank transfer details',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Details saved', { type: 'object' as const }),
          },
        },
      },

      '/v1/bakery/payment-methods/cash-on-delivery': {
        put: {
          tags: ['Bakery'],
          summary: 'Enable/disable cash on delivery',
          security: [{ bakerySession: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Setting saved', { type: 'object' as const }),
          },
        },
      },

      // ── Admin auth ───────────────────────────────────────────────────────

      '/v1/admin/auth/login': {
        post: {
          tags: ['Admin'],
          summary: 'Super-admin login',
          description: 'Authenticate with email, password, and 2FA TOTP code.',
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['email', 'password', 'totp'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
              totp: { type: 'string', description: '6-digit TOTP code' },
            },
          }),
          responses: {
            '200': jsonResponse('Login successful', { type: 'object' as const }),
            '401': errorResponse('Invalid credentials or TOTP code'),
          },
        },
      },

      '/v1/admin/auth/logout': {
        post: {
          tags: ['Admin'],
          summary: 'Super-admin logout',
          security: [{ superAdminSession: [] }],
          responses: {
            '200': jsonResponse('Logout successful', { type: 'object' as const }),
          },
        },
      },

      // ── Admin bakeries ───────────────────────────────────────────────────

      '/v1/admin/bakeries': {
        get: {
          tags: ['Admin'],
          summary: 'List all bakeries',
          description: 'All bakeries regardless of status.',
          security: [{ superAdminSession: [] }],
          parameters: [
            { name: 'status', in: 'query' as const, schema: { type: 'string' as const } },
            ...pageParams,
          ],
          responses: {
            '200': jsonResponse('Bakeries', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/admin/bakeries/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get bakery detail',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Bakery ID')],
          responses: {
            '200': jsonResponse('Bakery', { type: 'object' as const }),
            '404': errorResponse('Bakery not found'),
          },
        },
      },

      '/v1/admin/bakeries/{id}/approve': {
        post: {
          tags: ['Admin'],
          summary: 'Approve bakery registration',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Bakery ID')],
          responses: {
            '200': jsonResponse('Bakery approved', { type: 'object' as const }),
            '404': errorResponse('Bakery not found'),
          },
        },
      },

      '/v1/admin/bakeries/{id}/suspend': {
        post: {
          tags: ['Admin'],
          summary: 'Suspend bakery',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Bakery ID')],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['reason'],
            properties: { reason: { type: 'string' } },
          }),
          responses: {
            '200': jsonResponse('Bakery suspended', { type: 'object' as const }),
          },
        },
      },

      '/v1/admin/bakeries/{id}/unsuspend': {
        post: {
          tags: ['Admin'],
          summary: 'Unsuspend bakery',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Bakery ID')],
          responses: {
            '200': jsonResponse('Bakery unsuspended', { type: 'object' as const }),
          },
        },
      },

      '/v1/admin/bakeries/{id}/archive': {
        post: {
          tags: ['Admin'],
          summary: 'Archive bakery',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Bakery ID')],
          responses: {
            '200': jsonResponse('Bakery archived', { type: 'object' as const }),
          },
        },
      },

      // ── Admin customers ──────────────────────────────────────────────────

      '/v1/admin/customers': {
        get: {
          tags: ['Admin'],
          summary: 'List all customers',
          security: [{ superAdminSession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Customers', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/admin/customers/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get customer detail',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Customer ID')],
          responses: {
            '200': jsonResponse('Customer', { type: 'object' as const }),
            '404': errorResponse('Customer not found'),
          },
        },
      },

      '/v1/admin/customers/{id}/disable': {
        post: {
          tags: ['Admin'],
          summary: 'Disable customer account',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Customer ID')],
          responses: {
            '200': jsonResponse('Account disabled', { type: 'object' as const }),
          },
        },
      },

      // ── Admin orders ─────────────────────────────────────────────────────

      '/v1/admin/orders': {
        get: {
          tags: ['Admin'],
          summary: 'List all orders (cross-bakery)',
          security: [{ superAdminSession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Orders', paginatedResponse({ type: 'object' as const })),
          },
        },
      },

      '/v1/admin/orders/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get order detail',
          security: [{ superAdminSession: [] }],
          parameters: [pathParam('id', 'Order ID')],
          responses: {
            '200': jsonResponse('Order', { type: 'object' as const }),
            '404': errorResponse('Order not found'),
          },
        },
      },

      // ── Admin metrics ────────────────────────────────────────────────────

      '/v1/admin/metrics/platform': {
        get: {
          tags: ['Admin'],
          summary: 'Platform-wide stats',
          security: [{ superAdminSession: [] }],
          responses: {
            '200': jsonResponse('Platform metrics', { type: 'object' as const }),
          },
        },
      },

      '/v1/admin/metrics/by-bakery': {
        get: {
          tags: ['Admin'],
          summary: 'Per-bakery metrics breakdown',
          security: [{ superAdminSession: [] }],
          parameters: pageParams,
          responses: {
            '200': jsonResponse('Metrics by bakery', { type: 'object' as const }),
          },
        },
      },

      // ── Admin audit log ──────────────────────────────────────────────────

      '/v1/admin/audit-log': {
        get: {
          tags: ['Admin'],
          summary: 'Searchable audit log',
          security: [{ superAdminSession: [] }],
          parameters: [
            { name: 'actor_id', in: 'query' as const, schema: { type: 'string' as const } },
            { name: 'resource_type', in: 'query' as const, schema: { type: 'string' as const } },
            { name: 'from', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query' as const, schema: { type: 'string', format: 'date' } },
            {
              name: 'cursor',
              in: 'query' as const,
              schema: { type: 'string' as const },
              description: 'Opaque cursor for cursor-based pagination',
            },
            { name: 'limit', in: 'query' as const, schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            '200': jsonResponse('Audit log entries', { type: 'object' as const }),
          },
        },
      },

      // ── Admin superadmins ────────────────────────────────────────────────

      '/v1/admin/superadmins': {
        get: {
          tags: ['Admin'],
          summary: 'List super-admins',
          security: [{ superAdminSession: [] }],
          responses: {
            '200': jsonResponse('Super-admins', { type: 'object' as const }),
          },
        },
        post: {
          tags: ['Admin'],
          summary: 'Invite super-admin',
          security: [{ superAdminSession: [] }],
          requestBody: jsonBody({
            type: 'object' as const,
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          }),
          responses: {
            '201': jsonResponse('Invitation sent', { type: 'object' as const }),
            '409': errorResponse('Email already a super-admin'),
          },
        },
      },

      // ── Webhooks ─────────────────────────────────────────────────────────

      '/v1/webhooks/mtn-momo': {
        post: {
          tags: ['Webhooks'],
          summary: 'MTN MoMo payment callback',
          description:
            'Inbound webhook from MTN MoMo. HMAC-verified. Always returns 200 within 3 s.',
          security: [{ webhookHmac: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Acknowledged', { type: 'object' as const }),
          },
        },
      },

      '/v1/webhooks/airtel-money': {
        post: {
          tags: ['Webhooks'],
          summary: 'Airtel Money payment callback',
          description: 'Inbound webhook from Airtel Money. HMAC-verified. Always returns 200.',
          security: [{ webhookHmac: [] }],
          requestBody: jsonBody({ type: 'object' as const }),
          responses: {
            '200': jsonResponse('Acknowledged', { type: 'object' as const }),
          },
        },
      },

      // ── Internal ─────────────────────────────────────────────────────────

      '/v1/internal/health': {
        get: {
          tags: ['Internal'],
          summary: 'Health check',
          description: 'Returns 200 if the API process is running.',
          responses: {
            '200': jsonResponse('Healthy', {
              type: 'object' as const,
              properties: {
                status: { type: 'string', enum: ['ok'] },
                uptime: { type: 'number' },
                version: { type: 'string' },
              },
            }),
          },
        },
      },

      '/v1/internal/ready': {
        get: {
          tags: ['Internal'],
          summary: 'Readiness check',
          description: 'Returns 200 if the DB responds within 500 ms, 503 otherwise.',
          responses: {
            '200': jsonResponse('Ready', { type: 'object' as const }),
            '503': jsonResponse('Not ready — DB unreachable', { type: 'object' as const }),
          },
        },
      },

      '/v1/internal/seed': {
        post: {
          tags: ['Internal'],
          summary: 'Seed database',
          description:
            'Populate the DB with test fixtures. Refused in production. Guarded by INTERNAL_SHARED_SECRET header.',
          parameters: [
            {
              name: 'X-Internal-Secret',
              in: 'header' as const,
              required: true,
              schema: { type: 'string' as const },
            },
          ],
          responses: {
            '200': jsonResponse('Seed complete', { type: 'object' as const }),
            '403': errorResponse('Wrong secret or production environment'),
          },
        },
      },
    },

    externalDocs: {
      url: 'https://github.com/Junior-Reactive-Solutions/eat-good-uganda',
      description: 'Source code and extended documentation',
    },
  }
}
