# Package-Based Navigation System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Login / Session                          │
│                                                                   │
│  User authenticates → Organization package tier loaded           │
│  (STARTER | PROFESSIONAL | ENTERPRISE | ADVANCED)                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Dashboard Layout (layout.tsx)                       │
│                                                                   │
│  1. Fetch session → Get organization package tier                │
│  2. Define navigation with feature keys                          │
│  3. Filter navigation: hasFeature(tier, featureKey)              │
│  4. Render filtered navigation items                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│          Package Features System (package-features.ts)            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  PACKAGE_FEATURES Configuration Matrix              │        │
│  │                                                       │        │
│  │  STARTER          → 9 core features                  │        │
│  │  PROFESSIONAL     → 16 features (STARTER + 7)        │        │
│  │  ENTERPRISE       → 27 features (PRO + 11)           │        │
│  │  ADVANCED         → 35 features (ENT + 8)            │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
│  Helper Functions:                                                │
│  • hasFeature(tier, key) → boolean                               │
│  • getMinimumTier(key) → tier                                    │
│  • needsUpgrade(tier, key) → boolean                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Sidebar Navigation                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────┐          │
│  │ STARTER User Sees:                                │          │
│  │ ✅ Dashboard                                       │          │
│  │ ✅ General Ledger                                 │          │
│  │ ✅ Accounts Receivable                            │          │
│  │ ✅ Accounts Payable                               │          │
│  │ ✅ Payments                                        │          │
│  │ ✅ Banking                                         │          │
│  │ ✅ Basic Inventory                                │          │
│  │ ✅ Basic Reports                                  │          │
│  │ ✅ Settings                                        │          │
│  │                                                    │          │
│  │ 🔒 [Upgrade Prompt]                               │          │
│  │    "Unlock 26 more features..."                   │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                   │
│  ┌───────────────────────────────────────────────────┐          │
│  │ ADVANCED User Sees:                               │          │
│  │ ✅ All 35 Features                                 │          │
│  │ ✅ Dashboard                                       │          │
│  │ ✅ General Ledger                                 │          │
│  │ ✅ ...all core features...                        │          │
│  │ ✅ Manufacturing                                   │          │
│  │ ✅ Quality Management                             │          │
│  │ ✅ Tax & Localization                             │          │
│  │ ✅ Advanced Planning                              │          │
│  │                                                    │          │
│  │ ℹ️  [No upgrade prompt - has everything]          │          │
│  └───────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Access Decision Tree

```
Navigation Item → Has featureKey?
    │
    ├─ YES → Check hasFeature(orgPackage, featureKey)
    │           │
    │           ├─ TRUE  → ✅ Show in navigation
    │           │
    │           └─ FALSE → ❌ Hide from navigation
    │                      └─ Add to missingFeatures list
    │                         └─ Show in upgrade prompt
    │
    └─ NO → ⚠️  Always show (shouldn't happen)
```

## Package Tier Progression

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  STARTER                                                          │
│  ├─ 9 features                                                    │
│  ├─ 3 users max                                                   │
│  ├─ 1 org                                                         │
│  └─ Community support                                             │
│                                                                    │
│  ↓ Upgrade (+$50/mo)                                              │
│                                                                    │
│  PROFESSIONAL                                                     │
│  ├─ 16 features (+7)                                              │
│  ├─ 10 users max (+7)                                             │
│  ├─ 3 orgs (+2)                                                   │
│  └─ Email support (↑)                                             │
│                                                                    │
│  ↓ Upgrade (+$120/mo)                                             │
│                                                                    │
│  ENTERPRISE                                                       │
│  ├─ 27 features (+11)                                             │
│  ├─ 50 users max (+40)                                            │
│  ├─ 10 orgs (+7)                                                  │
│  └─ Priority support (↑)                                          │
│                                                                    │
│  ↓ Upgrade (Custom pricing)                                       │
│                                                                    │
│  ADVANCED                                                         │
│  ├─ 35 features (+8)                                              │
│  ├─ Unlimited users (∞)                                           │
│  ├─ Unlimited orgs (∞)                                            │
│  └─ Dedicated support (↑)                                         │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────┐
│   Page Load     │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│  Fetch User Session        │
│  GET /api/auth/session     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Extract Package Tier      │
│  orgPackage = org.package  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Define Navigation Array   │
│  (with featureKey props)   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Filter Navigation                 │
│  filteredNav = nav.filter(item =>  │
│    hasFeature(orgPackage,          │
│               item.featureKey)     │
│  )                                 │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Calculate Missing Features        │
│  missingFeatures = nav.filter(     │
│    item => !hasFeature(...)        │
│  )                                 │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Render Sidebar                    │
│  • Show filtered navigation        │
│  • Show package badge              │
│  • Show upgrade prompt (if needed) │
└────────────────────────────────────┘
```

## Example: User Clicks Manufacturing Link

### STARTER User:
```
User clicks sidebar
    ↓
Sees no "Manufacturing" link
    ↓
Sees upgrade prompt:
"🔒 Unlock 26 more features including:
 • Manufacturing
 • Quality Management
 • Advanced Planning
 [View Plans] [Upgrade]"
```

### ENTERPRISE User:
```
User clicks "Manufacturing" in sidebar
    ↓
Flyout menu opens with:
 • BOMs
 • Work Orders
    ↓
Clicks "Work Orders"
    ↓
Navigates to /[orgSlug]/manufacturing/work-orders
```

## Database Schema

```prisma
model Organization {
  id      String      @id @default(cuid())
  name    String
  slug    String      @unique
  package PackageTier @default(ADVANCED)
  // ... other fields
}

enum PackageTier {
  STARTER       // $29/mo - Basic features
  PROFESSIONAL  // $79/mo - Standard features  
  ENTERPRISE    // $199/mo - Advanced features
  ADVANCED      // Custom - All features
}
```

## Pricing Page Flow

```
User visits /pricing/comparison
    ↓
Sees 4-column comparison
    ↓
Each column shows:
 • Tier name & badge
 • Price
 • User/org limits
 • Support level
 • Feature count
 • [Get Started] button
    ↓
Below: Feature comparison table
 • Grouped by category
 • Check/X for each tier
    ↓
User clicks [Get Started]
    ↓
Redirects to /register
    ↓
After signup, organization created with selected tier
```

## Key Design Decisions

### 1. Feature Keys Instead of Boolean Flags
**Why:** Scalable and maintainable
```typescript
// ❌ Old way (not scalable)
requiresAdvanced: true

// ✅ New way (scalable)
featureKey: 'manufacturing'
```

### 2. Centralized Feature Matrix
**Why:** Single source of truth
```typescript
// All package features defined in one place
export const PACKAGE_FEATURES: Record<PackageTier, FeatureAccess> = {
  STARTER: { features: [...] },
  PROFESSIONAL: { features: [...] },
  // ...
}
```

### 3. Filter, Don't Hide
**Why:** Better UX than showing locked items
```typescript
// Navigation only shows what user can access
// Not: Show with lock icon (confusing)
// Yes: Only show accessible features (clean)
```

### 4. Contextual Upgrade Prompts
**Why:** Non-intrusive monetization
```typescript
// Only shows when locked features exist
if (missingFeatures.length > 0) {
  showUpgradePrompt()
}
```

## Testing Scenarios

1. **STARTER user logs in**
   - Should see 9 menu items
   - Should see upgrade prompt
   - Badge shows "Starter" in gray

2. **PROFESSIONAL user logs in**
   - Should see 16 menu items
   - May see upgrade prompt (if < ADVANCED)
   - Badge shows "Professional" in blue

3. **ENTERPRISE user logs in**
   - Should see 27 menu items
   - May see upgrade prompt (if < ADVANCED)
   - Badge shows "Enterprise" in purple

4. **ADVANCED user logs in**
   - Should see all 35 menu items
   - Should NOT see upgrade prompt
   - Badge shows "Advanced" with gradient

5. **User upgrades tier**
   - Session refreshed
   - New menu items appear
   - Upgrade prompt updates or disappears
