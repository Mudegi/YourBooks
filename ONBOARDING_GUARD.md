# Onboarding Guard System

## Overview

The **Onboarding Guard** is a comprehensive security layer that ensures users cannot access the dashboard, ledger, or transaction pages without first completing the organization setup. This prevents users from recording transactions in a system that hasn't been properly initialized with its accounting backbone (Chart of Accounts and Company Profile).

---

## 🎯 Purpose

**Prevent premature system access** - Users must complete:
1. ✅ Chart of Accounts (COA) generation
2. ✅ Company Profile setup (legal name, country, currency)
3. ✅ Onboarding completion flag

**Protected Routes:**
- Dashboard (`/[orgSlug]/dashboard`)
- General Ledger (`/[orgSlug]/ledger`, `/[orgSlug]/general-ledger`)
- Transactions (`/[orgSlug]/transactions`, `/[orgSlug]/journals`)
- Invoices & Bills (`/[orgSlug]/invoices`, `/[orgSlug]/bills`)
- All financial operations pages

---

## 🏗️ Architecture

### 3-Layer Protection

```
┌─────────────────────────────────────────────┐
│  1. MIDDLEWARE (Server-Side)                │
│     - Intercepts all requests               │
│     - Checks onboarding status from DB      │
│     - Redirects before page loads           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. REACT HOOK (Client-Side)                │
│     - useOnboardingGuard()                  │
│     - Checks status on mount                │
│     - Shows loading/redirect UI             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. API VALIDATION (Transaction-Level)      │
│     - validateTransactionReadiness()        │
│     - Blocks API calls if not ready         │
│     - Returns clear error messages          │
└─────────────────────────────────────────────┘
```

---

## 📁 Files Created

### 1. Core Guard Logic
**File:** `src/lib/onboarding-guard.ts`  
**Purpose:** Core validation functions

**Functions:**
- `checkOnboardingStatus(organizationId)` - Check by ID
- `checkOnboardingBySlug(orgSlug)` - Check by slug
- `requiresOnboarding(pathname)` - Check if route needs guard
- `checkRouteAccess(pathname, orgId)` - Full route validation
- `validateTransactionReadiness(orgId)` - Transaction-level check

**Constants:**
- `PROTECTED_ROUTES[]` - Array of routes requiring onboarding

### 2. Middleware Integration
**File:** `src/middleware.ts` (updated)  
**Purpose:** Server-side request interceptor

**Changes:**
- Import `checkOnboardingBySlug` and `requiresOnboarding`
- Check onboarding status for protected routes
- Redirect to `/onboarding` if incomplete
- Log reason for redirect

### 3. React Hook
**File:** `src/hooks/useOnboardingGuard.tsx`  
**Purpose:** Client-side guard for pages

**Exports:**
- `useOnboardingGuard()` - Hook for onboarding check
- `withOnboardingGuard()` - HOC to wrap components
- `OnboardingStatusBanner` - UI component to show status

### 4. Status API Route
**File:** `src/app/api/onboarding/status/route.ts`  
**Purpose:** API endpoint to check status

**Endpoint:** `GET /api/onboarding/status`  
**Returns:** Current onboarding status with details

---

## 🔍 How It Works

### Middleware Flow (Server-Side)

```typescript
// User tries to access: /my-org/dashboard

1. Middleware intercepts request
2. Check if route requires onboarding
   → Yes: /dashboard is protected
3. Extract org slug: "my-org"
4. Query database for onboarding status
5. Check three conditions:
   ✓ onboardingCompleted === true
   ✓ chartOfAccounts.length > 0
   ✓ legalName && homeCountry && baseCurrency exist
6. If any false → Redirect to /onboarding
7. If all true → Allow request to proceed
```

### React Hook Flow (Client-Side)

```typescript
// Component using useOnboardingGuard()

1. Component mounts
2. Hook fetches session data
3. Check organization status
4. Check Chart of Accounts exists
5. Check Company Profile complete
6. If incomplete → router.push('/onboarding')
7. If complete → Render component
```

---

## 📖 Usage Examples

### 1. Protecting a Page with Hook

```typescript
'use client';

import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';

export default function DashboardPage() {
  const { loading, completed, hasChartOfAccounts, hasCompanyProfile } = 
    useOnboardingGuard();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If onboarding incomplete, hook automatically redirects
  // This code only runs if onboarding is complete

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  );
}
```

### 2. Using Higher-Order Component

```typescript
import { withOnboardingGuard } from '@/hooks/useOnboardingGuard';

function LedgerPage() {
  return (
    <div>
      <h1>General Ledger</h1>
      {/* Ledger content */}
    </div>
  );
}

// Wrap component with guard
export default withOnboardingGuard(LedgerPage);
```

### 3. Checking Status Without Redirect

```typescript
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';

export default function SettingsPage() {
  // Don't auto-redirect, just check status
  const status = useOnboardingGuard({ redirect: false });

  return (
    <div>
      {!status.completed && (
        <div className="alert alert-warning">
          Please complete onboarding to unlock all features.
        </div>
      )}
      {/* Settings content */}
    </div>
  );
}
```

### 4. Displaying Status Banner

```typescript
import { OnboardingStatusBanner } from '@/hooks/useOnboardingGuard';

export default function Layout({ children }) {
  return (
    <div>
      <OnboardingStatusBanner />
      {children}
    </div>
  );
}
```

### 5. API Route Validation

```typescript
import { validateTransactionReadiness } from '@/lib/onboarding-guard';

export async function POST(request: NextRequest) {
  const { organizationId } = await request.json();

  // Check if organization is ready for transactions
  const validation = await validateTransactionReadiness(organizationId);

  if (!validation.ready) {
    return NextResponse.json({
      success: false,
      error: 'Organization setup incomplete',
      missingRequirements: validation.missingRequirements,
    }, { status: 400 });
  }

  // Proceed with transaction...
}
```

### 6. Manual Status Check

```typescript
import { checkOnboardingStatus } from '@/lib/onboarding-guard';

async function checkOrgSetup(orgId: string) {
  const status = await checkOnboardingStatus(orgId);

  if (!status) {
    console.error('Organization not found');
    return;
  }

  console.log('Onboarding completed:', status.completed);
  console.log('Has COA:', status.hasChartOfAccounts);
  console.log('Has Profile:', status.hasCompanyProfile);

  if (!status.completed) {
    // Handle incomplete onboarding
  }
}
```

---

## 🛡️ Protected Routes

The following routes are automatically protected:

```typescript
const PROTECTED_ROUTES = [
  '/dashboard',              // Main dashboard
  '/ledger',                 // General ledger
  '/general-ledger',         // Alternative ledger URL
  '/accounts',               // Chart of accounts
  '/chart-of-accounts',      // Alternative COA URL
  '/transactions',           // All transactions
  '/journals',               // Journal entries
  '/invoices',               // Sales invoices
  '/bills',                  // Purchase bills
  '/payments',               // Payment processing
  '/customers',              // Customer management
  '/vendors',                // Vendor management
  '/inventory',              // Inventory management
  '/products',               // Product catalog
  '/assets',                 // Fixed assets
  '/reporting',              // Financial reports
  '/financial-statements',   // P&L, Balance Sheet
  '/bank',                   // Bank accounts
  '/reconciliation',         // Bank reconciliation
  '/tax',                    // Tax compliance
  '/compliance',             // Regulatory compliance
  '/payroll',                // Payroll processing
  '/manufacturing',          // Manufacturing module
  '/projects',               // Project tracking
  '/settings',               // Organization settings
];
```

---

## ✅ Onboarding Requirements

### 1. Chart of Accounts (COA)

**Check:**
```sql
SELECT COUNT(*) FROM ChartOfAccount 
WHERE organizationId = ?
```

**Requirement:** At least 1 account exists

**Setup:** User must select industry and generate COA via onboarding wizard

### 2. Company Profile

**Check:**
```sql
SELECT legalName, homeCountry, baseCurrency 
FROM Organization 
WHERE id = ?
```

**Requirement:** All three fields must be non-null

**Setup:** User must complete company details form in onboarding

### 3. Onboarding Completion Flag

**Check:**
```sql
SELECT onboardingCompleted 
FROM Organization 
WHERE id = ?
```

**Requirement:** `onboardingCompleted === true`

**Setup:** Set automatically when user completes all onboarding steps

---

## 🔄 Onboarding Flow

```
┌──────────────────────────────────────────────────┐
│ 1. User Registers & Creates Organization         │
│    - Organization.onboardingCompleted = false    │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 2. Redirected to /onboarding                     │
│    - Select country & compliance pack            │
│    - Enter company details                       │
│    - Select industry type                        │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 3. Generate Chart of Accounts                    │
│    - COA created based on industry               │
│    - 30-66 accounts generated                    │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 4. Complete Onboarding                           │
│    - Organization.onboardingCompleted = true     │
│    - User can now access dashboard               │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 5. Access Granted to All Features                │
│    - Dashboard, ledger, transactions unlocked    │
│    - Can begin recording transactions            │
└──────────────────────────────────────────────────┘
```

---

## 🚨 Error Scenarios

### Scenario 1: No Chart of Accounts

**Detection:**
```typescript
status.hasChartOfAccounts === false
```

**Middleware Action:** Redirect to `/onboarding`  
**API Response:**
```json
{
  "success": false,
  "error": "Chart of Accounts not set up",
  "missingRequirements": ["Chart of Accounts not set up"]
}
```

### Scenario 2: Incomplete Company Profile

**Detection:**
```typescript
status.hasCompanyProfile === false
```

**Missing Data:** `legalName`, `homeCountry`, or `baseCurrency`

**Middleware Action:** Redirect to `/onboarding`  
**Message:** "Company profile information incomplete"

### Scenario 3: Onboarding Not Completed

**Detection:**
```typescript
status.completed === false
```

**Middleware Action:** Redirect to `/onboarding`  
**Message:** "Onboarding process not completed"

### Scenario 4: Database Error

**Middleware Behavior:** Allow request through but log error  
**Reason:** Prevent blocking users due to temporary DB issues

**Log:**
```javascript
console.error('Error checking onboarding status:', error);
```

---

## 🧪 Testing

### Test Cases

#### 1. Test Middleware Protection
```bash
# Setup: Create org without COA
curl -X GET http://localhost:3000/test-org/dashboard \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Expected: 307 Redirect to /onboarding
```

#### 2. Test API Status Check
```bash
curl -X GET http://localhost:3000/api/onboarding/status \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Expected:
{
  "success": true,
  "data": {
    "completed": false,
    "hasChartOfAccounts": false,
    "hasCompanyProfile": true,
    "isReady": false,
    "missingRequirements": ["Chart of Accounts not set up"]
  }
}
```

#### 3. Test Hook Behavior
```typescript
// In a test component
import { renderHook } from '@testing-library/react';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';

test('redirects when onboarding incomplete', async () => {
  const { result } = renderHook(() => useOnboardingGuard());
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(mockRouter.push).toHaveBeenCalledWith('/onboarding');
});
```

#### 4. Test Transaction Validation
```typescript
import { validateTransactionReadiness } from '@/lib/onboarding-guard';

test('blocks transactions when not ready', async () => {
  const result = await validateTransactionReadiness('org_no_coa');
  
  expect(result.ready).toBe(false);
  expect(result.missingRequirements).toContain('Chart of Accounts not set up');
});
```

---

## 📊 Database Schema

### Organization Model
```prisma
model Organization {
  id                      String   @id @default(cuid())
  name                    String
  slug                    String   @unique
  legalName               String?  // ← Required for onboarding
  homeCountry             String   @default("US")  // ← Required
  baseCurrency            String   @default("USD") // ← Required
  onboardingCompleted     Boolean  @default(false) // ← Flag
  chartOfAccounts         ChartOfAccount[]  // ← Must have accounts
  // ... other fields
}
```

### Onboarding Checks
```typescript
interface OnboardingStatus {
  completed: boolean;              // onboardingCompleted flag
  hasChartOfAccounts: boolean;     // chartOfAccounts.length > 0
  hasCompanyProfile: boolean;      // legalName && homeCountry && baseCurrency
  organizationId: string;
  organizationName: string;
}
```

---

## 🎨 UI Components

### Loading State
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking organization setup...</p>
      </div>
    </div>
  );
}
```

### Status Banner
```typescript
<OnboardingStatusBanner />
// Displays:
// ⚠️ Setup Required: Your organization needs to complete the following:
//    Chart of Accounts, Company Profile
//    [Complete setup now →]
```

---

## 🔧 Configuration

### Disable Guard for Testing
```typescript
// In middleware.ts, temporarily disable:
if (process.env.NODE_ENV === 'development' && 
    process.env.DISABLE_ONBOARDING_GUARD === 'true') {
  return NextResponse.next();
}
```

### Add Custom Protected Routes
```typescript
// In onboarding-guard.ts
export const PROTECTED_ROUTES = [
  // ... existing routes
  '/my-custom-route',
];
```

### Custom Redirect URL
```typescript
// In component
const status = useOnboardingGuard({ 
  redirectUrl: '/setup-wizard' 
});
```

---

## 🚀 Benefits

1. **Data Integrity** - No transactions without proper COA structure
2. **User Experience** - Clear onboarding flow with no confusion
3. **Compliance** - Ensures proper accounting setup
4. **Security** - Multi-layer protection (middleware + client + API)
5. **Maintainability** - Centralized guard logic
6. **Performance** - Database check done once per request
7. **Flexibility** - Can disable redirect for specific use cases

---

## 📋 Checklist for Implementation

- [x] Create `onboarding-guard.ts` with core logic
- [x] Update `middleware.ts` with guard checks
- [x] Create `useOnboardingGuard` React hook
- [x] Create `/api/onboarding/status` endpoint
- [x] Define protected routes list
- [x] Add database schema requirements
- [x] Implement error handling
- [x] Add logging for debugging
- [x] Create UI components for status display
- [x] Write comprehensive documentation

---

## 🎯 Status

**Implementation Date:** December 20, 2025  
**Status:** ✅ Complete and Production Ready  
**Protection Layers:** 3 (Middleware, Hook, API)  
**Protected Routes:** 25+ routes  
**Requirements Checked:** 3 (COA, Profile, Flag)

---

**The Onboarding Guard ensures no user can begin recording transactions without a properly initialized accounting system!** 🛡️
