# Eat Good Uganda — Startup Prompt for Claude

**Project:** Multi-tenant bakery commerce platform (Uganda)  
**Status:** Phase 3 Complete + Super Admin Login Fixes ✅  
**Last Updated:** 2026-06-05  

---

## 🎯 Your Mission

You are joining an active development team on **Eat Good Uganda**, a complex multi-tenant SaaS platform for bakery commerce. Your job is to:

1. **Understand the current state** — read docs in order below
2. **Pick up where we left off** — use the progress tracker as ground truth
3. **Execute next development tasks** — follow the plan, use appropriate skills
4. **Maintain quality standards** — TypeScript strict, tests, linting, multi-tenancy rules

This is **NOT** a greenfield project. You are working with live production data, deployed services, and established patterns. Respect the existing architecture.

---

## 📚 READ THESE FIRST (In This Order)

**Before writing any code, you must read:**

1. **`docs/PROGRESS_TRACKER.md`** (60 min read)
   - **THE source of truth for project state**
   - What's been done, what's broken, what's next
   - Database schema, credentials, all deployment URLs
   - Git history with detailed explanations
   - Where previous session ended ("WHERE TO START FROM" section)
   - **ACTION:** Read entire file before proceeding

2. **`instructions/00-canonical-rules.md`** (5 min read)
   - Absolute rules that override everything else
   - Multi-tenancy rules (non-negotiable)
   - Security rules (non-negotiable)
   - **ACTION:** Memorize these before touching code

3. **`docs/03-MULTI_TENANCY.md`** (10 min read)
   - How tenant isolation works
   - `bakery_id` filtering requirements
   - The model that powers this entire platform
   - **ACTION:** If you don't understand multi-tenancy, you will break the product

4. **`docs/01-ARCHITECTURE.md`** (15 min read)
   - Four applications and how they interact
   - Shared packages (`@eatgood/db`, `@eatgood/shared`)
   - Monorepo structure and tooling
   - **ACTION:** Understand the architecture before modifying anything

5. **`docs/02-DATABASE_SCHEMA.md`** (10 min read)
   - Every table and its purpose
   - Tenant discriminators for each table
   - Foreign key relationships
   - **ACTION:** Reference this when writing queries

6. **`CLAUDE.md`** (5 min read)
   - Project-specific operating instructions
   - Binding overrides for this codebase
   - **ACTION:** Follow these exactly

---

## 🏗️ Project Architecture (Quick Overview)

### Four Applications

| App | Framework | URL | Purpose |
|-----|-----------|-----|---------|
| `apps/customer` | Vite + React | https://eat-good-uganda.vercel.app | Customer storefront |
| `apps/bakery-admin` | Vite + React | https://eat-good-uganda-bakery-admin.vercel.app | Bakery owner/staff portal |
| `apps/super-admin` | Vite + React | https://eat-good-uganda-super-admin.vercel.app | Platform operator dashboard |
| `apps/api` | Node.js + Express | https://eatgooduganda-api.onrender.com | REST API (all endpoints) |

### Shared Packages

- **`packages/db`** — TypeScript queries, DB client, migrations, all Zod schemas
- **`packages/shared`** — Types and constants shared across all apps

### Deployment

| Service | Platform | Status |
|---------|----------|--------|
| Frontend (3 apps) | Vercel | Auto-deploy on push to main |
| API | Render | Auto-deploy on push to main |
| Database | Neon (PostgreSQL) | Production data, live |

### Key Technologies

- **Language:** TypeScript (strict mode everywhere)
- **Package manager:** pnpm workspaces
- **Build:** Vite (frontends), tsc (backend)
- **Testing:** Vitest
- **Linting:** ESLint + Prettier (pre-commit hooks enforced)
- **Auth:** JWT + TOTP (super admin only)
- **ORM:** Raw SQL + pg library (no ORMs)

---

## ⚠️ CRITICAL RULES (Non-Negotiable)

### Multi-Tenancy

**RULE:** Never write a query against a tenant-scoped table without a `bakery_id` filter.

- Every query that touches bakery data MUST filter by `bakery_id`
- Bakery staff can only see their own bakery's data
- Super admin sees all bakeries
- One mistake = data leak between bakeries

### Security

- **Never** log secrets, JWTs, PII, or payment credentials
- **Never** commit real credentials to git (use `.env` for secrets)
- **Never** put API keys in code, comments, or tests
- **Always** validate request bodies with Zod schemas
- **Always** authenticate protected endpoints

### Code Quality

- **Never** disable tests, linting, or type checks to make something "work"
- **Never** skip pre-commit hooks (they enforce quality)
- **Never** commit to `main` directly (branch, test, PR)
- **Always** write TypeScript, not JavaScript
- **Always** create new commits, never amend (unless explicitly told)

---

## 🛠️ Recommended Skills for Different Tasks

**Use these Anthropic skills based on what you're doing:**

| Task | Skill | Why |
|------|-------|-----|
| Planning multi-step feature | `anthropic-skills:writing-plans` | Creates detailed task breakdown |
| Executing a plan | `anthropic-skills:subagent-driven-development` | Delegates tasks to specialized agents |
| Fixing a bug | `anthropic-skills:systematic-debugging` | Methodical root cause analysis |
| Testing a change | `anthropic-skills:verify` | Run app and confirm behavior |
| Code review | `anthropic-skills:code-review-excellence` | Catch bugs before commit |
| Finalizing work | `anthropic-skills:finishing-a-development-branch` | Merge/PR/cleanup options |
| Setting up work | `anthropic-skills:using-git-worktrees` | Isolated workspace for feature branch |

---

## 📖 Common Patterns in This Codebase

### Database Queries

**Pattern:** Functions in `packages/db/src/queries/`, each handles one entity

```typescript
// Example: get bakery by ID with tenant isolation
export async function getBakeryById(db: Database, bakeryId: string) {
  return db.query(
    'SELECT * FROM bakeries WHERE id = $1 AND deleted_at IS NULL',
    [bakeryId]
  )
}

// ✅ Good: Filters by bakery_id for tenant-scoped data
// ❌ Bad: Ever querying without bakery_id filter on tenant tables
```

### API Routes

**Pattern:** Routes in `apps/api/src/routes/`, organized by context (admin, bakery, customer)

```typescript
// Middleware chain for protected endpoints
app.post(
  '/v1/admin/bakeries/:id/approve',
  authenticateToken('super_admin'),    // Verify JWT
  requireSuperAdminContext,            // Verify role
  validateBody(approveSchema),         // Validate input
  async (req, res) => {
    // Handler code
  }
)
```

### React Components

**Pattern:** Features in `features/`, components in `components/`, hooks in custom hooks

```typescript
// React Query hooks for data fetching
const { data, isLoading, error } = useBakeries({
  page: 1,
  status: 'active',
})

// Mutations with optimistic updates
const { mutate, isPending } = useApproveBakery()
```

### Testing

**Pattern:** Test files alongside source, `.test.ts` or `__tests__/` subdirectory

```typescript
// Vitest for everything
it('should only show baker its own bakery data', async () => {
  const result = await getBakeryById(testDb, 'bakery-1')
  expect(result.id).toBe('bakery-1')
  expect(result.bakery_id).toBe('bakery-1')
})
```

---

## 🚀 How to Continue Development

### Step 1: Understand Current State (First Thing Always)

1. Open `docs/PROGRESS_TRACKER.md`
2. Jump to section **"17. WHERE TO START FROM"**
3. Read "What You Have Right Now" — know what's done
4. Read "What Was Just Fixed" — know what changed
5. Read "How to Continue From Here" — know your options

### Step 2: Pick Your Task

**Option A: Verify Current State Works**
- Test TOTP login at https://eat-good-uganda-super-admin.vercel.app
- Check buttons are visible and styled correctly
- Verify all 3 bakeries appear
- Check storefront and bakery admin apps
- See "Immediate Next: Verification & Visual Inspection" in progress tracker

**Option B: Start Next Development Work**
- Read "After Verification: Remaining Development Work" in progress tracker
- Common next items: order flow, email system, payment webhooks, customer profiles
- Pick one area, use `writing-plans` skill to create detailed task breakdown
- Use `subagent-driven-development` to execute the plan

### Step 3: Follow the Development Flow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Write a plan (if multi-step work)
3. Implement following code patterns above
4. Test: `pnpm -w test` (run all tests)
5. Type check: `pnpm -w typecheck` (must pass)
6. Lint: `pnpm -w lint` (must pass, pre-commit hooks enforce this)
7. Commit with proper message: follow `instructions/08-commit-and-pr-rules.md`
8. Push and create PR

### Step 4: Respect Deployment Pipeline

- **Vercel:** Auto-deploys on push to main
- **Render:** Auto-deploys API on push to main
- **Database:** Live production data — backups exist but bugs are risky
- **Never push breaking changes to main** — test on branch first

---

## 🔑 Essential Credentials & URLs

### Testing Accounts

| Role | Email | Password | Extra | URL |
|------|-------|----------|-------|-----|
| Super Admin | `admin@eatgooduganda.com` | `eatgood123` | TOTP required | https://eat-good-uganda-super-admin.vercel.app |
| Bakery 1 | `owner@kampalacrust.ug` | `KampalaCrust!2026` | — | https://eat-good-uganda-bakery-admin.vercel.app |
| Bakery 2 | `owner@goldenwhisk.ug` | `GoldenWhisk!2026` | — | https://eat-good-uganda-bakery-admin.vercel.app |
| Bakery 3 | `owner@maisonlea.ug` | `MaisonLea!2026` | — | https://eat-good-uganda-bakery-admin.vercel.app |

### API & Services

| Service | URL | Status |
|---------|-----|--------|
| API | https://eatgooduganda-api.onrender.com | Production |
| Neon Database | neondb.c-7.us-east-1.aws.neon.tech | Production (live data) |

---

## 🐛 Troubleshooting Guide

### If TOTP Login Fails

1. Check browser console for `[AUTH]` debug logs
2. Look for `TOTP Verification Result: { verified: true/false }`
3. If false, authenticator secret might not match database
4. If needed, regenerate: `npx tsx apps/api/src/scripts/regenerate-totp.ts`

### If Buttons Not Visible

1. Ensure Tailwind config has platform colors: `apps/super-admin/tailwind.config.js`
2. If just deployed, rebuild: `pnpm -w build`
3. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
4. Check color value: should be `#c97c2d`, not original `#8b4513`

### If Tests Fail

1. Run: `pnpm -w test` to see all failures
2. Check if it's a missing `DATABASE_URL` (tests need it)
3. Run: `pnpm -w lint` to check for linting issues
4. Run: `pnpm -w typecheck` to check for type errors
5. Pre-commit hooks won't let you commit if any of these fail

### If TypeScript Errors on Build

1. Common: workspace package resolution issues
2. Solution: Check `package.json` exports in `@eatgood/shared` and `@eatgood/db`
3. Run: `pnpm install` to ensure workspace packages are linked
4. Check `tsconfig.json` extends are correct

### If Render Deploy Fails

1. Check build logs on Render dashboard
2. Common: `src/scripts/**` files being imported by main build (should be excluded)
3. Check: `apps/api/tsconfig.json` has `"src/scripts/**"` in exclude list
4. Verify: `.env` variables are set in Render project settings

---

## 📋 Quick Checklist Before Starting Work

- [ ] Read `docs/PROGRESS_TRACKER.md` entirely
- [ ] Read `instructions/00-canonical-rules.md`
- [ ] Understand multi-tenancy rules from `docs/03-MULTI_TENANCY.md`
- [ ] Know where previous session ended (section 17 of progress tracker)
- [ ] Understand which task to work on (verification vs. new feature)
- [ ] Installed pnpm and dependencies: `pnpm install`
- [ ] Can run tests: `pnpm -w test`
- [ ] Can type-check: `pnpm -w typecheck`
- [ ] Can lint: `pnpm -w lint`
- [ ] Have `.env` file with `DATABASE_URL` if running scripts

---

## 📞 When to Ask Questions

**Before assuming, ask:**
- "Is this multi-tenant data? Does it need bakery_id filtering?"
- "Should this be a new feature or a fix to existing code?"
- "What's the expected outcome of this change?"
- "Are there tests I should write for this?"
- "Should I create a branch or work on main?"

**Don't assume you know — ask the user or refer to the progress tracker.**

---

## 🎓 Project Success Criteria

This project is **successful** when:

- ✅ All 3 bakeries visible in customer app with correct products
- ✅ Super admin can manage bakeries, approve, suspend, view analytics
- ✅ Each bakery staff sees only their own data (multi-tenancy works)
- ✅ Payments integrate with MTN MoMo / Airtel Money / Bank / COD
- ✅ Emails send verification and order confirmations
- ✅ All 3 apps live on Vercel, API on Render, database on Neon
- ✅ Zero production incidents from tenant data leaks or auth issues

**Your job:** Keep it secure, keep it multi-tenant safe, keep it tested.

---

## 💡 Final Notes

1. **This is production code with live data.** Treat it accordingly.
2. **Multi-tenancy is non-negotiable.** One mistake = major security issue.
3. **Tests and linting are enforced.** Pre-commit hooks won't let bad code through.
4. **The progress tracker is your GPS.** When in doubt, check section 17.
5. **Ask questions before guessing.** The user will answer.
6. **Git commits should tell a story.** Make them clear and meaningful.

---

**Ready to start? Go to section "17. WHERE TO START FROM" in `docs/PROGRESS_TRACKER.md` and begin.**

Good luck! 🚀
