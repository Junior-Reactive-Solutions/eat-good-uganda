# Phase 4: Advanced Admin Features — Implementation Plan

> **For agentic workers:** Use subagent-driven-development skill with this plan as the specification.

**Goal:** Implement bakery staff management, comprehensive audit logging, and customer user management for the super admin dashboard.

**Architecture:** Three integrated systems (staff, audit, users) with proper RBAC and data isolation.

**Tech Stack:** TypeScript, React Query v5, PostgreSQL, Express.js, TDD methodology.

---

## 📋 Task Breakdown (9 Tasks)

### **Task 1: Bakery Staff Database Queries**

**Files:**
- Create: `packages/db/src/queries/staff.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/src/queries/__tests__/staff.test.ts`

**What to build:**

```typescript
// 1. listBakeryStaff(bakeryId, options?)
// Returns: Array of staff with role, email, phone, status, last_login
// Filters: by bakery_id, optionally by role, active/inactive
// Pagination: limit (default 20), offset

// 2. getBakeryStaffMember(bakeryId, staffId)
// Returns: Single staff with full details
// Error: 404 if not found or different bakery

// 3. createBakeryStaff(bakeryId, staffData)
// Input: { email, full_name, phone, role: 'owner'|'manager'|'staff' }
// Returns: Created staff with ID
// Validation: Email unique per bakery

// 4. updateBakeryStaff(bakeryId, staffId, updates)
// Allows: full_name, phone, role (except owner role can't be downgraded)
// Returns: Updated staff

// 5. removeBakeryStaff(bakeryId, staffId)
// Logic: Soft delete or role downgrade
// Prevents: Removing last owner
// Returns: Updated staff with status = inactive

// 6. getBakeryStaffByEmail(bakeryId, email)
// Returns: Staff member by email
// Error: 404 if not found
```

**Tests to write (15 tests):**
- List staff paginated
- Filter by role
- Get single staff
- Create staff with validation
- Update staff role
- Prevent removing last owner
- Cross-bakery isolation (staff from bakery A can't access bakery B's staff)

---

### **Task 2: Audit Logging Database Queries**

**Files:**
- Create: `packages/db/src/queries/audit.ts`
- Test: `packages/db/src/queries/__tests__/audit.test.ts`

**What to build:**

```typescript
// 1. logAuditEvent(event: AuditEvent)
// Input: { admin_id, bakery_id, action, resource_type, resource_id, 
//          changes: {before, after}, ip_address, timestamp }
// Action examples: 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'SUSPEND'
// ResourceType: 'bakery', 'staff', 'product', 'order', 'customer'
// Returns: Created audit log entry

// 2. listAuditLogs(filters: AuditFilters)
// Filters: bakery_id, admin_id, action, resource_type, date_range
// Returns: Paginated audit logs with admin details
// Sorting: by timestamp DESC (most recent first)

// 3. getAuditLog(logId)
// Returns: Full audit log entry with all changes

// 4. listAdminActivitySummary(adminId, bakeryId)
// Returns: Summary of admin's recent actions (last 7 days)
// Use case: Detect suspicious activity

// 5. getResourceChangeHistory(bakeryId, resourceType, resourceId)
// Returns: All changes to a specific resource over time
// Use case: See what changed on an order/bakery/product and by whom
```

**Tests to write (12 tests):**
- Log various event types
- List with filtering
- Date range filtering
- Admin activity summary
- Resource history tracking
- Timezone handling (UTC storage)

---

### **Task 3: Customer User Management Database Queries**

**Files:**
- Create: `packages/db/src/queries/customers.ts` (or extend existing)
- Test: `packages/db/src/queries/__tests__/customers.test.ts`

**What to build:**

```typescript
// 1. listAllCustomers(filters: CustomerFilters)
// Filters: status (active, banned, suspended), city, created_date_range
// Returns: All customers platform-wide
// Admin-only view (not bakery-scoped)

// 2. getCustomerDetail(customerId)
// Returns: Full customer profile + order history summary + fraud flags

// 3. banCustomer(customerId, reason: string)
// Updates: customers.status = 'banned', ban_reason, banned_at
// Effect: Customer can't place new orders

// 4. unbanCustomer(customerId)
// Updates: customers.status = 'active', ban_reason = NULL
// Returns: Updated customer

// 5. listCustomerOrders(customerId)
// Returns: All orders by customer with bakery, items, total
// Pagination: limit 20

// 6. getCustomerFraudFlags(customerId)
// Returns: Calculated fraud risk factors:
// - Chargebacks count
// - Cancelled orders count
// - High-value orders
// - Multiple failed payments
// Use case: Platform safety
```

**Tests to write (14 tests):**
- List all customers with filters
- Ban/unban functionality
- Customer order history
- Fraud flag calculation
- Timezone handling
- Data isolation (super admin only)

---

### **Task 4: Admin API Routes — Staff Management**

**Files:**
- Create: `apps/api/src/routes/admin/staff.ts`
- Modify: `apps/api/src/app.ts` (register route)
- Test: `apps/api/src/routes/admin/__tests__/staff.test.ts`

**Endpoints to implement:**

```typescript
// GET /v1/admin/bakeries/:bakeryId/staff
// Returns: Paginated list of staff for bakery
// Query: page, pageSize, role (filter), search (name/email)
// Auth: super_admin only

// GET /v1/admin/bakeries/:bakeryId/staff/:staffId
// Returns: Full staff details
// Auth: super_admin only
// 404: If staff not found

// POST /v1/admin/bakeries/:bakeryId/staff
// Body: { email, full_name, phone, role }
// Returns: Created staff with ID
// Auth: super_admin
// 400: Email already exists

// PATCH /v1/admin/bakeries/:bakeryId/staff/:staffId
// Body: { full_name?, phone?, role? }
// Returns: Updated staff
// Auth: super_admin
// 400: Can't downgrade last owner

// DELETE /v1/admin/bakeries/:bakeryId/staff/:staffId
// Soft delete (set inactive)
// Auth: super_admin
// 400: Last owner can't be removed
```

**Tests to write (20 tests):**
- All CRUD operations
- Validation errors (400)
- Authorization (401/403)
- Not found (404)
- Last owner protection
- Email uniqueness
- Cross-bakery isolation

---

### **Task 5: Admin API Routes — Audit Logging**

**Files:**
- Create: `apps/api/src/routes/admin/audit.ts`
- Test: `apps/api/src/routes/admin/__tests__/audit.test.ts`

**Endpoints to implement:**

```typescript
// GET /v1/admin/audit-logs
// Returns: Platform-wide audit logs (paginated)
// Query: page, pageSize, admin_id (filter), bakery_id (filter),
//        action (filter), resource_type (filter), date_from, date_to
// Auth: super_admin only

// GET /v1/admin/audit-logs/:logId
// Returns: Full audit log with changes
// Auth: super_admin only

// GET /v1/admin/bakeries/:bakeryId/audit-logs
// Returns: Bakery-specific audit logs
// Query: Same as above
// Auth: super_admin only

// GET /v1/admin/activity-summary
// Returns: Activity summary (top admins, most common actions)
// Query: date_range (7d, 30d, 90d)
// Auth: super_admin only
```

**Tests to write (18 tests):**
- List with all filter combinations
- Date range filtering
- Pagination
- Activity summary calculation
- Authorization checks
- Timezone handling

---

### **Task 6: Admin API Routes — Customer Management**

**Files:**
- Create: `apps/api/src/routes/admin/customers.ts`
- Test: `apps/api/src/routes/admin/__tests__/customers.test.ts`

**Endpoints to implement:**

```typescript
// GET /v1/admin/customers
// Returns: All customers (paginated)
// Query: page, pageSize, status (active/banned/suspended), 
//        search (email/name), city (filter)
// Auth: super_admin only

// GET /v1/admin/customers/:customerId
// Returns: Full customer profile + order history + fraud flags
// Auth: super_admin only
// 404: If not found

// POST /v1/admin/customers/:customerId/ban
// Body: { reason: string }
// Returns: Updated customer with ban status
// Auth: super_admin only
// 400: Already banned

// POST /v1/admin/customers/:customerId/unban
// Returns: Updated customer
// Auth: super_admin only
// 400: Not banned

// GET /v1/admin/customers/:customerId/orders
// Returns: Customer's order history (paginated)
// Query: page, pageSize
// Auth: super_admin only

// GET /v1/admin/customers/:customerId/fraud-flags
// Returns: Calculated fraud risk data
// Auth: super_admin only
```

**Tests to write (20 tests):**
- All CRUD and action endpoints
- Ban/unban workflow
- Fraud flag calculation
- Pagination
- Filtering
- Authorization checks

---

### **Task 7: React Query Hooks for Admin Features**

**Files:**
- Create: `apps/super-admin/src/features/admin/api.ts`
- Test: `apps/super-admin/src/features/admin/__tests__/api.test.tsx`

**Hooks to implement:**

```typescript
// Staff Management
useStaffList(bakeryId, options?) // List staff with filters
useStaffDetail(bakeryId, staffId) // Get single staff
useCreateStaff() // POST mutation
useUpdateStaff() // PATCH mutation
useRemoveStaff() // DELETE mutation

// Audit Logging
useAuditLogs(filters?) // List platform audit logs with filters
useAuditDetail(logId) // Get single log
useActivitySummary(dateRange?) // Get activity summary

// Customer Management
useCustomerList(filters?) // List all customers
useCustomerDetail(customerId) // Get customer + orders + fraud flags
useBanCustomer() // POST ban mutation
useUnbanCustomer() // POST unban mutation
useCustomerOrders(customerId) // Get customer's orders
useCustomerFraudFlags(customerId) // Get fraud flags
```

**Tests to write (30 tests):**
- Cache behavior
- Error handling
- Loading states
- Mutation success/failure
- Cache invalidation on mutations
- Conditional queries

---

### **Task 8: UI Components & Pages**

**Files:**
- Create: `apps/super-admin/src/components/Staff*.tsx` (4 components)
- Create: `apps/super-admin/src/components/Audit*.tsx` (3 components)
- Create: `apps/super-admin/src/components/Customer*.tsx` (4 components)
- Create: `apps/super-admin/src/pages/StaffPage.tsx`
- Create: `apps/super-admin/src/pages/AuditLogsPage.tsx`
- Create: `apps/super-admin/src/pages/CustomersPage.tsx`
- Test: Multiple `.test.tsx` files

**Staff Components:**
1. `StaffCard.tsx` — Single staff member display with actions (edit, remove)
2. `StaffForm.tsx` — Create/edit form with validation
3. `StaffTable.tsx` — Paginated staff table view
4. `StaffDialog.tsx` — Modal for add/edit

**Audit Components:**
1. `AuditLogEntry.tsx` — Single log entry with before/after changes
2. `AuditLogTable.tsx` — Paginated audit log table
3. `ActivitySummary.tsx` — Dashboard widget showing top actions/admins

**Customer Components:**
1. `CustomerCard.tsx` — Customer with status badge
2. `CustomerDetail.tsx` — Full profile + orders + fraud flags
3. `CustomerBanDialog.tsx` — Ban confirmation with reason
4. `FraudFlags.tsx` — Display fraud risk indicators

**Pages:**
1. `StaffPage.tsx` — Bakery staff management
2. `AuditLogsPage.tsx` — Platform audit logs with filters
3. `CustomersPage.tsx` — All customers management

**Tests to write (40+ tests):**
- Component rendering
- Form validation
- User interactions (ban, edit, remove)
- Loading states
- Error states
- Responsive layout

---

### **Task 9: Router Integration & Final Assembly**

**Files:**
- Modify: `apps/super-admin/src/router.tsx`
- Modify: `apps/super-admin/src/layouts/AdminLayout.tsx` (sidebar)

**Routes to add:**
```typescript
// Under protected admin routes:
{
  path: '/staff/:bakeryId',
  lazy: () => import('../pages/StaffPage')
}
{
  path: '/audit-logs',
  lazy: () => import('../pages/AuditLogsPage')
}
{
  path: '/customers',
  lazy: () => import('../pages/CustomersPage')
}
```

**Sidebar updates:**
- Add "Staff Management" link → `/staff/bakeryId`
- Add "Audit Logs" link → `/audit-logs`
- Add "Customers" link → `/customers`

**Tests to write (10+ tests):**
- Route guards
- Navigation
- Layout integration

---

## 📊 Summary

| Aspect | Count |
|--------|-------|
| **Tasks** | 9 |
| **Database Functions** | 15+ |
| **API Endpoints** | 12 |
| **React Hooks** | 11 |
| **UI Components** | 11 |
| **Pages** | 3 |
| **Tests** | 150+ |
| **Estimated LOC** | 4,000+ |

---

## ✅ Success Criteria

- [ ] All 15+ database functions implemented and tested
- [ ] 12 API endpoints implemented with proper auth
- [ ] 11 React Query hooks with cache management
- [ ] 11 UI components fully accessible
- [ ] 3 pages responsive and functional
- [ ] 150+ tests (all passing)
- [ ] TypeScript strict mode: PASSING
- [ ] ESLint: 0 errors
- [ ] Multi-tenant isolation verified on all queries
- [ ] Cross-tenant tests included

---

## 🎯 Implementation Order

1. Task 1-3: Database queries first (TDD)
2. Task 4-6: API routes second (depends on DB)
3. Task 7: React hooks third (depends on API)
4. Task 8: Components fourth (depends on hooks)
5. Task 9: Router integration last

---

## 📚 Notes

- **Multi-tenancy:** All queries filter by `bakery_id` or verified admin context
- **Soft deletes:** Use `deleted_at` column, never hard delete
- **Audit trail:** Log all admin actions automatically
- **Timestamps:** Store in UTC, convert to user's timezone on display
- **Error handling:** 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- **Testing:** TDD methodology - write test first, then implement

---

**Status:** Ready for implementation  
**Next Step:** Create GitHub Issues from this plan and start Task 1
