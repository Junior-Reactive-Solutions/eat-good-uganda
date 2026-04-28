# PROMPT_EXECUTION_ORDER.md

> Guide for AI agents executing the build prompts in correct order with understood dependencies.

## Execution Flow

The build is a **linear pipeline** — each prompt builds on the previous one. Never skip or reorder prompts unless explicitly noted.

## The 22-Step Execution Order

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: INFRASTRUCTURE FOUNDATION                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  01 → 02 → 03                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: CORE BACKEND                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  04 → 17 → 18                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: CUSTOMER FRONTEND                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  05 → 06 → 07 → 08 → 14 → 15                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: ADMIN FRONTENDS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  09 → 10                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: PAYMENTS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  11 → 12 → 13                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 6: INTEGRATIONS                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  16                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 7: QUALITY & SHIP                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  19 → 20 → 21 → 22                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Prompt Dependencies

### Phase 1: Infrastructure Foundation

| Prompt | Depends On | Why |
|--------|------------|-----|
| **01-initial-setup** | None | Creates monorepo, workspaces, configs — the foundation |
| **02-database** | 01 | Migrations need workspace structure to exist |
| **03-auth-system** | 02 | Auth needs database tables (users, sessions, tokens) |

### Phase 2: Core Backend

| Prompt | Depends On | Why |
|--------|------------|-----|
| **04-bakery-onboarding** | 03 | Needs auth system for bakery user registration |
| **17-swagger-ui** | 03 | Needs routes to document; can be done anytime after 03 |
| **18-keepalive-cronjob** | 02 | Health endpoint doesn't need auth, but runs on API |

### Phase 3: Customer Frontend

| Prompt | Depends On | Why |
|--------|------------|-----|
| **05-customer-skeleton** | 01 | Needs Vite app structure; can start early |
| **06-landing-page** | 05 | Needs router and layout |
| **07-bakery-menu-pages** | 06 | Builds on landing page structure |
| **08-cart-checkout** | 07 | Needs products to add to cart |
| **14-geolocation** | 06 | Adds sorting to bakery list |
| **15-theming** | 07 | Needs bakery pages to theme |

### Phase 4: Admin Frontends

| Prompt | Depends On | Why |
|--------|------------|-----|
| **09-bakery-admin** | 03, 04 | Needs auth + approved bakeries to manage |
| **10-super-admin** | 03, 04 | Needs auth + bakeries to approve |

### Phase 5: Payments

| Prompt | Depends On | Why |
|--------|------------|-----|
| **11-mtn-momo** | 08, 09 | Needs checkout flow + bakery admin to configure |
| **12-airtel-money** | 11 | Builds on MoMo pattern |
| **13-bank-cod** | 11 | Same payment infrastructure |

### Phase 6: Integrations

| Prompt | Depends On | Why |
|--------|------------|-----|
| **16-email-flows** | 03, 08 | Needs auth + orders to send notifications about |

### Phase 7: Quality & Ship

| Prompt | Depends On | Why |
|--------|------------|-----|
| **19-testing-setup** | All prior | Tests everything built so far |
| **20-ci-cd** | 19 | CI runs the tests |
| **21-deployment** | 20 | Deploys what CI validates |
| **22-accessibility** | All prior | Final polish on complete system |

## Safe Execution Rules

### Golden Rules

1. **Never execute prompt N before N-1 is complete and merged**
   - Each prompt assumes previous work exists
   - Skipping breaks imports, types, and assumptions

2. **Never combine prompts in a single PR**
   - Each prompt = one branch = one PR
   - Reviewers need focused diffs

3. **Always run checks before committing**
   ```bash
   pnpm -w typecheck && pnpm -w lint && pnpm -w test
   ```

4. **If a prompt contradicts a doc, the doc wins**
   - Flag the contradiction
   - Fix the prompt after merging

### Parallelization Opportunities

Some prompts can run in parallel if working with multiple AI agents:

- **17-swagger-ui** can run concurrently with any phase 2+ prompt (documents existing routes)
- **18-keepalive-cronjob** can run after 02 (API exists, doesn't need auth)

### What Breaks If You Skip

| If You Skip | What Breaks |
|-------------|-------------|
| 01 | No workspace to install anything |
| 02 | No database tables for users, orders, products |
| 03 | No authentication — nothing is secured |
| 04 | No way for bakeries to join the platform |
| 05-10 | No user-facing applications |
| 11-13 | No way to take money |
| 19-20 | No quality gates |
| 21 | No production deployment |

## Quick Reference

```bash
# Execute prompts in order
# After completing each:
pnpm -w typecheck && pnpm -w lint && pnpm -w test
# Commit with conventional format
git add . && git commit -m "feat(prompt-N): description"
```

## Summary

- **22 prompts** in **7 phases**
- **Linear dependency chain** — complete before moving on
- **One prompt per PR** — focused reviews, clean history
- **Checks before commit** — never break the build

> When in doubt, follow the order. The prompts were designed to build on each other intentionally.