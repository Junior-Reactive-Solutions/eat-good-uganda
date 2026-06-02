# Eat Good Uganda

> A multi-tenant bakery commerce platform for Uganda where customers discover bakeries, order baked goods, and track deliveries while bakeries manage menus, orders, payments, and operations in isolated tenant spaces.

## 🎯 Status & Badges

[![Build Status](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions/workflows/test-and-coverage.yml/badge.svg)](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions/workflows/test-and-coverage.yml)
[![Security Scanning](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions/workflows/security.yml/badge.svg)](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions/workflows/security.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict%20mode-blue)](https://www.typescriptlang.org/)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Development Status:** 
- ✅ Phase 1-3: Complete (Authentication, Bakery Admin, Analytics)
- 🔄 Phase 4-5: In Progress (Advanced Features, Support System)
- 📅 Full MVP: Q3 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (20.x recommended)
- PostgreSQL 15+ (local) or [Neon](https://neon.tech) (cloud)
- pnpm 9+

### Installation
```bash
# Clone repository
git clone https://github.com/Junior-Reactive-Solutions/eat-good-uganda.git
cd eat-good-uganda

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations
pnpm -w db:migrate

# Start all apps
pnpm -w dev  # Runs all 3 apps + API simultaneously
```

### Apps (Local Development)
- **Customer App:** http://localhost:5173
- **Bakery Admin:** http://localhost:5174
- **Super Admin:** http://localhost:5175
- **API Server:** http://localhost:3000

### Running Tests
```bash
pnpm -w test          # Run all tests
pnpm -w test:watch    # Watch mode
pnpm -w typecheck     # TypeScript
pnpm -w lint          # ESLint
pnpm -w coverage      # Coverage report
```

---

## 🔗 GitHub Features

This repository is fully active with comprehensive GitHub tooling:

### 📋 Issue Tracking
- **Issue Templates:** [Bug Reports](.github/ISSUE_TEMPLATE/bug_report.md), [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.md)
- **Labels:** 30+ labels for categorization — [see LABELS.md](.github/LABELS.md)
- **Milestones:** Track progress by phase
- **Discussions:** [Community Q&A](../../discussions)

### 🔄 Continuous Integration
- **Test & Coverage:** Multi-node testing (Node 18.x, 20.x) with coverage tracking
- **Security Scanning:** Trivy + npm audit + secret detection
- **Auto-labeling:** PRs auto-labeled by file changes
- **Stale Issues:** Weekly cleanup of inactive issues/PRs

### 📝 Pull Requests
- **PR Template:** [Comprehensive checklist](.github/PULL_REQUEST_TEMPLATE.md)
- **Code Review:** Required reviews before merge
- **Auto-assignment:** Team reviews on open PRs
- **Status Checks:** 4+ required checks before merge

### 🔐 Security & Quality
- **Branch Protection:** `main` branch protected with status checks
- **Code Owners:** Team assignments for code areas
- **Secret Detection:** Trufflehog prevents credential commits
- **Dependabot:** Weekly dependency updates

### 🏷️ Organization & Planning
- **Project Board:** [Track work in progress](../../projects)
- **Workflows:** Test, security scan, auto-assign, stale cleanup
- **Release Management:** Automated releases from semantic tags

### 📚 Documentation
- **API Docs:** [docs/05-API_SPEC.md](docs/05-API_SPEC.md)
- **Architecture:** [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md)
- **Database:** [docs/02-DATABASE_SCHEMA.md](docs/02-DATABASE_SCHEMA.md)
- **Decisions:** [docs/17-DECISIONS_LOG.md](docs/17-DECISIONS_LOG.md)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### How to Contribute
1. **Check Issues:** [Find something to work on](../../issues)
2. **Create Branch:** `git checkout -b feature/your-feature`
3. **Follow Style:** TypeScript strict mode, ESLint, Prettier
4. **Add Tests:** TDD required (write test first)
5. **Create PR:** Link issues, add description, pass checks
6. **Code Review:** Address feedback from team
7. **Merge:** Green checkmarks required

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
# GitHub will show "Create Pull Request" link

# Update branch if tests fail
git commit -m "fix: address review feedback"
git push

# Merge when approved (green checkmarks required)
```

### Code Standards
- **TypeScript:** Strict mode required, no `any`
- **Testing:** Min 80% coverage, TDD approach
- **Linting:** ESLint pass required
- **Formatting:** Prettier auto-format
- **Security:** No secrets, validate inputs
- **Multi-tenancy:** Always filter by `bakery_id`

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Lines of Code** | 45,000+ |
| **Test Files** | 100+ |
| **Test Cases** | 350+ |
| **Components** | 80+ |
| **API Routes** | 30+ |
| **Database Tables** | 19 |
| **TypeScript Files** | 200+ |

---

**Project Root:** `D:\Junior Reactive Projects\eatgooduganda`  
**Status:** Active build in progress  
**Next Phase:** Phase 4 - Advanced Admin Features

---

## What this repository is

This repo started as a **context pack** and is now being actively transformed into a working application. The docs in `docs/`, `instructions/`, and `prompts/` remain the source of truth and implementation guardrails while code is added in prompt order.

Target monorepo structure:

```
apps/
  customer/        React + Vite — the customer-facing storefront (Vercel)
  bakery-admin/    React + Vite — per-bakery owner/staff dashboard (Vercel)
  super-admin/     React + Vite — platform operator console (Vercel, IP-gated)
  api/             Node + Express + TypeScript — the backend (Render)
packages/
  shared/          Types, validation schemas, theme tokens, shared utilities
  db/              Postgres migrations, seed data, and query helpers
```

Everything not in this list is scaffolding, tests, CI config, documentation, or project process files.

---

## Product direction and UX goals

The platform should feel fast, trustworthy, and simple on mobile-first Uganda traffic conditions. Core experience goals:

- Fast address entry and quick discovery of nearby bakeries/products
- Clean category-first browsing with strong search and filters
- Low-friction checkout with clear delivery and payment state
- Real-time order status visibility for customers and bakery staff
- Highly legible navigation and CTAs with minimal cognitive load

---

## Competitive benchmark takeaways

We reviewed comparable delivery experiences and are incorporating the strongest patterns:

- **Glovo-style discovery flow:** immediate location intent, category hubs, and marketplace breadth framing.
- **KFC Uganda-style commerce clarity:** direct promo-first merchandising and concise ordering CTAs.
- **Uber Eats-style acquisition and platform loops:** clear dual-sided messaging (customers, partners, couriers) and strong onboarding funnels.
- **DoorDash pattern baseline:** prioritize search relevance, basket continuity, menu readability, and operational transparency.

### What we will incorporate

- Address-first or bakery-first entry with smart defaults
- Persistent global search and category shortcuts
- Prominent promo/featured modules without cluttering navigation
- Frictionless cart continuity and clearly explained fees
- Strong empty/loading/error states for reliability perception
- Mobile-first performance budgets and image optimization discipline
- Accessibility-first semantics, keyboard support, and contrast safety

---

## Brand assets

Brand files are stored in:

- `apps/customer/src/assets/brand/logo.svg`
- `apps/customer/src/assets/brand/logo.png`

Use `logo.svg` as the primary source (scalable and color-adjustable). Use `logo.png` as fallback where raster is required.

---

## Build progress tracking

Execution tracking now lives in:

- `progress.md` (local planning and execution log, intentionally gitignored)

Use it to record:

- what is done
- what is in progress
- what is next
- why decisions were made
- how implementation and rollout will happen

---

## Read this context pack in this order

1. **`docs/00-OVERVIEW.md`** — what the product is, who it's for, what success looks like
2. **`docs/01-ARCHITECTURE.md`** — the big picture: four apps, one backend, one Postgres, how they talk
3. **`docs/03-MULTI_TENANCY.md`** — the single most important design constraint; read before writing any code
4. **`docs/02-DATABASE_SCHEMA.md`** — every table, every column, every index, with rationale
5. **`docs/04-AUTH_AND_ROLES.md`** — four role classes, three token namespaces, one set of rules
6. **`docs/06-THEMING.md`** — how per-bakery branding works without forking code
7. **`docs/07-PAYMENTS.md`** — MoMo, Airtel Money, COD, bank transfer — all per-bakery
8. Then skim the rest of `docs/` as needed

Once you understand the architecture, work through `prompts/` starting at `00-build-order.md`.

---

## The context pack, folder by folder

### `docs/` — reference specifications
Stable, authoritative descriptions of what the system is. If an implementation contradicts these docs, either the implementation is wrong or the doc needs updating via a decision logged in `docs/17-DECISIONS_LOG.md`. No guessing.

### `instructions/` — rules the AI must follow
Rules that apply to **every** code change, regardless of task. Multi-tenancy safety, security, testing, style, commit format. These are read by every AI tool on every run via `CLAUDE.md`, `.cursor/rules/`, and `.github/copilot-instructions.md`, which all point to this folder as the source of truth.

### `prompts/` — sequenced build prompts
One prompt per deliverable slice, numbered in dependency order. Copy a prompt, paste it into your AI tool, let it execute, review, commit. Each prompt assumes its predecessors are done.

### `workflows/` — how the team works
Git workflow, dev workflow, release process, incident response. Human-facing; the AI references these only when asked to set up CI or draft a PR.

### `context/` — background material
The *why* behind decisions. Stakeholders, target users, competitive landscape, tech-stack rationale, notes from the HAIQ reference implementation. Read once, reference rarely.

### Root files
- `CLAUDE.md` — Claude Code entry point; points Claude at the instruction set
- `.cursor/rules/` — Cursor rule files, same substance, Cursor format
- `.github/copilot-instructions.md` — GitHub Copilot instructions, same substance
- `.gitignore` — what not to commit
- `.env.example` — every environment variable used across every app, with notes
- `install.ps1` — Windows PowerShell extractor, targets `D:\Junior Reactive Projects\eatgooduganda`

---

## Quickstart (once code exists)

```powershell
# From the extracted context pack, after Prompt 01 has been run
cd "D:\Junior Reactive Projects\eatgooduganda"
pnpm install
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, Cloudinary, Resend, etc.
pnpm -w run migrate
pnpm -w run dev    # Starts all four apps + the API in parallel
```

Default local ports:
- `http://localhost:5173` — customer storefront
- `http://localhost:5174` — bakery admin
- `http://localhost:5175` — super admin
- `http://localhost:4000` — API (Swagger UI at `/api-docs`)

---

## The one rule that overrides all others

**Every database query that touches a tenant-scoped table MUST filter by `bakery_id`.** Every API handler that serves tenant data MUST verify the caller's session is authorised for that `bakery_id`. A leak across tenants is the one bug that kills the platform. Read `docs/03-MULTI_TENANCY.md` before writing any query, endpoint, or test that crosses the tenant boundary.

---

## Reference implementation

The architectural inspiration is **HAIQ** (`https://github.com/Junior-Reactive-Solutions/HAIQ_web`) — a single-tenant cookie e-commerce platform built on the same stack (React/Vite + Node/Express + Postgres/Neon + Cloudinary + Render/Vercel). Eat Good Uganda lifts that architecture to multi-tenant. See `context/reference-haiq.md` for what we're keeping, what we're changing, and why.

---

## Project ownership

**Junior Reactive Solutions** — platform operator. The super-admin app is ours. Each bakery onboarded to the platform is an independent business with its own account, data, and staff.

---

_Last updated: scaffolding stage._
