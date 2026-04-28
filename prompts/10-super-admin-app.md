# Prompt 10 — Super Admin App

## Context

Bakery admin is built (prompt 09). Super-admin backend exists from prompt 03 but only login; no dashboard pages.

Read before starting:
- `docs/11-ADMIN_403.md`
- `docs/05-API_SPEC.md` (admin routes)
- `instructions/04-security-rules.md`

## Goal

Build the super-admin app: IP-gated login with TOTP, bakery approval workflow, cross-bakery metrics, customer support, audit log viewer, super-admin user management.

## Deliverables

### IP allowlist edge gate

- Vercel edge middleware reads `SUPERADMIN_IP_ALLOWLIST` at request time.
- If set, only listed IPs reach the app. Others get HTTP 403.
- If empty, all IPs reach the app (development convenience).

### Auth

- Login form with TOTP step.
- Invite flow: an existing super-admin creates a new super-admin account via `POST /v1/admin/superadmins`, which sends an email with a 48h acceptance link. Recipient sets password + TOTP.
- Password change + TOTP reset endpoints.

### Layout

`DashboardLayout`:
- Top bar: EGU brand, current user, logout.
- Sidebar: Dashboard, Bakeries (pending count badge), Customers, Orders, Metrics, Audit Log, Admins.

### Pages

`DashboardPage`:
- Pending-approval count with CTA.
- Platform-wide: today's orders, revenue pass-through, active bakeries.
- System health: API uptime (from `/v1/internal/health`), DB latency.
- Recent audit log highlights.

`BakeriesPage`:
- Tabs: Pending, Active, Suspended, Archived.
- Table with bakery name, owner, created, status.
- Pending tab: row actions Approve / Reject (with reason modal).
- Active row actions: View profile, Suspend (reason modal), Impersonate (opens the bakery admin in a new tab with a short-lived super-admin-issued token — stretch goal, v2; stub button for now).

`BakeryDetailPage`:
- Full profile.
- Orders summary, revenue summary.
- Staff list.
- Timeline of admin actions on this bakery.

`CustomersPage`:
- Searchable table.
- Detail: orders count, total spend, last order date, email, phone.
- Disable account (reason modal).

`OrdersPage`:
- Cross-bakery orders with filters.
- Detail shows full order + payment + messages.

`MetricsPage`:
- Platform totals.
- Per-bakery breakdown.
- Charts with recharts.

`AuditLogPage`:
- Filter by actor, action, bakery, date range.
- Paginated with cursor.
- Each row expandable to show JSON payload.

`AdminsPage`:
- List of super-admins.
- Invite new (email + intended full name).
- Toggle active / inactive.

### API

- `GET /v1/admin/bakeries`, `/:id`, `POST /:id/approve`, `/:id/suspend`, `/:id/unsuspend`, `/:id/archive`
- `GET /v1/admin/customers`, `/:id`, `POST /:id/disable`
- `GET /v1/admin/orders`, `/:id`
- `GET /v1/admin/metrics/platform`, `/by-bakery`
- `GET /v1/admin/audit-log`
- `POST /v1/admin/superadmins`, `GET /v1/admin/superadmins`

Every admin endpoint writes an `audit_log` row via `auditLog.record`.

### Tests

- Integration: approval flow updates bakery status and sends email.
- Integration: a non-admin token cannot hit `/v1/admin/*` (401).
- Integration: a customer token with forged `sub` cannot hit `/v1/admin/*` — verified by signing test tokens with the wrong secret (401).
- Integration: audit log records every action with the admin's user id.
- E2E: admin logs in with TOTP, approves a pending bakery, bakery owner can log in fully.

## Constraints

- Every admin action audit-logged with reason where applicable (suspend, reject, disable).
- IP allowlist enforcement is a deploy-time config; tests verify it works by mocking headers.
- No "impersonate" feature in v1; if built, requires separate audit trail and explicit consent UX.

## Acceptance checklist

- [ ] Admin login with TOTP works end-to-end.
- [ ] Bakery approval / rejection / suspension flows complete.
- [ ] Audit log shows all admin actions.
- [ ] Super-admin invitation flow: invite → email → accept → login.
- [ ] Lighthouse Accessibility ≥ 90 on all admin pages.
- [ ] E2E admin flow passes.
