# Development Workflow

> How to develop locally on Eat Good Uganda.

## Prerequisites

```powershell
# Clone the repo
git clone https://github.com/Junior-Reactive-Solutions/eatgooduganda.git
cd eatgooduganda

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Fill in required env vars (see .env.example for all)
```

## Development Commands

```bash
# Start all apps in development mode
pnpm -w run dev

# Start individual apps
pnpm --filter @eatgood/customer dev      # localhost:5173
pnpm --filter @eatgood/bakery-admin dev   # localhost:5174
pnpm --filter @eatgood/super-admin dev    # localhost:5175
pnpm --filter @eatgood/api dev            # localhost:4000

# Run type checking
pnpm -w typecheck

# Run linting
pnpm -w lint

# Run tests
pnpm -w test         # All workspaces
pnpm -w test:unit    # Unit tests only
pnpm -w test:api     # API integration tests
pnpm -w test:e2e     # E2E tests (requires running apps)

# Run database migrations
pnpm -w migrate

# Seed database with test data
pnpm -w seed
```

## Database

### Local Development with Neon

1. Create a Neon project at https://neon.tech
2. Get your connection string (pooled for app, direct for migrations)
3. Add to `.env`:
   ```
   DATABASE_URL=postgresql://...-pooler.region.neon.tech/eatgood?sslmode=require
   DATABASE_URL_DIRECT=postgresql://...region.neon.tech/eatgood?sslmode=require
   ```

### Running Migrations

```bash
# Create a new migration
pnpm --filter @eatgood/db migrate create <migration_name>

# Run all pending migrations
pnpm --filter @eatgood/db migrate up

# Reset database (drops all tables, recreates)
pnpm --filter @eatgood/db migrate reset
```

### Seeding

```bash
# Seed with test data
pnpm -w seed

# Seed with specific bakery
pnpm -w seed -- --bakery=my-bakery
```

## Frontend Development

### Customer App (localhost:5173)

The main storefront where customers browse bakeries and place orders.

```bash
cd apps/customer
pnpm dev
```

### Bakery Admin (localhost:5174)

The dashboard for bakery owners and staff to manage orders, products, and customers.

```bash
cd apps/bakery-admin
pnpm dev
```

### Super Admin (localhost:5175)

The platform operator console for managing all bakeries and platform metrics.

```bash
cd apps/super-admin
pnpm dev
```

## Backend Development

### API (localhost:4000)

The Express API serving all three frontends.

```bash
cd apps/api
pnpm dev
```

### Swagger Documentation

When the API is running, visit:
- Swagger UI: http://localhost:4000/api-docs
- OpenAPI spec: http://localhost:4000/api-docs/openapi.json

## Common Tasks

### Adding a New Package

1. Create the package in `packages/<package-name>`
2. Add to root `package.json` workspace
3. Add to `pnpm-workspace.yaml`
4. Run `pnpm install`

### Adding a New App

1. Create the app in `apps/<app-name>`
2. Add to `pnpm-workspace.yaml`
3. Add scripts to its `package.json`
4. Run `pnpm install`

### Adding a Database Table

1. Create migration in `packages/db/migrations/`
2. Run migration: `pnpm --filter @eatgood/db migrate up`
3. Add query helpers in `packages/db/src/`
4. Add types in `packages/shared/src/`

## Hot Reload

- Frontends: Vite provides instant hot reload
- API: Uses `ts-node-dev` for auto-restart on changes
- Database: Migrations must be run manually after schema changes

## Debugging

### API Debugging

Set `LOG_LEVEL=debug` in `.env` for verbose logging.

### Browser Debugging

- Install React DevTools
- Install Redux DevTools (for bakery-admin)
- Use browser's network tab for API calls

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :5173

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Issues

1. Check `DATABASE_URL` in `.env`
2. Verify Neon project is active
3. Check SSL settings (`?sslmode=require`)

### Build Errors

```bash
# Clear all node_modules and reinstall
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
```

## Next Steps

After local development is working:

1. Read `prompts/PROMPT_EXECUTION_ORDER.md`
2. Start with Prompt 01: `pnpm -w typecheck`
3. Follow the build order sequentially
4. Commit each completed prompt

---

> **Tip:** Keep `.env` in `.gitignore`. Never commit secrets.