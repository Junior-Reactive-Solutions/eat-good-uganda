# 🚀 Eat Good Uganda — Quick Start Guide

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Eat Good Uganda Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend Apps (React + Vite)          Backend                  │
│  ────────────────────────────          ──────                   │
│                                                                   │
│  🏪 Customer Storefront                 📡 API Server           │
│  http://localhost:5173                  http://localhost:4000   │
│  • Browse bakeries                      • Order management      │
│  • View menus                           • Auth (JWT)            │
│  • Place orders                         • Payments              │
│  • Track delivery                       • Multi-tenant routing  │
│                                                                   │
│  🍰 Bakery Admin                                                │
│  http://localhost:5174                  🗄️  Database           │
│  • Manage menu items                    PostgreSQL             │
│  • View orders                          localhost:5432          │
│  • Update order status                  (or Docker)            │
│  • Staff management                                             │
│                                                                   │
│  👨‍💼 Super Admin                                                   │
│  http://localhost:5175                                          │
│  • Platform metrics                                             │
│  • Manage bakeries                                              │
│  • View system health                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1️⃣ Database Setup (Choose One)

#### Option A: Docker (Easiest)
```powershell
# Start PostgreSQL in Docker on port 5432
docker run --name eatgood-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=eatgood `
  -p 5432:5432 `
  -d postgres:16-alpine

# Verify it's running
docker ps | findstr eatgood-db
```

#### Option B: Local PostgreSQL (Windows)
1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings (port 5432, user: postgres, password: postgres)
3. The .env file already has the correct connection string

#### Option C: Cloud Database (Neon)
- Go to https://neon.tech → Create free account
- Copy connection string and update DATABASE_URL in .env

### 2️⃣ Install Dependencies
```powershell
cd "D:\Junior Reactive Projects\eatgooduganda"
pnpm install
```

### 3️⃣ Run Database Migrations
```powershell
pnpm migrate
```

### 4️⃣ Start Development Server
```powershell
pnpm dev
```

This starts all 4 apps in parallel:
- **Customer:** http://localhost:5173
- **Bakery Admin:** http://localhost:5174
- **Super Admin:** http://localhost:5175
- **API:** http://localhost:4000

---

## What You'll See

### 🏪 Customer Storefront (http://localhost:5173)
Browse bakeries → Select bakery → View menu → Add items to cart → Checkout → Track order

### 🍰 Bakery Admin (http://localhost:5174)
View pending orders → Manage menu items → Update order status → Analytics

### 👨‍💼 Super Admin (http://localhost:5175)
Platform overview → Bakery management → System metrics

### 📡 API (http://localhost:4000)
- Swagger docs: http://localhost:4000/api-docs
- All data flows through JWT-authenticated REST endpoints

---

## Key Features Implemented

✅ **Multi-tenant architecture** with bakery isolation  
✅ **Authentication** (Customer, Bakery Staff, Super Admin with JWT)  
✅ **Product management** (menu items, variants, pricing)  
✅ **Shopping cart** (persistent per-bakery)  
✅ **Checkout flow** (address, fulfillment, payment selection)  
✅ **Order creation** (authenticated & guest checkout)  
✅ **Order confirmation** (email notifications)  
✅ **Order tracking** (timeline, status updates)  
✅ **Responsive design** (mobile-first)  
✅ **Full test coverage** (unit, integration, E2E)  

---

## Troubleshooting

### Database Connection Failed
```powershell
# Check if Docker container is running
docker ps | findstr eatgood-db

# Or test local PostgreSQL
psql -U postgres -d eatgood
```

### Port Already in Use
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

### Migrations Not Running
```powershell
# Check migrations exist
ls packages/db/migrations

# Run migrations again
pnpm migrate
```

---

## Common Commands

```powershell
# Development
pnpm dev                            # Start all apps
pnpm dev --filter=@eatgood/api     # Start only API

# Testing
pnpm test                           # Run all tests
pnpm test apps/customer             # Test specific app

# Code Quality
pnpm typecheck                      # Type check
pnpm lint                           # Lint & format check
pnpm format                         # Format code

# Database
pnpm migrate                        # Run migrations
pnpm migrate:create                 # Create new migration

# Build
pnpm build                          # Build all apps
```

---

## Project Structure

```
eatgooduganda/
├── apps/
│   ├── api/                 # Node.js Express backend
│   ├── customer/            # React customer storefront
│   ├── bakery-admin/        # React bakery dashboard
│   └── super-admin/         # React admin console
├── packages/
│   ├── shared/              # Shared types & validation
│   └── db/                  # Database migrations
├── docs/                    # Architecture specifications
├── instructions/            # Development rules
└── prompts/                 # Implementation guides
```

---

## Database Setup Details

See `DATABASE_SETUP.md` for detailed database configuration options.

The .env file is already configured for local development with:
- PostgreSQL on localhost:5432
- Development credentials (user: postgres, password: postgres)
- CORS enabled for all local ports
- JWT keys set up (development only!)

---

## API Documentation

Visit http://localhost:4000/api-docs for interactive API documentation.

Key endpoints:
- POST `/auth/customer/login` — Customer authentication
- GET `/v1/bakeries` — List all bakeries
- GET `/v1/bakeries/{id}/products` — Get bakery menu
- POST `/v1/orders` — Create order
- GET `/v1/customer/orders` — Get customer's orders

---

## Next Steps

1. Set up database (Docker is easiest)
2. Run `pnpm dev` to start all servers
3. Open http://localhost:5173 in your browser
4. Explore the customer app, bakery admin, and API docs
5. Read docs/ to understand the multi-tenant architecture
6. Check prompts/ for feature implementation guides

---

Happy building! 🚀
