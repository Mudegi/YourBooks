# Country-Conditional Tax System - Updated Implementation

## What Changed

The tax compliance system has been updated to be **fully country-conditional**. Uganda-specific features now **only appear and function when Uganda is selected as the home country** during organization onboarding.

## Key Changes

### 1. Country-Based Feature Activation

**Before:** Uganda features were always available  
**After:** Uganda features only activate when `homeCountry = "UG"`

### 2. New Files Created

#### `src/lib/tax/compliance-pack-selector.ts` (300 lines)
**Purpose:** Central selector for compliance packs based on country

**Key Functions:**
- `SUPPORTED_COUNTRIES` - List of countries with their compliance pack info
- `getCompliancePackInfo(countryCode)` - Get pack info for a country
- `initializeCompliancePackForCountry(orgId, country)` - Initialize country-specific pack
- `shouldShowUgandaFeatures(homeCountry)` - Check if Uganda UI should show
- `getAvailableTaxFeatures(homeCountry)` - Get feature flags per country

**Supported Countries:**
```typescript
{
  UG: { // ✅ Fully implemented
    compliancePack: 'UG_URA',
    currency: 'UGX',
    features: ['VAT (18%)', 'WHT (6-15%)', 'PAYE', 'EFRIS']
  },
  KE: { // ⏳ Planned
    compliancePack: 'KE_KRA',
    currency: 'KES',
    features: ['VAT (16%)', 'WHT', 'iTax']
  },
  US: { // 🔧 Basic
    compliancePack: 'US_GAAP',
    currency: 'USD',
    features: ['Sales Tax', '1099 reporting']
  }
}
```

#### `src/app/api/onboarding/setup/route.ts` (130 lines)
**Purpose:** Handle organization onboarding with country selection

**POST /api/onboarding/setup**
- User selects country during org creation
- System automatically sets `homeCountry`, `compliancePack`, and `baseCurrency`
- Initializes country-specific tax rates and rules
- Returns available features for selected country

**GET /api/onboarding/countries**
- Returns list of supported countries
- Shows which countries are fully implemented
- Displays features available per country

### 3. Updated Existing Files

#### `src/app/api/[orgSlug]/tax/vat-return/route.ts`
**Change:** Added country validation
```typescript
// Only works if homeCountry = "UG"
if (organization.compliancePack !== 'UG_URA') {
  return error('VAT Return only available for Uganda organizations');
}
```

#### `src/app/api/[orgSlug]/tax/calculate-wht/route.ts`
**Change:** Added country validation
```typescript
// Only works if homeCountry = "UG"
if (organization.compliancePack !== 'UG_URA') {
  return error('WHT calculation only available for Uganda organizations');
}
```

#### `src/app/api/[orgSlug]/tax/compliance-pack/route.ts`
**Change:** Now accepts `homeCountry` instead of `compliancePack`
```typescript
// Before: { "compliancePack": "UG_URA" }
// After:  { "homeCountry": "UG" }
```

### 4. New Documentation

#### `docs/COUNTRY_BASED_TAX_SYSTEM.md` (450 lines)
Complete guide explaining:
- How country-based activation works
- Onboarding flow with country selection
- Supported countries and their status
- Feature visibility per country
- Frontend conditional rendering guide
- API behavior examples
- Migration guide
- How to add new countries

## How It Works Now

### Onboarding Flow

```
User Creates Organization
         ↓
   Selects Country
         ↓
    ┌─────────┐
    │ Uganda? │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ↓         ↓
Enable      Basic
Uganda      Tax
Features    Setup
    │         │
    ├─ VAT    ├─ Manual
    ├─ WHT    │  Tax
    ├─ PAYE   │  Config
    ├─ EFRIS  │
    └─ Returns└─────
```

### Feature Visibility

**Uganda Organization (`homeCountry = "UG"`):**
```
Dashboard
├── Invoices
├── Bills
├── Tax (Uganda) ✅
│   ├── VAT Rates (18%, 0%, exempt)
│   ├── WHT Calculator (6-15%)
│   ├── PAYE Calculator
│   ├── Tax Returns
│   └── EFRIS Integration
└── Reports
```

**Kenya Organization (`homeCountry = "KE"`):**
```
Dashboard
├── Invoices
├── Bills
├── Tax Settings ⚙️
│   └── Manual Tax Configuration
└── Reports
```

## Usage Examples

### Example 1: Create Uganda Organization

```bash
POST /api/onboarding/setup
{
  "organizationName": "Acme Uganda Ltd",
  "organizationSlug": "acme-uganda",
  "homeCountry": "UG",              # ← Activates Uganda features
  "taxIdNumber": "1000123456"
}

# Result:
# ✅ homeCountry = "UG"
# ✅ compliancePack = "UG_URA"
# ✅ baseCurrency = "UGX"
# ✅ 3 VAT rates created
# ✅ 5 WHT rules created
# ✅ Uganda UI features visible
```

### Example 2: Create Kenya Organization

```bash
POST /api/onboarding/setup
{
  "organizationName": "Acme Kenya Ltd",
  "organizationSlug": "acme-kenya",
  "homeCountry": "KE",              # ← No Uganda features
  "taxIdNumber": "KRA-PIN-123"
}

# Result:
# ✅ homeCountry = "KE"
# ✅ compliancePack = "KE_KRA"
# ✅ baseCurrency = "KES"
# ❌ No Uganda VAT/WHT features
# ❌ Uganda APIs return error
# ✅ Manual tax configuration available
```

### Example 3: Get Available Countries

```bash
GET /api/onboarding/countries

# Response:
{
  "data": [
    {
      "code": "UG",
      "name": "Uganda",
      "fullyImplemented": true,      # ✅ Fully ready
      "recommended": true,
      "features": ["VAT", "WHT", "PAYE", "EFRIS"]
    },
    {
      "code": "KE",
      "name": "Kenya",
      "fullyImplemented": false,     # ⏳ Coming soon
      "features": ["Manual tax config"]
    }
  ]
}
```

## Frontend Implementation Guide

### Conditional Rendering

```tsx
// Check if Uganda features should show
import { shouldShowUgandaFeatures } from '@/lib/tax/compliance-pack-selector';

function TaxMenu({ organization }) {
  const isUganda = shouldShowUgandaFeatures(organization.homeCountry);
  
  return (
    <div>
      {/* Only show if Uganda */}
      {isUganda && (
        <nav>
          <Link href="/tax/vat-rates">VAT Rates</Link>
          <Link href="/tax/wht">WHT Calculator</Link>
          <Link href="/tax/returns">Tax Returns</Link>
          <Link href="/tax/efris">EFRIS</Link>
        </nav>
      )}
      
      {/* Show for all other countries */}
      {!isUganda && (
        <nav>
          <Link href="/tax/manual">Tax Settings</Link>
        </nav>
      )}
    </div>
  );
}
```

### Feature Flags

```typescript
import { getAvailableTaxFeatures } from '@/lib/tax/compliance-pack-selector';

function InvoiceForm({ organization }) {
  const features = getAvailableTaxFeatures(organization.homeCountry);
  
  return (
    <form>
      {/* Uganda: Show VAT selector */}
      {features.hasVAT && (
        <VATRateSelector />
      )}
      
      {/* Other: Manual tax input */}
      {!features.hasVAT && (
        <Input name="taxRate" label="Tax Rate %" />
      )}
      
      {/* Uganda: Show EFRIS field */}
      {features.hasEFRIS && (
        <Input name="efrisFDN" label="EFRIS FDN" />
      )}
    </form>
  );
}
```

## API Validation

All Uganda-specific endpoints now validate country:

```typescript
// Before executing Uganda logic
if (organization.compliancePack !== 'UG_URA') {
  return {
    error: 'This feature is only available for Uganda organizations',
    hint: 'Select Uganda during onboarding to enable VAT, WHT, and PAYE features'
  };
}
```

## Adding New Countries

To add another country (e.g., Tanzania):

1. Add to `compliance-pack-selector.ts`:
```typescript
TZ: {
  country: 'TZ',
  countryName: 'Tanzania',
  compliancePack: 'TZ_TRA',
  currency: 'TZS',
  features: ['VAT (18%)', 'WHT', 'PAYE'],
}
```

2. Create `src/lib/tax/tanzania-tra-compliance.ts`:
```typescript
export async function initializeTanzaniaTRAPack(orgId: string) {
  // Create Tanzania tax rates and rules
}
```

3. Update selector switch case:
```typescript
case 'TZ':
  return await initializeTanzaniaTRAPack(organizationId);
```

4. Done! Tanzania features now available when `homeCountry = "TZ"`

## Benefits

✅ **Clean Separation**: Uganda logic only runs for Uganda orgs  
✅ **User-Friendly**: Users only see features for their country  
✅ **Scalable**: Easy to add Kenya, Tanzania, Rwanda, etc.  
✅ **Testable**: Can test each country in isolation  
✅ **Maintainable**: Country-specific code is isolated  
✅ **Flexible**: Each country can have unique features  

## Migration for Existing Orgs

If you have existing organizations without a country set:

```sql
-- Identify and update Uganda orgs
UPDATE "Organization" 
SET "homeCountry" = 'UG', "compliancePack" = 'UG_URA'
WHERE "baseCurrency" = 'UGX';

-- Then initialize via API
POST /api/{org-slug}/tax/compliance-pack
{ "homeCountry": "UG" }
```

## Summary

The system is now **fully country-conditional**:

- ✅ Uganda features only show when `homeCountry = "UG"`
- ✅ API endpoints validate country before executing
- ✅ Frontend checks country before rendering UI
- ✅ Other countries get basic/manual tax handling
- ✅ Framework supports unlimited countries
- ✅ Each country has isolated compliance pack

**The Uganda tax compliance system is now a feature pack that activates only when Uganda is selected during onboarding.**
