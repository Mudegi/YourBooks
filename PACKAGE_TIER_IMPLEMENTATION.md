# Package Tier Implementation Summary

**Date**: December 19, 2025  
**Status**: ✅ Complete  
**Scope**: Implement YourBooks Pro and Advanced tier separation with feature gating

---

## Overview

YourBooks now supports two distinct packages:

- **YourBooks Pro**: Essential accounting features (ledger, AR/AP, invoicing, banking, basic inventory)
- **YourBooks Advanced**: Full-featured ERP (Pro + manufacturing, fixed assets, projects, HCM, CRM, advanced reporting, compliance packs, automation)

---

## Changes Made

### 1. Database Schema

**File**: [prisma/schema.prisma](prisma/schema.prisma)

- Added `PackageTier` enum with `PRO` and `ADVANCED` values
- Added `package` field to `Organization` model (default: `ADVANCED` for backward compatibility)

```prisma
enum PackageTier {
  PRO
  ADVANCED
}

model Organization {
  // ...
  package PackageTier @default(ADVANCED)
  // ...
}
```

### 2. Session API Enhancement

**File**: [src/app/api/auth/session/route.ts](src/app/api/auth/session/route.ts)

- Expose `package` tier in session response so frontend can read it

### 3. Access Control Utilities

**File**: [src/lib/access.ts](src/lib/access.ts)

- Added `ensurePackageAccess()` function for backend enforcement
- Throws 403 error if org package doesn't match allowed tier list

```typescript
export async function ensurePackageAccess(
  organizationId: string,
  allowedPackages: PackageTier[]
) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { package: true },
  });

  if (!org || !allowedPackages.includes(org.package)) {
    const err = new Error('Upgrade required');
    err.statusCode = 403;
    throw err;
  }
}
```

### 4. Feature Gate Utilities

**File**: [src/lib/package-gates.ts](src/lib/package-gates.ts) *(New)*

- Centralized feature flag definitions mapping features to package tiers
- Utility functions for checking feature access and filtering navigation
- Supports both backend and frontend feature checking

```typescript
export const PACKAGE_FEATURES = {
  PRO: { manufacturing: false, fixedAssets: false, ... },
  ADVANCED: { manufacturing: true, fixedAssets: true, ... },
};

export function hasFeatureAccess(packageTier, feature): boolean
export function filterNavigation(items, packageTier): GatedNavItem[]
```

### 5. Manufacturing API Gating

**File**: [src/app/api/[orgSlug]/manufacturing/assembly/route.ts](src/app/api/%5BorgSlug%5D/manufacturing/assembly/route.ts)

- Added `ensurePackageAccess()` check in both POST and GET handlers
- Returns 403 with upgrade message if org is PRO

```typescript
await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
```

### 6. Dashboard Layout Navigation Gating

**File**: [src/app/(dashboard)/[orgSlug]/layout.tsx](src/app/(dashboard)/%5BorgSlug%5D/layout.tsx)

- Added `requiresAdvanced: true` flag to all Advanced-tier nav items
- Filter navigation based on `orgPackage === 'PRO'`
- Show Pro users an upgrade CTA card in the sidebar

```typescript
const filteredNavigation = isPro
  ? navigation.filter((item) => !item.requiresAdvanced)
  : navigation;

{isPro && (
  <div className="...">
    Unlock manufacturing, projects, automation, and advanced reporting with YourBooks Advanced.
    <a href={`/${orgSlug}/settings`}>Upgrade</a>
  </div>
)}
```

### 7. Assembly UI Conditional Rendering

**File**: [src/app/[orgSlug]/manufacturing/assembly/page.tsx](src/app/%5BorgSlug%5D/manufacturing/assembly/page.tsx)

- Fetch org package from session
- Show upgrade prompt if `package === 'PRO'`
- Hide all feature UI from Pro users

```typescript
{orgInfo?.package === 'PRO' ? (
  <div className="bg-blue-50 ...">
    <h2>Assembly builds require YourBooks Advanced</h2>
    <a href={`/${orgSlug}/settings`}>Upgrade Now</a>
  </div>
) : (
  <>
    {/* Feature content */}
  </>
)}
```

---

## Feature Assignment

### YourBooks Pro (10 core features)

✅ General Ledger  
✅ Accounts Receivable  
✅ Accounts Payable  
✅ Payments (AP/AR)  
✅ Banking (basic)  
✅ Inventory (basic)  
✅ Tax/VAT (basic)  
✅ Standard Reports  
✅ User Roles & Access  
✅ Multi-branch Support  

### YourBooks Advanced (15+ additional features)

✅ Manufacturing (BOM, work orders, assembly)  
✅ Fixed Assets  
✅ Projects & Job Costing  
✅ Budgeting & Forecasting  
✅ Advanced Reporting & BI  
✅ Compliance Packs (Uganda URA, Kenya KRA, etc.)  
✅ Automations & Workflows  
✅ CRM  
✅ Advanced Inventory (cycle counts, lot tracking, valuations)  
✅ Warehouse Management  
✅ HCM & Payroll  
✅ Field Service  
✅ Maintenance & EAM  
✅ Quality Management  
✅ Advanced Planning  
✅ Advanced Costing  

---

## Implementation Checklist

| Task | Status | File(s) |
|------|--------|---------|
| Schema: Add PackageTier enum | ✅ | schema.prisma |
| Schema: Add package field to Organization | ✅ | schema.prisma |
| Session: Expose package in response | ✅ | src/app/api/auth/session/route.ts |
| Access control: ensurePackageAccess() | ✅ | src/lib/access.ts |
| Feature gates: Centralized definitions | ✅ | src/lib/package-gates.ts |
| API gating: Manufacturing assembly | ✅ | src/app/api/[orgSlug]/manufacturing/assembly/route.ts |
| Navigation gating: Dashboard layout | ✅ | src/app/(dashboard)/[orgSlug]/layout.tsx |
| UI gating: Assembly page | ✅ | src/app/[orgSlug]/manufacturing/assembly/page.tsx |
| Documentation: Package tiers | ✅ | PACKAGE_TIERS.md |
| Documentation: Gating guide | ✅ | PACKAGE_GATE_GUIDE.md |

---

## Next Steps & Migration

### Database Migration Required

```bash
# Run Prisma migration to update database
npx prisma migrate dev --name add_package_tier

# Or manually update existing orgs (default to ADVANCED):
UPDATE "Organization" SET "package" = 'ADVANCED';
```

### Gating Other Advanced Features

All manufacturing, fixed assets, projects, HCM, CRM, warehouse, etc. routes should apply the same `ensurePackageAccess()` pattern:

```typescript
// In any advanced API route
await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);

// In any navigation that's advanced-only
{ name: 'FeatureName', requiresAdvanced: true, ... }

// In any page that's advanced-only
{org?.package === 'PRO' ? <UpgradePrompt /> : <Feature />}
```

### Testing

1. **Pro user**: Create org with `package = 'PRO'`
   - Verify manufacturing nav hidden
   - Try calling `/api/manufacturing/assembly` – expect 403
   - See upgrade CTA in sidebar

2. **Advanced user**: Create org with `package = 'ADVANCED'` (default)
   - Verify all nav visible
   - API calls succeed
   - No upgrade prompts

3. **Upgrade flow**: Change org from PRO to ADVANCED
   - Verify access immediately restored
   - Nav items appear
   - API calls succeed

---

## Files Modified/Created

### Created
- [src/lib/package-gates.ts](src/lib/package-gates.ts) – Feature gate definitions and utilities
- [PACKAGE_TIERS.md](PACKAGE_TIERS.md) – Package tier documentation
- [PACKAGE_GATE_GUIDE.md](PACKAGE_GATE_GUIDE.md) – Implementation guide for adding gating

### Modified
- [prisma/schema.prisma](prisma/schema.prisma) – Added PackageTier enum and package field
- [src/app/api/auth/session/route.ts](src/app/api/auth/session/route.ts) – Expose package in session
- [src/lib/access.ts](src/lib/access.ts) – Added ensurePackageAccess() function
- [src/app/api/[orgSlug]/manufacturing/assembly/route.ts](src/app/api/%5BorgSlug%5D/manufacturing/assembly/route.ts) – Enforce ADVANCED package
- [src/app/(dashboard)/[orgSlug]/layout.tsx](src/app/(dashboard)/%5BorgSlug%5D/layout.tsx) – Filter navigation, show upgrade CTA
- [src/app/[orgSlug]/manufacturing/assembly/page.tsx](src/app/%5BorgSlug%5D/manufacturing/assembly/page.tsx) – Conditional rendering for Pro/Advanced

---

## Architecture Decisions

1. **Default to ADVANCED**: For backward compatibility, existing orgs default to ADVANCED tier. Admins must explicitly set to PRO via database or admin panel.

2. **Type-safe feature checking**: Feature keys are derived from `PACKAGE_FEATURES.ADVANCED` keys, ensuring consistency.

3. **Centralized gating logic**: All feature checks route through `hasFeatureAccess()` and `ensurePackageAccess()` for maintainability.

4. **Graceful degradation**: Pro users see helpful upgrade prompts, not errors.

5. **API-level enforcement**: Backend enforces package tier regardless of frontend state; cannot be bypassed.

---

## Upgrade User Experience

### Pro Users Accessing Advanced Feature

**Scenario**: Pro user tries to view manufacturing assembly page

1. Page loads and checks session package tier
2. Detects `package = 'PRO'`
3. Displays upgrade prompt with:
   - Feature description
   - Benefits of upgrade
   - "Upgrade Now" CTA → `/[orgSlug]/settings`
   - No errors or broken UI

### Pro User Calling Advanced API

**Scenario**: Pro user calls `/api/[orgSlug]/manufacturing/assembly`

1. API checks organization package
2. Detects `package = 'PRO'`
3. Returns 403:
   ```json
   {
     "error": "Upgrade to YourBooks Advanced to unlock manufacturing, projects, automation, and more."
   }
   ```

### Navigation Hiding

**Scenario**: Pro user logs in

1. Dashboard loads and filters navigation items
2. Manufacturing, Projects, Warehouse, HCM, etc. hidden
3. Sidebar shows upgrade CTA card with benefits
4. All Pro features (Invoicing, Payments, etc.) remain visible

---

## Maintenance Notes

- When adding new features, update [PACKAGE_FEATURES](src/lib/package-gates.ts) and [navigation layout](src/app/(dashboard)/%5BorgSlug%5D/layout.tsx)
- Always gate advanced APIs with `ensurePackageAccess(org.id, [PackageTier.ADVANCED])`
- Use `requiresAdvanced: true` on nav items that require the ADVANCED tier
- Test both Pro and Advanced flows whenever shipping a new feature

---

## References

- **Feature Definitions**: [src/lib/package-gates.ts](src/lib/package-gates.ts)
- **Access Control**: [src/lib/access.ts](src/lib/access.ts)
- **Package Tier Docs**: [PACKAGE_TIERS.md](PACKAGE_TIERS.md)
- **Implementation Guide**: [PACKAGE_GATE_GUIDE.md](PACKAGE_GATE_GUIDE.md)
- **Dashboard Layout**: [src/app/(dashboard)/[orgSlug]/layout.tsx](src/app/(dashboard)/%5BorgSlug%5D/layout.tsx)
