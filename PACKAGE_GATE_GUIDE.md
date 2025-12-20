# Package Tier Gating Guide

This guide explains how to gate features behind YourBooks Pro and Advanced tiers.

---

## Quick Reference

| Task | Files Affected | Steps |
|------|------------------|-------|
| Gate an API endpoint | `src/app/api/[orgSlug]/.../route.ts` | 1. Import `ensurePackageAccess` and `PackageTier` 2. Call `ensurePackageAccess(org.id, [PackageTier.ADVANCED])` after org lookup 3. Return 403 with upgrade message if denied |
| Hide nav item (Pro users) | `src/app/(dashboard)/[orgSlug]/layout.tsx` | 1. Add `requiresAdvanced: true` to nav item 2. Filter nav array using `isPro` flag 3. Show Pro users the upgrade CTA |
| Gate a page/component | `src/app/[orgSlug]/[feature]/page.tsx` | 1. Fetch org package from session 2. Return upgrade prompt if `package === 'PRO'` 3. Show feature only if `package === 'ADVANCED'` |
| Check feature in client code | Any component | `import { hasFeatureAccess } from '@/lib/package-gates'` then `if (hasFeatureAccess(org.package, 'feature_name'))` |

---

## Backend Gating

### Step 1: Import Required Functions

```typescript
// src/app/api/[orgSlug]/manufacturing/assembly/route.ts

import { ensurePackageAccess } from '@/lib/access';
import { PackageTier } from '@prisma/client';
```

### Step 2: Fetch Organization

```typescript
const org = await prisma.organization.findUnique({
  where: { slug: params.orgSlug },
});

if (!org) {
  return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
}
```

### Step 3: Enforce Package Tier

```typescript
// Allow both PRO and ADVANCED:
await ensurePackageAccess(org.id, [PackageTier.PRO, PackageTier.ADVANCED]);

// OR allow ADVANCED only:
await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
```

### Step 4: Handle Access Errors

```typescript
try {
  // ... API logic
} catch (error: any) {
  if (error?.statusCode === 403) {
    return NextResponse.json(
      { error: 'Upgrade to YourBooks Advanced to use this feature' },
      { status: 403 }
    );
  }
  // ... other error handling
}
```

---

## Frontend Gating

### Gating Navigation (Layout)

In [src/app/(dashboard)/[orgSlug]/layout.tsx](../src/app/(dashboard)/%5BorgSlug%5D/layout.tsx):

```typescript
// 1. Get organization package from session
const orgPackage = organization?.package || 'ADVANCED';
const isPro = orgPackage === 'PRO';

// 2. Mark advanced features in navigation
const navigation = [
  // Pro features (no requiresAdvanced)
  { name: 'Invoicing', href: `/${orgSlug}/invoicing` },
  
  // Advanced features
  {
    name: 'Manufacturing',
    icon: Factory,
    requiresAdvanced: true,  // ← Add this flag
    children: [
      { name: 'BOMs', href: `/${orgSlug}/manufacturing/boms` },
    ],
  },
];

// 3. Filter navigation for Pro users
const filteredNavigation = isPro
  ? navigation.filter((item) => !item.requiresAdvanced)
  : navigation;

// 4. Render filtered navigation
{filteredNavigation.map((item) => (...))}

// 5. Show Pro upgrade CTA
{isPro && (
  <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
    Unlock manufacturing, projects, and automation with YourBooks Advanced.
    <a href={`/${orgSlug}/settings`} className="...">Upgrade</a>
  </div>
)}
```

### Gating Pages

In a feature page (e.g., [src/app/[orgSlug]/manufacturing/assembly/page.tsx](../src/app/%5BorgSlug%5D/manufacturing/assembly/page.tsx)):

```typescript
// 1. Fetch org from session
const loadOrg = async () => {
  const res = await fetch('/api/auth/session');
  if (res.ok) {
    const json = await res.json();
    setOrgInfo(json.data?.organization || null);
  }
};

// 2. Conditional render
return (
  <div>
    {orgInfo?.package === 'PRO' ? (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
        <h2>Assembly builds require YourBooks Advanced</h2>
        <p>Upgrade to unlock manufacturing, projects, and more.</p>
        <a href={`/${orgSlug}/settings`}>Upgrade Now</a>
      </div>
    ) : (
      <>
        {/* Feature content */}
        <form>...</form>
      </>
    )}
  </div>
);
```

### Client-Side Feature Checks

```typescript
import { hasFeatureAccess } from '@/lib/package-gates';

function MyComponent({ organization }) {
  if (!hasFeatureAccess(organization.package, 'manufacturing')) {
    return <UpgradePrompt />;
  }
  
  return <ManufacturingUI />;
}
```

---

## Adding New Gated Features

### Scenario: Gate a new "Advanced Planning" module

#### 1. Add Feature to Gate Definition

File: [src/lib/package-gates.ts](../src/lib/package-gates.ts)

```typescript
export const PACKAGE_FEATURES = {
  PRO: {
    // ... existing
    advancedPlanning: false,  // ← Add here
  },
  ADVANCED: {
    // ... existing
    advancedPlanning: true,   // ← Add here
  },
};
```

#### 2. Gate the API Route

File: `src/app/api/[orgSlug]/planning/forecasts/route.ts`

```typescript
import { ensurePackageAccess } from '@/lib/access';
import { PackageTier } from '@prisma/client';

export async function GET(request, { params }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
  });
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Gate to ADVANCED only
  await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);

  // ... proceed with logic
}
```

#### 3. Gate the Navigation

File: [src/app/(dashboard)/[orgSlug]/layout.tsx](../src/app/(dashboard)/%5BorgSlug%5D/layout.tsx)

```typescript
{
  name: 'Planning',
  icon: LineChart,
  requiresAdvanced: true,  // ← Add this
  children: [
    { name: 'Demand Forecasts', href: `/${orgSlug}/planning/forecasts` },
  ],
},
```

#### 4. Gate the Page

File: `src/app/[orgSlug]/planning/forecasts/page.tsx`

```typescript
// Fetch org in a layout or page effect
// Then conditionally render:

{organization?.package === 'PRO' ? (
  <UpgradePrompt feature="Demand Forecasting" />
) : (
  <PlanningUI />
)}
```

---

## Testing

### Test 1: Verify Pro User Cannot Access Advanced Feature

```bash
# 1. Create/use test org with package = 'PRO'
# 2. Call advanced API endpoint
curl -X POST http://localhost:3000/api/testorg/manufacturing/assembly \
  -H "Content-Type: application/json" \
  -d '{"bomId":"...", ...}'

# Expected: 403 Forbidden with message
# { "error": "Upgrade to YourBooks Advanced to unlock manufacturing, projects, automation, and more." }
```

### Test 2: Verify UI Hides Advanced Features for Pro

```bash
# 1. Log in as Pro user
# 2. Check sidebar – manufacturing, projects, etc. should not appear
# 3. Verify upgrade CTA is visible in sidebar
```

### Test 3: Verify Advanced User Has Full Access

```bash
# 1. Set org package = 'ADVANCED'
# 2. Verify all nav items appear
# 3. Call manufacturing API – should succeed
```

### Test 4: Verify Upgrade Flow

```bash
# 1. Pro user navigates to /manufacturing/assembly directly
# 2. Should see upgrade prompt, not blank page
# 3. Click "Upgrade Now" – should go to settings/upgrade page
```

---

## Common Patterns

### Pattern 1: Simple Feature Check

```typescript
// In a component
if (hasFeatureAccess(org.package, 'manufacturing')) {
  // Show manufacturing
} else {
  // Show upgrade prompt
}
```

### Pattern 2: API Endpoint Gating

```typescript
// In any API route
await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
// or
await ensurePackageAccess(org.id, [PackageTier.PRO, PackageTier.ADVANCED]);
```

### Pattern 3: Navigation Gating

```typescript
// In layout
requiresAdvanced: true  // Hidden from Pro users
```

### Pattern 4: Page Conditional Render

```typescript
// In page.tsx
{org?.package === 'PRO' ? <UpgradePrompt /> : <Feature />}
```

---

## References

- **Feature Definitions**: [src/lib/package-gates.ts](../src/lib/package-gates.ts)
- **Access Control**: [src/lib/access.ts](../src/lib/access.ts)
- **Layout**: [src/app/(dashboard)/[orgSlug]/layout.tsx](../src/app/(dashboard)/%5BorgSlug%5D/layout.tsx)
- **Example**: [src/app/[orgSlug]/manufacturing/assembly/page.tsx](../src/app/%5BorgSlug%5D/manufacturing/assembly/page.tsx)
- **Package Tiers**: [PACKAGE_TIERS.md](../PACKAGE_TIERS.md)
