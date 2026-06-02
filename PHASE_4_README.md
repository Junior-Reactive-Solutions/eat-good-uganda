# Phase 4: Advanced Admin Features — Complete Implementation Guide

**Status:** 🚀 Ready for implementation  
**Estimated Duration:** 4-6 weeks  
**Team:** Junior-Reactive-Solutions/dev-team  
**Created:** June 2, 2026

---

## 📋 Overview

Phase 4 implements three critical systems for the super admin dashboard:

1. **Bakery Staff Management** — Add/remove/manage staff for each bakery
2. **Comprehensive Audit Logging** — Track all admin actions with full change history
3. **Customer User Management** — Ban/unban users, monitor fraud, view customer details

---

## 🎯 What Gets Built

### Staff Management System
- Invite staff to bakery
- Assign roles (owner, manager, staff)
- Track staff activity and last login
- Remove staff safely (can't remove last owner)
- Cross-bakery isolation

### Audit Logging System
- Log every admin action (create, update, delete, approve, suspend)
- Track before/after changes
- Filter by admin, bakery, action, resource type
- Activity summary (top admins, common actions)
- Resource change history (what changed and who changed it)

### Customer Management System
- View all customers platform-wide
- Ban/unban users (prevent new orders)
- Track customer orders and fraud flags
- Calculate fraud risk (chargebacks, cancellations, high-value orders)
- Monitor suspicious patterns

---

## 📊 Implementation Scope

| Layer | Tasks | Deliverables | Tests |
|-------|-------|--------------|-------|
| **Database** | 3 | 17 functions, schema extensions | 41 |
| **API** | 3 | 15 endpoints, validation | 58 |
| **Frontend Hooks** | 1 | 11 hooks, cache management | 30 |
| **UI Components** | 1 | 11 components + 3 pages | 40+ |
| **Integration** | 1 | 3 routes, sidebar nav | 10+ |
| **TOTAL** | 9 | 150+ tests, 4,000+ LOC | 150+ |

---

## 🗺️ Architecture

```
┌─────────────────────────────────────┐
│     Super Admin Dashboard           │
│   (React, TypeScript, TailwindCSS)  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ Pages:                       │  │
│  │ - StaffPage                  │  │
│  │ - AuditLogsPage              │  │
│  │ - CustomersPage              │  │
│  └──────────────────────────────┘  │
└────────────┬────────────────────────┘
             │
      React Query v5
     (Cache Management)
             │
┌────────────┴────────────────────────┐
│     Express.js API Routes           │
│   (TypeScript, Zod Validation)      │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ /v1/admin/                   │  │
│  │  ├─ bakeries/:id/staff       │  │
│  │  ├─ audit-logs               │  │
│  │  └─ customers                │  │
│  └──────────────────────────────┘  │
└────────────┬────────────────────────┘
             │
      PostgreSQL Queries
    (Raw SQL, 17 functions)
             │
┌────────────┴────────────────────────┐
│   PostgreSQL 15+                    │
│   (Multi-tenant, RLS)               │
│                                      │
│  Tables:                             │
│  ├─ bakery_users (staff)             │
│  ├─ audit_logs                       │
│  └─ customers (extended)             │
└─────────────────────────────────────┘
```

---

## 📚 Documentation Structure

```
docs/
├── PHASE_4_PLAN.md ...................... Complete technical specification
│                                         (9 tasks, 150+ tests)
│
.github/
├── PHASE_4_GITHUB_SETUP.md .............. GitHub Issue templates
│                                         (9 issues, board setup)
├── BRANCH_PROTECTION.md ................ Branch protection guide
└── LABELS.md ........................... Label system documentation

PHASE_4_README.md ..................... This file
```

---

## 🚀 Getting Started

### 1. **Read the Specification**
Start with [`docs/PHASE_4_PLAN.md`](docs/PHASE_4_PLAN.md) — it has:
- Complete task breakdown
- Database schema details
- API endpoint specifications
- Component requirements
- Test expectations

### 2. **Create GitHub Issues**
Follow `.github/PHASE_4_GITHUB_SETUP.md`:
- Create 9 GitHub Issues (one per task)
- Link to Phase 4 Milestone
- Add appropriate labels
- Create Project board for visibility

### 3. **Set Up Branching**
For Phase 4 work:
```bash
# Create feature branches (one per area)
git checkout -b feature/phase-4-staff-management
git checkout -b feature/phase-4-admin-routes
git checkout -b feature/phase-4-admin-ui
```

### 4. **Start Implementation**
Follow task order:
1. **Tasks 1-3:** Database layer (queries)
2. **Tasks 4-6:** API routes
3. **Task 7:** React Query hooks
4. **Task 8:** UI components & pages
5. **Task 9:** Router integration

---

## 🎯 Implementation Approach

### **Per-Task Workflow**

```
1. Read spec in docs/PHASE_4_PLAN.md
   ↓
2. Create GitHub Issue (if not done)
   ↓
3. Create feature branch
   ↓
4. TDD: Write test first (must fail)
   ↓
5. Implement minimal code (test passes)
   ↓
6. Run full test suite locally:
   - pnpm -w test
   - pnpm -w typecheck
   - pnpm -w lint
   ↓
7. Commit with proper message:
   - feat(scope): description
   - fix: address feedback
   ↓
8. Create Pull Request:
   - Link GitHub Issue
   - Describe what changed
   - Add test results
   ↓
9. Address code review feedback
   ↓
10. Merge when approved & checks pass
```

---

## ✅ Quality Standards (Non-Negotiable)

### Code Quality
- ✅ **TypeScript strict mode** — No `any`, proper typing
- ✅ **ESLint passing** — 0 errors on all files
- ✅ **Tests required** — TDD approach mandatory
- ✅ **Multi-tenant isolation** — Always filter by `bakery_id`
- ✅ **No hardcoded data** — Use environment variables

### Testing Requirements
- ✅ **Unit tests** — For all functions
- ✅ **Integration tests** — For API endpoints
- ✅ **Cross-tenant tests** — Verify isolation
- ✅ **Error cases** — 400, 401, 404, 500 errors
- ✅ **Edge cases** — Null values, empty results, etc.

### Security Standards
- ✅ **Input validation** — Zod schemas on all endpoints
- ✅ **Auth required** — Super admin only
- ✅ **No SQL injection** — Parameterized queries
- ✅ **No secrets in code** — Use environment variables
- ✅ **Proper error messages** — No sensitive data leaked

### Accessibility & UX
- ✅ **WCAG 2.1 AA** — Color contrast, keyboard nav
- ✅ **Responsive** — Mobile, tablet, desktop
- ✅ **Loading states** — Spinners, skeletons
- ✅ **Error states** — Clear error messages
- ✅ **Success feedback** — Toast notifications

---

## 📊 Success Metrics

After Phase 4 completion, you should have:

| Metric | Target | Status |
|--------|--------|--------|
| Tests Passing | 150+ | ✅ |
| TypeScript Strict | 100% | ✅ |
| ESLint Errors | 0 | ✅ |
| Code Coverage | 100% critical paths | ✅ |
| API Endpoints | 15 | ✅ |
| Database Functions | 17 | ✅ |
| UI Components | 11 | ✅ |
| Pages | 3 | ✅ |
| Multi-tenant isolation | Verified | ✅ |

---

## 🤝 Collaboration Features

This phase maximizes GitHub features:

### Issues & Project Board
- **9 GitHub Issues** — One per task, linked to milestone
- **GitHub Project** — Visual progress tracking (Todo → In Progress → Review → Done)
- **Labels** — Automatic labeling by area (backend, frontend, database)
- **Milestone** — Phase 4 deadline tracking

### Code Review
- **CODEOWNERS** — Team assignment for review
- **Status Checks** — Tests, typecheck, lint required
- **Branch Protection** — PR reviews required before merge
- **Conversation Resolution** — Comments must be addressed

### Visibility
- **CI/CD** — Automated testing on every commit
- **Security Scanning** — Trivy + npm audit on every push
- **Commit History** — Clear messages with issue references
- **Release Tags** — Semantic versioning for releases

---

## 📞 Communication & Help

**Questions during implementation?**
- 📖 Read the detailed specification in `docs/PHASE_4_PLAN.md`
- 🐛 Create a GitHub Issue with the `help-wanted` label
- 💬 Start a GitHub Discussion for open questions
- 📝 Check existing Issues for similar problems

**When stuck:**
1. Check if there's a test for this behavior
2. Run `pnpm -w test` to see what's failing
3. Look at similar implementations (Task 1 example, etc.)
4. Ask in a GitHub Issue (reference the spec)

---

## 🎓 Learning Resources

**Multi-tenant isolation:**
- `docs/03-MULTI_TENANCY.md` — The most important constraint

**Database queries:**
- `packages/db/src/queries/*.ts` — Existing patterns to follow

**API routes:**
- `apps/api/src/routes/bakery/*.ts` — Working examples with auth

**React hooks:**
- `apps/super-admin/src/features/analytics/api.ts` — Current hooks pattern

**Components:**
- `apps/super-admin/src/components/charts/*.tsx` — Component patterns

---

## 🔄 Definition of Done

A task is complete when:

- ✅ All code is written and tested
- ✅ All tests pass (150+ total)
- ✅ TypeScript strict mode passes
- ✅ ESLint passes (0 errors)
- ✅ Code review approved
- ✅ Merged to `master`
- ✅ GitHub Issue closed
- ✅ Project board updated to "Done"

---

## 📈 Expected Timeline

- **Week 1-2:** Database layer (Tasks 1-3)
- **Week 2-3:** API routes (Tasks 4-6)
- **Week 3-4:** React hooks & components (Tasks 7-8)
- **Week 4-5:** Testing and integration (Task 9)
- **Week 5-6:** Code review and refinement

*Actual timeline depends on team size and availability.*

---

## 🎯 After Phase 4

**Phase 5: Support & Utilities** includes:
- Support ticketing system
- CSV data exports
- Bulk operations

And beyond that:
- Phase 6: Customer-facing features
- Phase 7: Advanced analytics
- Phase 8: Mobile app integration

---

## 📝 Quick Checklist

Before starting Phase 4:

- [ ] Read `docs/PHASE_4_PLAN.md` completely
- [ ] Create 9 GitHub Issues from `.github/PHASE_4_GITHUB_SETUP.md`
- [ ] Create GitHub Project board with issues
- [ ] Create Phase 4 Milestone in GitHub
- [ ] Understand multi-tenant isolation requirements
- [ ] Review existing code patterns (Tasks 1-2 from Phase 3)
- [ ] Set up local environment (`pnpm install`)
- [ ] Verify tests run locally (`pnpm -w test`)
- [ ] Create feature branches for your area of focus

---

## 🚀 Ready to Start?

1. Start with **Task 1** (Database Queries for Staff)
2. Follow TDD: Write test → verify fail → implement → verify pass
3. Create PR with test results
4. Get code review approval
5. Merge to master
6. Move to Task 2

**Let's build Phase 4! 🎉**

---

**Questions?** Open a GitHub Issue or Discussion  
**Found a bug?** Create an Issue with `type/bug` label  
**Got feedback?** Update the GitHub Issue with progress

---

*Phase 4 Implementation Guide | June 2, 2026 | v1.0*
