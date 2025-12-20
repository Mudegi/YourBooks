# Quick Reference: Package Tier Gating

## One-Liner Checks

```typescript
// Check feature access
import { hasFeatureAccess } from '@/lib/package-gates';
if (hasFeatureAccess(org.package, 'manufacturing')) { /* ... */ }

// Enforce in API
import { ensurePackageAccess } from '@/lib/access';
import { PackageTier } from '@prisma/client';
await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
```

---

## Gating by Context

### Backend API Routes

```typescript
// At start of handler after org lookup
try {
  await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
  // Proceed with logic
} catch (error: any) {
  if (error?.statusCode === 403) {
    return NextResponse.json(
      { error: 'Upgrade to YourBooks Advanced' },
      { status: 403 }
    );
  }
}
```

### Frontend Pages

```typescript
// In component state
const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);

// Fetch org via session
const res = await fetch('/api/auth/session');
const org = await res.json().data.organization;
setOrgInfo(org);

// Conditional render
return org?.package === 'PRO' ? <UpgradePrompt /> : <Feature />;
```

### Navigation Items

```typescript
// In layout.tsx
{
  name: 'Manufacturing',
  icon: Factory,
  requiresAdvanced: true,  // ← Add this
  children: [...]
}

// Then filter
const filteredNav = isPro 
  ? navigation.filter(item => !item.requiresAdvanced)
  : navigation;
```

---

## Feature Names (from PACKAGE_FEATURES)

| Feature | Pro | Advanced |
|---------|-----|----------|
| ledger | ✓ | ✓ |
| invoicing | ✓ | ✓ |
| manufacturing | ✗ | ✓ |
| fixedAssets | ✗ | ✓ |
| budgeting | ✗ | ✓ |
| projects | ✗ | ✓ |
| hcm | ✗ | ✓ |
| crm | ✗ | ✓ |
| warehouse | ✗ | ✓ |
| advancedReporting | ✗ | ✓ |
| compliance | ✗ | ✓ |
| planning | ✗ | ✓ |
| costing | ✗ | ✓ |
| quality | ✗ | ✓ |

---

## Common Patterns

### Pattern: API Route (Advanced Only)

```typescript
import { ensurePackageAccess } from '@/lib/access';
import { PackageTier } from '@prisma/client';

export async function POST(request, { params }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
  });
  
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  // Gate it
  await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
  
  // Your logic here
}
```

### Pattern: Page (Pro Upgrade Prompt)

```typescript
export default function Page() {
  const [org, setOrg] = useState(null);
  
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json())
      .then(json => setOrg(json.data?.organization));
  }, []);
  
  if (org?.package === 'PRO') {
    return (
      <div className="...">
        <h2>Upgrade Required</h2>
        <p>This feature requires YourBooks Advanced.</p>
        <a href={`/${orgSlug}/settings`}>Upgrade Now</a>
      </div>
    );
  }
  
  return <FeatureContent />;
}
```

### Pattern: Navigation (Hide from Pro)

```typescript
// Add to nav item
{ requiresAdvanced: true }

// Filter in layout
const filteredNav = isPro 
  ? navigation.filter(item => !item.requiresAdvanced)
  : navigation;
```

---

## Error Handling

### 403 from API

```typescript
const res = await fetch('/api/manufacturing/assembly', {
  method: 'POST',
  body: JSON.stringify(payload),
});

if (res.status === 403) {
  const error = await res.json();
  // Show: "Upgrade to YourBooks Advanced"
}
```

### Client-Side Check

```typescript
if (!hasFeatureAccess(org.package, 'manufacturing')) {
  // Show upgrade prompt
  return <UpgradePrompt />;
}
```

---

## Database

### Check Org Package

```sql
SELECT slug, package FROM "Organization" WHERE slug = 'mycompany';
-- Returns: mycompany | PRO
```

### Update Org Package

```sql
UPDATE "Organization" 
SET "package" = 'ADVANCED' 
WHERE slug = 'mycompany';
```

### Default All to Advanced

```sql
UPDATE "Organization" 
SET "package" = 'ADVANCED' 
WHERE "package" IS NULL;
```

---

## Testing

### Pro User Flow

```bash
# 1. Set org to PRO
UPDATE "Organization" SET package = 'PRO' WHERE slug = 'test-org';

# 2. Log in, verify nav items hidden
# 3. Try API call, expect 403
curl -X POST http://localhost:3000/api/test-org/manufacturing/assembly ...

# 4. Expect response:
# { "error": "Upgrade to YourBooks Advanced..." }
```

### Advanced User Flow

```bash
# 1. Set org to ADVANCED (default)
UPDATE "Organization" SET package = 'ADVANCED' WHERE slug = 'test-org';

# 2. Log in, verify all nav visible
# 3. Try API call, expect success (200 or 422 for validation, not 403)
```

---

## Docs & Files

| Purpose | File |
|---------|------|
| Feature list | [PACKAGE_TIERS.md](PACKAGE_TIERS.md) |
| Implementation guide | [PACKAGE_GATE_GUIDE.md](PACKAGE_GATE_GUIDE.md) |
| Full summary | [PACKAGE_TIER_IMPLEMENTATION.md](PACKAGE_TIER_IMPLEMENTATION.md) |
| Feature flags | [src/lib/package-gates.ts](src/lib/package-gates.ts) |
| Access control | [src/lib/access.ts](src/lib/access.ts) |
| Example: Assembly API | [src/app/api/[orgSlug]/manufacturing/assembly/route.ts](src/app/api/%5BorgSlug%5D/manufacturing/assembly/route.ts) |
| Example: Assembly UI | [src/app/[orgSlug]/manufacturing/assembly/page.tsx](src/app/%5BorgSlug%5D/manufacturing/assembly/page.tsx) |
| Example: Navigation | [src/app/(dashboard)/[orgSlug]/layout.tsx](src/app/(dashboard)/%5BorgSlug%5D/layout.tsx) |
