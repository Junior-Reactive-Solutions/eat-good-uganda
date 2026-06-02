# Phase 4 — Next Steps: Tasks 4-9

**Created:** June 2, 2026  
**Branch:** `feature/phase-4-staff-management`  
**Status:** 📋 Planned — ready to execute  
**Prerequisites:** Tasks 1-3 (database layer) ✅ complete

---

## How to Pick Up from Here

1. Open the worktree: `cd .claude/worktrees/cranky-ishizaka-128fe1` (or any active worktree on `feature/phase-4-staff-management`)
2. Verify DB layer is solid: `pnpm -w test` should show 49+ tests passing in `packages/db`
3. Start with **Task 4** — it is the natural next step

---

## Task 4: Staff Management API Routes

**Priority:** HIGH — unblocks Task 7 (hooks) and Task 8 (UI)

### Files to Create / Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/routes/admin/staff.ts` |
| CREATE | `apps/api/src/routes/admin/__tests__/staff.test.ts` |
| MODIFY | `apps/api/src/app.ts` — register routes |

### Endpoints to Implement

```
GET    /v1/admin/bakeries/:bakeryId/staff
       → listBakeryStaff(db, bakeryId, { limit, offset, role })
       → Response: { staff: BakeryUser[], total, page, pageSize }

GET    /v1/admin/bakeries/:bakeryId/staff/:staffId
       → getBakeryStaffMember(db, bakeryId, staffId)
       → Response: BakeryUser | 404

POST   /v1/admin/bakeries/:bakeryId/staff
       → createBakeryStaff(db, bakeryId, input)
       → Body: { email, full_name, phone?, role }
       → Response: 201 BakeryUser | 409 email conflict

PATCH  /v1/admin/bakeries/:bakeryId/staff/:staffId
       → updateBakeryStaff(db, bakeryId, staffId, updates)
       → Body: { full_name?, phone?, role? }
       → Response: BakeryUser | 404

DELETE /v1/admin/bakeries/:bakeryId/staff/:staffId
       → removeBakeryStaff(db, bakeryId, staffId)
       → Response: 200 | 409 if last owner | 404
```

### Middleware Stack for All Routes

```typescript
router.use(authenticateToken('super_admin'))
router.use(requireSuperAdminContext)
```

### Zod Schemas (define in `packages/shared/src/schemas/admin.ts`)

```typescript
const createStaffSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).nullable().optional(),
  role: z.enum(['owner', 'manager', 'staff']),
})

const updateStaffSchema = createStaffSchema.partial().omit({ email: true })

const staffListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  role: z.enum(['owner', 'manager', 'staff']).optional(),
})
```

### Audit Log Integration

Every write route must call `createAuditLog` after the DB write:

```typescript
await createAuditLog(db, {
  adminId: req.superAdmin.id,
  action: 'CREATE_STAFF',
  bakeryId,
  resourceType: 'bakery_user',
  resourceId: newStaff.id,
  changes: { after: newStaff },
})
```

### Tests to Write (~15 tests)

- `GET /staff` — returns paginated list, respects role filter
- `GET /staff` — unauthorized without token (401)
- `GET /staff/:id` — returns 404 if staff not in this bakery (isolation)
- `POST /staff` — creates staff, returns 201
- `POST /staff` — returns 409 on duplicate email
- `POST /staff` — validates body schema (400 on invalid role)
- `PATCH /staff/:id` — updates fields
- `DELETE /staff/:id` — returns 409 if last owner
- `DELETE /staff/:id` — returns 404 for wrong bakery

---

## Task 5: Audit Logs API Routes

### Files to Create / Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/routes/admin/audit-logs.ts` |
| CREATE | `apps/api/src/routes/admin/__tests__/audit-logs.test.ts` |
| MODIFY | `apps/api/src/app.ts` |

### Endpoints to Implement

```
GET  /v1/admin/audit-logs
     → getAuditLogs(db, filters)
     → Query: adminId?, bakeryId?, action?, resourceType?, startDate?, endDate?, page, pageSize
     → Response: { logs: AuditLog[], total, page, pageSize }

GET  /v1/admin/audit-logs/:logId
     → getAuditLog(db, logId)
     → Response: AuditLog | 404

GET  /v1/admin/admins/:adminId/activity
     → listAdminActivitySummary(db, adminId, bakeryId?, daysBack?)
     → Query: bakeryId?, daysBack? (default 7)
     → Response: { adminId, totalActions, actionsByType, actionsByResourceType, recentLogs }

GET  /v1/admin/bakeries/:bakeryId/resources/:resourceType/:resourceId/history
     → getResourceChangeHistory(db, bakeryId, resourceType, resourceId)
     → Response: AuditLog[]
```

### Zod Schemas

```typescript
const auditLogFiltersSchema = z.object({
  adminId: z.string().uuid().optional(),
  bakeryId: z.string().uuid().optional(),
  action: z.string().max(50).optional(),
  resourceType: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})
```

### Tests to Write (~10 tests)

- `GET /audit-logs` — returns all logs, no filter
- `GET /audit-logs` — filter by bakeryId works
- `GET /audit-logs` — filter by action type works
- `GET /audit-logs/:id` — 404 for unknown ID
- `GET /admins/:id/activity` — returns summary structure
- `GET /.../history` — returns logs for specific resource

---

## Task 6: Customer Management API Routes

### Files to Create / Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/routes/admin/customers.ts` |
| CREATE | `apps/api/src/routes/admin/__tests__/customers.test.ts` |
| MODIFY | `apps/api/src/app.ts` |

### Endpoints to Implement

```
GET   /v1/admin/customers
      → listAllCustomers(db, filters)
      → Query: status?, city?, created_after?, created_before?, page, pageSize

GET   /v1/admin/customers/:customerId
      → getCustomerDetail(db, customerId)
      → Response: Customer | 404

POST  /v1/admin/customers/:customerId/ban
      → banCustomer(db, customerId, reason, adminId)
      → Body: { reason: string (10-500 chars) }
      → Creates audit log entry
      → Response: 200 Customer

POST  /v1/admin/customers/:customerId/unban
      → unbanCustomer(db, customerId)
      → Response: 200 Customer

GET   /v1/admin/customers/:customerId/orders
      → listCustomerOrders(db, customerId, limit?)
      → Query: limit? (default 20, max 100)
      → Response: Array of order summaries

GET   /v1/admin/customers/:customerId/fraud-flags
      → getCustomerFraudFlags(db, customerId)
      → Response: { customer_id, risk_score, factors }
```

### Also Complete in Task 6

- Wire the `reason` and `adminId` parameters in `banCustomer` to create an audit log entry
- Implement full filter logic in `listAllCustomers` (status, city, date range)
- Wire `getCustomerFraudFlags` to query `orders` for cancellation counts

### Tests to Write (~12 tests)

- `GET /customers` — returns paginated list
- `GET /customers/:id` — 404 for unknown customer
- `POST /customers/:id/ban` — sets deleted_at, creates audit log
- `POST /customers/:id/ban` — validates reason (min 10 chars)
- `POST /customers/:id/unban` — clears deleted_at
- `GET /customers/:id/orders` — returns order list
- `GET /customers/:id/fraud-flags` — returns risk structure
- All routes — 401 without token

---

## Task 7: React Query Hooks

**File:** `apps/super-admin/src/features/admin/api.ts`

Hooks to implement (11 total):

```typescript
// Staff
useStaffList(bakeryId, params)    // listBakeryStaff
useStaffMember(bakeryId, staffId) // getBakeryStaffMember
useCreateStaff()                  // mutation
useUpdateStaff()                  // mutation
useRemoveStaff()                  // mutation

// Audit Logs
useAuditLogs(filters)             // getAuditLogs
useAdminActivity(adminId, params) // listAdminActivitySummary

// Customers
useCustomerList(filters)          // listAllCustomers
useCustomerDetail(customerId)     // getCustomerDetail
useBanCustomer()                  // mutation
useUnbanCustomer()                // mutation
```

Cache invalidation rules:
- `useCreateStaff`, `useUpdateStaff`, `useRemoveStaff` → invalidate `['staff', bakeryId]`
- `useBanCustomer`, `useUnbanCustomer` → invalidate `['customers']` and `['customer-detail', customerId]`

---

## Task 8: UI Components & Pages

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `StaffTable` | `components/StaffTable.tsx` | Paginated table of bakery staff |
| `StaffRoleBadge` | `components/StaffRoleBadge.tsx` | Owner/Manager/Staff color badge |
| `AddStaffModal` | `components/AddStaffModal.tsx` | Create staff form in modal |
| `AuditLogTable` | `components/AuditLogTable.tsx` | Filterable audit log view |
| `AuditLogFilters` | `components/AuditLogFilters.tsx` | Filter sidebar/bar |
| `CustomerTable` | `components/CustomerTable.tsx` | Paginated customer list |
| `CustomerStatusBadge` | `components/CustomerStatusBadge.tsx` | Active/Banned badge |
| `BanCustomerModal` | `components/BanCustomerModal.tsx` | Ban with reason form |
| `FraudFlagsCard` | `components/FraudFlagsCard.tsx` | Risk score + factors display |

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| `StaffPage` | `/bakeries/:bakeryId/staff` | Manage bakery staff |
| `AuditLogsPage` | `/audit-logs` | Browse and filter audit trail |
| `CustomersPage` | `/customers` | Customer management |
| `CustomerDetailPage` | `/customers/:customerId` | Customer profile, orders, fraud flags |

---

## Task 9: Router & Sidebar Navigation

**File:** `apps/super-admin/src/router.tsx`

Add 4 new routes under `AdminLayout`:

```typescript
{
  path: '/bakeries/:bakeryId/staff',
  lazy: () => import('../pages/StaffPage'),
},
{
  path: '/audit-logs',
  lazy: () => import('../pages/AuditLogsPage'),
},
{
  path: '/customers',
  lazy: () => import('../pages/CustomersPage'),
},
{
  path: '/customers/:customerId',
  lazy: () => import('../pages/CustomerDetailPage'),
},
```

**Sidebar** (`AdminLayout.tsx`): Add links:
- "Staff" → navigates to bakery staff page (contextual: shows after selecting a bakery)
- "Audit Logs" → `/audit-logs`
- "Customers" → `/customers`

---

## Completion Criteria for Phase 4

All 9 tasks done when:

- [ ] `pnpm -w lint` — 0 errors
- [ ] `pnpm -w typecheck` — 0 errors
- [ ] `pnpm -w test` — all 150+ tests passing
- [ ] All 15 API endpoints return correct responses with auth
- [ ] Staff management: list, create, update, delete all working end-to-end
- [ ] Audit log: every admin write action creates a log entry
- [ ] Customers: ban/unban visible in customer table
- [ ] All 4 new pages render correctly and handle loading/error states
- [ ] Router integration: sidebar links navigate to new pages
- [ ] Branch merged to `master` via PR

---

## Timeline Estimate

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Task 4 (Staff API) | 2-3 hours | Tasks 1-3 ✅ |
| Task 5 (Audit API) | 1-2 hours | Task 2 ✅ |
| Task 6 (Customer API) | 2-3 hours | Task 3 ✅ |
| Task 7 (Hooks) | 1-2 hours | Tasks 4-6 |
| Task 8 (UI) | 4-5 hours | Task 7 |
| Task 9 (Router) | 30 min | Task 8 |
| **Total** | **~12-16 hours** | |
