# Incident Response

> How to handle security incidents and outages at Eat Good Uganda.

## Incident Classification

| Severity | Description                                                         | SLA      | Examples                                                      |
| -------- | ------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| **P0**   | Critical — data breach, complete service outage, payment compromise | 1 hour   | Database leak, all services down, payment credentials exposed |
| **P1**   | High — partial outage, security vulnerability with active exploit   | 4 hours  | API down, single bakery data leak, payment fraud              |
| **P2**   | Medium — degraded performance, non-critical vulnerability           | 24 hours | Slow response times, spam abuse, minor data inconsistency     |
| **P3**   | Low — cosmetic issues, feature requests                             | 72 hours | UI bug, typo, documentation update                            |

## Incident Response Process

### Step 1: Declare

Post immediately in `#eatgood-incidents` Slack channel:

```
🚨 INCIDENT: <brief description>
Severity: P0/P1/P2/P3
Impact: <what's affected>
Initial action: <containment plan>
```

### Step 2: Assess

- Confirm the incident is real (not a false alarm)
- Determine scope: what data, users, systems are affected
- Identify root cause (if known)
- Assign incident commander (IC)

### Step 3: Contain

**Immediate actions to limit damage:**

| If            | Then                                                          |
| ------------- | ------------------------------------------------------------- |
| Data breach   | Rotate all secrets, revoke sessions, isolate affected systems |
| Service down  | Check Render/Vercel status, review recent deploys             |
| Payment fraud | Freeze affected bakery, suspend payment processing            |
| Vulnerability | Disable feature, patch and redeploy                           |

### Step 4: Communicate

**Internal:**

- Update `#eatgood-incidents` every 30 minutes for P0/P1
- Notify leadership for P0/P1

**External (P0/P1 only):**

- Prepare customer communication
- Set up status page update
- Plan disclosure if data breach involves PII

### Step 5: Resolve

- Implement fix
- Verify fix works
- Monitor for recurrence

### Step 6: Post-Mortem

**Required for P0/P1 within 72 hours:**

1. Timeline of events
2. Root cause analysis
3. Impact assessment
4. Remediation taken
5. Prevention measures
6. Lessons learned

Post in `#eatgood-incidents` and create a GitHub issue for tracking.

## Emergency Contacts

| Role              | Name | Contact                    |
| ----------------- | ---- | -------------------------- |
| Engineering Lead  | TBD  | TBD                        |
| Security          | TBD  | TBD                        |
| Platform (Vercel) | —    | vercel.com/support         |
| Platform (Render) | —    | render.com/support         |
| Platform (Neon)   | —    | neon.tech/support          |
| Payment (MTN)     | —    | developer.mtn.com/support  |
| Payment (Airtel)  | —    | uganda.airtel.com/business |

## Rollback Procedures

### Frontend (Vercel)

1. Go to Vercel dashboard
2. Find the deployment
3. Click "Promote to Production" on a previous healthy deployment

### Backend (Render)

1. Go to Render dashboard
2. Find the service
3. Click "Redeploy" and select a previous commit

### Database (Neon)

1. Go to Neon dashboard
2. Go to the branch
3. Use Point-in-Time Recovery to restore
4. **Warning:** Destructive — only for catastrophic data bugs

## Secrets Rotation

If secrets are compromised:

```bash
# 1. Rotate JWT secrets in .env
JWT_CUSTOMER_SECRET=<new-64-char-hex>
JWT_BAKERY_SECRET=<new-64-char-hex>
JWT_SUPERADMIN_SECRET=<new-64-char-hex>
JWT_REFRESH_SECRET=<new-64-char-hex>

# 2. Push to all environments
git add .env
git commit -m "chore: rotate compromised secrets"
git push

# 3. Invalidate all active sessions (database)
# DELETE FROM refresh_tokens WHERE created_at < '<compromise-time>';
```

## Recovery Checklist

After incident is resolved:

- [ ] All services healthy
- [ ] Data consistent
- [ ] Users notified (if needed)
- [ ] Secrets rotated (if needed)
- [ ] Monitoring alerts working
- [ ] Post-mortem completed
- [ ] Preventive measures implemented

---

> **Remember:** It's better to over-communicate than under-communicate during an incident.
