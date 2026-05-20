# Prompt 17 — Swagger UI & OpenAPI

## Context

The API has been built without a formal spec. Now we generate OpenAPI from Zod schemas and serve Swagger UI.

Read before starting:
- `docs/05-API_SPEC.md`

## Goal

Generate OpenAPI 3.1 spec from Zod schemas, serve Swagger UI at `/api-docs`, and add contract tests.

## Deliverables

### OpenAPI generation

`apps/api/src/lib/openapi.ts`:
- Uses `@asteasolutions/zod-to-openapi` to register all route schemas
- Generates complete spec at runtime on boot
- Exports `getOpenAPISpec()` for the `/api-docs/openapi.json` endpoint

### Swagger UI endpoint

```
GET /api-docs        — Swagger UI HTML
GET /api-docs/openapi.json — Raw spec (HTTP Basic Auth protected in production)
```

`apps/api/src/routes/api-docs.ts`:
- Serves Swagger UI static assets (bundle from `@swagger-api/swagger-ui-dist`)
- In production, guards with HTTP Basic Auth via `SWAGGER_BASIC_AUTH` env var

### Schema registration

Every Zod schema in `packages/shared` that represents a request/response body gets registered with the OpenAPI registry:
- `registerSchema('CustomerSignupRequest', CustomerSignupSchema)`
- `registerSchema('OrderResponse', OrderResponseSchema)`

Route handlers use the registry to declare their input/output types.

### Contract tests

`apps/api/tests/contract.test.ts`:
- Fetches the OpenAPI spec
- Walks every route
- Asserts response shape matches declared schema
- Fails CI if a route's response shape diverges from its spec

### Security schemes

In the spec:
- `customerSession` — cookie-based
- `bakerySession` — cookie-based
- `superAdminSession` — cookie-based
- `webhookHmac` — header-based

## Constraints

- Spec must be valid OpenAPI 3.1
- Every endpoint documented in `docs/05-API_SPEC.md` must appear in the spec
- Contract tests run in CI before merge

## Acceptance checklist

- [ ] Swagger UI loads at `/api-docs` in dev
- [ ] Raw spec available at `/api-docs/openapi.json`
- [ ] All routes from `docs/05-API_SPEC.md` documented
- [ ] Contract tests pass
- [ ] Production has Basic Auth on Swagger (credentials in env)