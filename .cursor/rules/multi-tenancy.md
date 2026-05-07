# Multi-Tenancy Enforcement

> Critical: Cross-tenant data leakage is a P0 incident.

## The Golden Rule

Every query on a tenant-scoped table MUST filter by `bakery_id`.

```sql
-- ✅ Correct
SELECT * FROM orders WHERE bakery_id = $1 AND id = $2

-- ❌ Wrong - missing bakery_id
SELECT * FROM orders WHERE id = $1
```

## Tenant Data Model

| Table             | Scoped By   | Notes          |
| ----------------- | ----------- | -------------- |
| `bakeries`        | —           | Platform-level |
| `products`        | `bakery_id` |                |
| `categories`      | `bakery_id` |                |
| `orders`          | `bakery_id` |                |
| `order_items`     | `bakery_id` | Via orders     |
| `customers`       | —           | Platform-wide  |
| `bakery_users`    | `bakery_id` |                |
| `payment_methods` | `bakery_id` |                |
| `audit_log`       | `bakery_id` |                |

## Implementation Rules

1. **Tenant from token, never from request**

   ```ts
   // ✅ Correct - bakery_id comes from authenticated session
   const { bakeryId } = req.session

   // ❌ Wrong - bakery_id comes from request
   const { bakeryId } = req.body
   ```

2. **Return 404, not 403**

   ```ts
   // ✅ Correct - doesn't leak existence
   if (order.bakery_id !== session.bakeryId) {
     return res.status(404).json({ error: 'not_found' })
   }

   // ❌ Wrong - leaks that resource exists
   if (order.bakery_id !== session.bakeryId) {
     return res.status(403).json({ error: 'forbidden' })
   }
   ```

3. **RLS policies required** on all tenant-scoped tables

4. **Cross-tenant tests required** for every endpoint touching tenant data

## Red Flags (Stop Immediately)

- Query without `bakery_id` WHERE clause
- `req.body.bakery_id` used as authoritative
- 403 returned instead of 404 for cross-tenant access

See: `docs/03-MULTI_TENANCY.md`, `instructions/03-multi-tenancy-rules.md`
