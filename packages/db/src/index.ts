export { pool, query } from './client'
export type { Database } from './client'
export { sql } from './sql'
export type { SqlFragment } from './sql'
export { withTransaction } from './tx'
export * from './queries/bakeries'
export * from './queries/bakery-settings'
export * from './queries/categories'
export * from './queries/products'
export * from './queries/orders'
export * from './queries/payments'
export * from './queries/customers'
export * from './queries/customer-profile'
export * from './queries/bakery-users'
export * from './queries/tokens'
export * from './queries/admin-users'
export * from './queries/bakery-metrics'
export * from './queries/staff'
export {
  getAdminPlatformMetrics,
  getAdminBakeryAnalytics,
  getAdminMetricsTimeSeries,
  getAdminTopBakeries,
  type PlatformMetrics,
  type BakeryAnalytics,
  type TimeSeriesPoint,
  type TopBakery,
} from './queries/analytics'
export { createAuditLog, getAuditLogs, type AuditLog } from './queries/audit-logs'
export {
  banCustomer,
  unbanCustomer,
  getCustomerDetails,
  listCustomers,
  type CustomerDetail,
} from './queries/users'
export * from './queries/support'
