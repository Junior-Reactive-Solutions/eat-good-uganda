# Folder Structure Rules

> Enforce consistent organization across the monorepo.

## Root Structure

```
eatgooduganda/
├── apps/                    # Applications
│   ├── customer/           # Customer storefront (React + Vite)
│   ├── bakery-admin/       # Bakery dashboard (React + Vite)
│   ├── super-admin/        # Super admin console (React + Vite)
│   └── api/                # Backend (Express + TypeScript)
├── packages/               # Shared packages
│   ├── shared/             # Types, Zod schemas, utilities
│   └── db/                 # Migrations, query helpers, fixtures
├── docs/                   # Authoritative specifications
├── instructions/           # Rules for AI and humans
├── prompts/                # Build prompts (22 steps)
├── workflows/              # Team workflows
├── context/                # Background material
├── .github/                # GitHub Actions
│   └── workflows/
├── .cursor/                # Cursor-specific rules
└── .cursor/rules/
```

## App Structure

### Frontend Apps (`apps/*/`)

```
apps/customer/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Route pages
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   ├── stores/            # Zustand stores
│   └── App.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### API (`apps/api/`)

```
apps/api/
├── src/
│   ├── lib/               # Utilities, email, payments
│   ├── services/          # Business logic
│   ├── routes/            # Route handlers
│   ├── middleware/        # Express middleware
│   ├── __tests__/         # Integration tests
│   └── index.ts           # Entry point
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Package Structure

### `packages/shared/`

```
packages/shared/
├── src/
│   ├── types/             # TypeScript interfaces
│   ├── schemas/           # Zod validation schemas
│   ├── constants/         # App constants
│   └── index.ts           # Public exports
├── package.json
└── tsconfig.json
```

### `packages/db/`

```
packages/db/
├── src/
│   ├── migrations/        # SQL migration files
│   ├── queries/           # Query helpers
│   ├── fixtures/          # Test fixtures
│   └── index.ts           # DB connection + exports
├── package.json
└── tsconfig.json
```

## Naming Conventions

| Type             | Convention | Example             |
| ---------------- | ---------- | ------------------- |
| Files            | kebab-case | `customer-order.ts` |
| Components       | PascalCase | `BakeryCard.tsx`    |
| Types/Interfaces | PascalCase | `OrderItem`         |
| Database tables  | snake_case | `order_items`       |
| Database columns | snake_case | `created_at`        |

## Import Rules

- Use explicit imports, avoid barrel files (`index.ts`)
- Relative imports for intra-package
- Package imports for inter-package:
  ```ts
  import { OrderSchema } from '@eatgood/shared'
  import { seedBakery } from '@eatgood/db'
  ```

See: `instructions/02-code-style.md`, `docs/01-ARCHITECTURE.md`
