# Migration Guide: Adding Package Tier to YourBooks

This guide walks through the process of deploying the package tier system to production.

---

## Pre-Deployment Checklist

- [ ] Run Prisma migration in dev environment
- [ ] Test Pro and Advanced user flows locally
- [ ] Verify database schema changes
- [ ] Review all gated API endpoints
- [ ] Confirm upgrade messaging is correct
- [ ] Load test with mixed Pro/Advanced orgs
- [ ] Backup production database
- [ ] Plan rollback strategy
- [ ] Notify support team of changes
- [ ] Schedule deployment outside peak hours

---

## Step 1: Generate Migration

```bash
# In development
npx prisma migrate dev --name add_package_tier

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Update Prisma client
# 3. Apply changes to local dev database
```

---

## Step 2: Review Migration File

**Location**: `prisma/migrations/[timestamp]_add_package_tier/migration.sql`

Should contain:

```sql
-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('PRO', 'ADVANCED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "package" "PackageTier" NOT NULL DEFAULT 'ADVANCED';
```

---

## Step 3: Local Testing

### Test 1: Pro User Cannot Access Manufacturing

```bash
# Create test org as PRO
psql -d yourbooks_dev -c "
  INSERT INTO \"Organization\" (id, slug, name, package)
  VALUES ('org-pro-test', 'pro-test', 'Pro Test Org', 'PRO');
"

# Log in and verify:
# 1. Manufacturing nav hidden
# 2. API returns 403 when accessing /api/pro-test/manufacturing/assembly
```

### Test 2: Advanced User Has Full Access

```bash
# Create test org as ADVANCED (default)
psql -d yourbooks_dev -c "
  INSERT INTO \"Organization\" (id, slug, name, package)
  VALUES ('org-adv-test', 'adv-test', 'Advanced Test Org', 'ADVANCED');
"

# Log in and verify:
# 1. All nav items visible
# 2. API calls to manufacturing succeed
# 3. No upgrade prompts
```

### Test 3: Upgrade Path

```bash
# Start with PRO org
# Update to ADVANCED
psql -d yourbooks_dev -c "
  UPDATE \"Organization\" 
  SET package = 'ADVANCED' 
  WHERE slug = 'pro-test';
"

# Refresh browser, verify:
# 1. Manufacturing nav suddenly appears
# 2. No page reload needed if using session polling
```

---

## Step 4: Staging Deployment

```bash
# 1. Merge PR to main/develop
# 2. Deploy to staging environment
# 3. Run migrations
npx prisma migrate deploy

# 4. Smoke test
#    - Log in as staging admin
#    - Verify Pro user sees upgrade prompt
#    - Verify Advanced user has full access
#    - Test upgrade flow
```

---

## Step 5: Production Deployment

### Pre-Migration

```bash
# 1. Alert support team
# 2. Notify key customers about package tiers
# 3. Backup database
pg_dump yourbooks_prod > backups/yourbooks_$(date +%Y%m%d_%H%M%S).sql

# 4. Schedule during low-traffic window (usually 2-4 AM)
```

### Run Migration

```bash
# 1. SSH into production
ssh prod-server

# 2. Deploy code
git pull origin main
npm install

# 3. Run Prisma migration
npx prisma migrate deploy

# Expected output:
# 1 migration to apply:
# migrations/[timestamp]_add_package_tier
# Database already migrated, nothing to do

# 4. Restart application
pm2 restart yourbooks
```

### Post-Migration Verification

```bash
# 1. Check database
psql -d yourbooks_prod -c "
  SELECT slug, package, createdAt FROM \"Organization\" LIMIT 5;
"

# Expected: All orgs have package set (default: ADVANCED)

# 2. Check application health
curl https://yourbooks.app/api/health

# 3. Log in and test
#    - Pro user can still use core accounting
#    - Advanced user has all features
#    - New Pro customer can sign up
```

---

## Step 6: Customer Communication

### Email Template: Announcement

```
Subject: YourBooks Pro & Advanced Packages – Introducing Flexible Plans

Hi [Customer Name],

We're excited to announce a new flexible pricing model for YourBooks:

📦 YourBooks Pro
   Essential accounting for small businesses
   - General Ledger, AR/AP, Invoicing, Payments
   - Banking, Basic Inventory
   - Standard Reports & Multi-branch Support
   
📦 YourBooks Advanced  
   Full-featured ERP for growing businesses
   - Everything in Pro, plus:
   - Manufacturing, Fixed Assets, Projects
   - HCM, CRM, Warehouse Management
   - Advanced Reporting, Compliance Packs

Your current account is on YourBooks Advanced with full feature access.

Learn more: https://yourbooks.app/pricing
```

### Email Template: Pro User Welcome

```
Subject: Welcome to YourBooks Pro

Hi [Customer Name],

Thanks for choosing YourBooks Pro! You have access to all essential accounting features.

Your account includes:
✓ General Ledger & Chart of Accounts
✓ Invoicing & Billing
✓ Vendor Management & Bill Pay
✓ Bank Accounts & Reconciliation
✓ Basic Inventory Tracking
✓ Tax/VAT Filing Templates
✓ Standard Reports (P&L, Balance Sheet, etc.)
✓ Multi-branch Support
✓ User Roles & Access Control

Want manufacturing, projects, and advanced reporting?
→ Upgrade to YourBooks Advanced: https://yourbooks.app/upgrade
```

---

## Step 7: Ongoing Maintenance

### Monitor Upgrade Requests

```bash
# Track which Pro users try to access Advanced features
# Query logs for 403 errors on advanced APIs

# Example: Find Pro users accessing manufacturing
SELECT user_id, COUNT(*) as attempts
FROM api_logs
WHERE http_status = 403
AND path LIKE '%/manufacturing/%'
AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY attempts DESC;
```

### Migrate Pro Users (Optional)

```bash
# When customers request upgrade via UI:

# 1. Verify payment method on file
# 2. Update package tier
UPDATE "Organization" 
SET package = 'ADVANCED', updated_at = NOW()
WHERE id = 'org-id';

# 3. Clear session cache (if applicable)
# 4. Send confirmation email

# Users will see full feature access on next login
```

---

## Rollback Plan

### If Critical Issues Found

```bash
# 1. Immediately stop new deployments
# 2. Revert application code
git revert [commit-hash]
npm install
pm2 restart yourbooks

# 3. Check database state
psql -d yourbooks_prod -c "
  SELECT COUNT(*) as count, package 
  FROM \"Organization\" 
  GROUP BY package;
"

# 4. If needed, rollback database
psql -d yourbooks_prod < backups/yourbooks_[timestamp].sql

# 5. Notify affected users
# 6. Post-mortem and analysis
```

---

## Migration SQL Scripts

### Create Pro Org

```sql
INSERT INTO "Organization" (
  id, name, slug, baseCurrency, homeCountry, 
  compliancePack, package, createdAt, updatedAt
) VALUES (
  gen_random_uuid(),
  'Demo Pro Company',
  'demo-pro',
  'USD',
  'US',
  'DEFAULT',
  'PRO',
  NOW(),
  NOW()
);
```

### List All Orgs by Package

```sql
SELECT 
  slug,
  name,
  package,
  COUNT(ou.id) as user_count,
  createdAt
FROM "Organization" o
LEFT JOIN "OrganizationUser" ou ON o.id = ou.organizationId
GROUP BY o.id
ORDER BY o.createdAt DESC;
```

### Migrate Specific Org from Pro to Advanced

```sql
UPDATE "Organization"
SET package = 'ADVANCED', updated_at = NOW()
WHERE slug = 'customer-company-slug'
RETURNING slug, package, updated_at;
```

### Count Users by Tier

```sql
SELECT 
  o.package,
  COUNT(DISTINCT ou.userId) as users,
  COUNT(DISTINCT o.id) as organizations
FROM "Organization" o
LEFT JOIN "OrganizationUser" ou ON o.id = ou.organizationId
GROUP BY o.package;
```

---

## Troubleshooting

### Issue: Pro users see manufacturing nav

**Cause**: Navigation filtering not working  
**Fix**: Clear browser cache and session cookies, then log out and back in

### Issue: Advanced users getting 403 on manufacturing API

**Cause**: Migration didn't apply or enum not created  
**Fix**: Run `npx prisma migrate deploy` again and restart app

### Issue: New orgs don't default to Advanced

**Cause**: Prisma schema cache not updated  
**Fix**: 
```bash
npx prisma generate
npx prisma db push
```

### Issue: Session response doesn't include package

**Cause**: Old session endpoint cached  
**Fix**: Clear redis cache or restart application

---

## Success Metrics

Track post-deployment:

1. **No 500 errors** on package-related endpoints
2. **Pro users see** upgrade prompts (not errors)
3. **Advanced users have** unblocked access
4. **Navigation filters** working correctly
5. **API enforces** package tier on all advanced endpoints
6. **Zero support tickets** about gating issues (ideally)

---

## Support Handoff

Brief support team on:

- **Pro vs Advanced**: What features in each tier
- **How to upgrade**: Settings → Subscription → Upgrade
- **Gating behavior**: What Pro users see/don't see
- **Common issues**: Cache clearing, session refresh
- **Escalation**: When to contact engineering

---

## Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Development | 1 day | Implement gating, test locally |
| Review | 1 day | Code review, QA sign-off |
| Staging | 1 day | Deploy, run migrations, smoke test |
| Production | 1 day | Deploy during off-peak, monitor |
| Verification | 2 days | Confirm all users can access/upgrade |
| Stabilization | 1 week | Monitor for issues, support escalations |

---

## See Also

- [PACKAGE_TIERS.md](../PACKAGE_TIERS.md) – Feature breakdown
- [PACKAGE_GATE_GUIDE.md](../PACKAGE_GATE_GUIDE.md) – Implementation details
- [PACKAGE_TIER_QUICK_REF.md](../PACKAGE_TIER_QUICK_REF.md) – Quick reference
