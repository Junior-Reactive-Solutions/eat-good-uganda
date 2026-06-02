# Phase 4 GitHub Setup Guide

**Status:** Ready for team setup  
**Reference:** `docs/PHASE_4_PLAN.md`

---

## 🎯 GitHub Milestone

**Create via:** GitHub UI → Issues → Milestones → New milestone

```
Title: Phase 4 - Advanced Admin Features
Description: Bakery staff management, audit logging, and customer user management for super admin dashboard
Due Date: July 31, 2026
```

---

## 📋 GitHub Issues to Create

Create 9 issues following this pattern. Link them all to the Phase 4 milestone.

### Issue #1: Task 1 - Bakery Staff Database Queries
```
Title: [Phase 4] Task 1: Bakery Staff Database Queries
Labels: type/feature, area/database, priority/high, status/needs-design
Milestone: Phase 4 - Advanced Admin Features
Assignee: (dev-team)
Description:

Implement 6 bakery staff management database functions:
- listBakeryStaff() with pagination
- getBakeryStaffMember()
- createBakeryStaff()
- updateBakeryStaff()
- removeBakeryStaff()
- getBakeryStaffByEmail()

Deliverables:
- [ ] 6 functions in packages/db/src/queries/staff.ts
- [ ] 15+ tests in packages/db/src/queries/__tests__/staff.test.ts
- [ ] Exports added to packages/db/src/index.ts
- [ ] Multi-tenant isolation verified
- [ ] Cross-bakery tests included

See: docs/PHASE_4_PLAN.md#task-1-bakery-staff-database-queries
```

### Issue #2: Task 2 - Audit Logging Database Queries
```
Title: [Phase 4] Task 2: Audit Logging Database Queries
Labels: type/feature, area/database, priority/high
Milestone: Phase 4 - Advanced Admin Features
Assignee: (dev-team)
Description:

Implement 5 audit logging functions:
- logAuditEvent()
- listAuditLogs()
- getAuditLog()
- listAdminActivitySummary()
- getResourceChangeHistory()

Deliverables:
- [ ] 5 functions in packages/db/src/queries/audit.ts
- [ ] 12+ tests
- [ ] Proper timestamp handling (UTC)
- [ ] Activity tracking and filtering

See: docs/PHASE_4_PLAN.md#task-2-audit-logging-database-queries
```

### Issue #3: Task 3 - Customer User Management Queries
```
Title: [Phase 4] Task 3: Customer User Management Database Queries
Labels: type/feature, area/database, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 6 customer management functions:
- listAllCustomers()
- getCustomerDetail()
- banCustomer()
- unbanCustomer()
- listCustomerOrders()
- getCustomerFraudFlags()

Deliverables:
- [ ] 6 functions in packages/db/src/queries/customers.ts
- [ ] 14+ tests
- [ ] Fraud flag calculation
- [ ] Customer banning workflow

See: docs/PHASE_4_PLAN.md#task-3-customer-user-management-database-queries
```

### Issue #4: Task 4 - Staff Management API Routes
```
Title: [Phase 4] Task 4: Staff Management API Routes
Labels: type/feature, area/backend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 5 staff management endpoints:
- GET /v1/admin/bakeries/:bakeryId/staff
- GET /v1/admin/bakeries/:bakeryId/staff/:staffId
- POST /v1/admin/bakeries/:bakeryId/staff
- PATCH /v1/admin/bakeries/:bakeryId/staff/:staffId
- DELETE /v1/admin/bakeries/:bakeryId/staff/:staffId

Deliverables:
- [ ] 5 endpoints in apps/api/src/routes/admin/staff.ts
- [ ] 20+ integration tests
- [ ] Zod validation for all inputs
- [ ] Proper error handling (400, 401, 404, 500)
- [ ] Last owner protection

See: docs/PHASE_4_PLAN.md#task-4-admin-api-routes-staff-management
```

### Issue #5: Task 5 - Audit Logging API Routes
```
Title: [Phase 4] Task 5: Audit Logging API Routes
Labels: type/feature, area/backend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 4 audit logging endpoints:
- GET /v1/admin/audit-logs
- GET /v1/admin/audit-logs/:logId
- GET /v1/admin/bakeries/:bakeryId/audit-logs
- GET /v1/admin/activity-summary

Deliverables:
- [ ] 4 endpoints in apps/api/src/routes/admin/audit.ts
- [ ] 18+ integration tests
- [ ] Comprehensive filtering and pagination
- [ ] Activity summary calculation
- [ ] Date range filtering

See: docs/PHASE_4_PLAN.md#task-5-admin-api-routes-audit-logging
```

### Issue #6: Task 6 - Customer Management API Routes
```
Title: [Phase 4] Task 6: Customer Management API Routes
Labels: type/feature, area/backend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 6 customer management endpoints:
- GET /v1/admin/customers
- GET /v1/admin/customers/:customerId
- POST /v1/admin/customers/:customerId/ban
- POST /v1/admin/customers/:customerId/unban
- GET /v1/admin/customers/:customerId/orders
- GET /v1/admin/customers/:customerId/fraud-flags

Deliverables:
- [ ] 6 endpoints in apps/api/src/routes/admin/customers.ts
- [ ] 20+ integration tests
- [ ] Ban/unban workflow
- [ ] Fraud flag calculation
- [ ] Order history retrieval

See: docs/PHASE_4_PLAN.md#task-6-admin-api-routes-customer-management
```

### Issue #7: Task 7 - React Query Hooks
```
Title: [Phase 4] Task 7: React Query Hooks for Admin Features
Labels: type/feature, area/frontend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 11 React Query hooks:

Staff:
- useStaffList()
- useStaffDetail()
- useCreateStaff()
- useUpdateStaff()
- useRemoveStaff()

Audit:
- useAuditLogs()
- useAuditDetail()
- useActivitySummary()

Customers:
- useCustomerList()
- useCustomerDetail()
- useBanCustomer()
- useUnbanCustomer()
- useCustomerOrders()
- useCustomerFraudFlags()

Deliverables:
- [ ] 11 hooks in apps/super-admin/src/features/admin/api.ts
- [ ] 30+ tests with cache behavior validation
- [ ] Proper error handling
- [ ] Cache invalidation on mutations

See: docs/PHASE_4_PLAN.md#task-7-react-query-hooks-for-admin-features
```

### Issue #8: Task 8 - UI Components & Pages
```
Title: [Phase 4] Task 8: UI Components & Pages
Labels: type/feature, area/frontend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Implement 11 UI components and 3 pages:

Staff Components (4):
- StaffCard.tsx
- StaffForm.tsx
- StaffTable.tsx
- StaffDialog.tsx

Audit Components (3):
- AuditLogEntry.tsx
- AuditLogTable.tsx
- ActivitySummary.tsx

Customer Components (4):
- CustomerCard.tsx
- CustomerDetail.tsx
- CustomerBanDialog.tsx
- FraudFlags.tsx

Pages (3):
- StaffPage.tsx
- AuditLogsPage.tsx
- CustomersPage.tsx

Deliverables:
- [ ] 11 components + 3 pages (17 total)
- [ ] 40+ component tests
- [ ] Full accessibility (WCAG 2.1 AA)
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Loading and error states

See: docs/PHASE_4_PLAN.md#task-8-ui-components--pages
```

### Issue #9: Task 9 - Router Integration & Final Assembly
```
Title: [Phase 4] Task 9: Router Integration & Final Assembly
Labels: type/feature, area/frontend, priority/high
Milestone: Phase 4 - Advanced Admin Features
Description:

Integrate all components and pages into the router:

Routes to add:
- /staff/:bakeryId
- /audit-logs
- /customers

Sidebar updates:
- Add "Staff Management" link
- Add "Audit Logs" link
- Add "Customers" link

Deliverables:
- [ ] 3 routes added to apps/super-admin/src/router.tsx
- [ ] Sidebar navigation updated
- [ ] 10+ router integration tests
- [ ] Route guards working
- [ ] Lazy loading configured

See: docs/PHASE_4_PLAN.md#task-9-router-integration--final-assembly
```

---

## 🏷️ Labels to Use

Ensure these labels exist (auto-created by labeler.yml):
- `type/feature` — Feature implementation
- `area/backend` — API/server work
- `area/frontend` — UI/component work
- `area/database` — Database layer work
- `priority/high` — High priority
- `status/needs-design` — Needs design review
- `knowledge/architecture` — Requires system design knowledge

---

## 📊 GitHub Project Board

**Create via:** GitHub UI → Projects → New project

```
Title: Phase 4 - Advanced Admin Features
Type: Table
Columns:
  - Status (None, Todo, In Progress, Review, Done)
  - Priority (Low, Medium, High)
  - Type (Database, API, Hooks, UI, Integration)
```

**Add all 9 Phase 4 issues to the board**

---

## 🔄 Workflow for Phase 4

1. **Create GitHub Issues** (above)
2. **Add to Project Board** (drag issues into Todo column)
3. **Move to In Progress** when starting a task
4. **Move to Review** when PR created
5. **Move to Done** when PR merged

---

## 🌳 Branching Strategy

**Create feature branches for Phase 4 work:**

```bash
# For database work
git checkout -b feature/phase-4-staff-management

# For API work
git checkout -b feature/phase-4-admin-routes

# For frontend work
git checkout -b feature/phase-4-admin-ui
```

**Naming convention:** `feature/phase-4-{task-area}`

---

## ✅ Setup Checklist

- [ ] Create Phase 4 Milestone in GitHub
- [ ] Create 9 GitHub Issues (link to this file)
- [ ] Add labels to each issue
- [ ] Create GitHub Project board
- [ ] Add all issues to project
- [ ] Set up branch protection on master (if not done)
- [ ] Notify team of Phase 4 work ready

---

## 📝 Notes

- All issues link to `docs/PHASE_4_PLAN.md` for complete specifications
- Milestones help track deadline (July 31, 2026)
- Project board provides visual progress tracking
- Labels enable filtering by area and type
- Issues enable discussion and collaboration

---

**Next Step:** Start implementation with Task 1 (Database Queries)
