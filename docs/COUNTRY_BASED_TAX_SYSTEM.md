# Country-Based Tax Compliance System

## Overview

YourBooks ERP includes a **country-conditional tax compliance system** where tax features are automatically activated based on the organization's home country selected during onboarding. 

**Uganda-specific features (VAT, WHT, PAYE, EFRIS) only appear and function when Uganda is selected as the home country.**

## How It Works

### 1. During Onboarding

When creating a new organization, the user selects their **home country**:

```
┌─────────────────────────────────────┐
│   Organization Setup                │
│                                     │
│   Name: Acme Corporation           │
│   Country: [Uganda ▼]              │  ← User selects country
│                                     │
│   ✓ Uganda (UG) - Fully Supported  │
│     • VAT (18%, 0%, exempt)        │
│     • WHT (6-15%)                  │
│     • PAYE (Progressive)           │
│     • EFRIS Integration            │
│                                     │
│   ○ Kenya (KE) - Coming Soon       │
│   ○ Tanzania (TZ) - Coming Soon    │
│   ○ United States (US)             │
│   ○ Other Countries                │
└─────────────────────────────────────┘
```

**What Happens Automatically:**

1. ✅ Organization created with `homeCountry = "UG"`
2. ✅ `compliancePack = "UG_URA"` set automatically
3. ✅ Base currency set to `UGX` (Ugandan Shilling)
4. ✅ 3 VAT rates created (18%, 0%, exempt)
5. ✅ 5 WHT rules created (6-15% on various services)
6. ✅ Uganda-specific UI features become visible
7. ✅ Uganda tax calculations enabled

### 2. Feature Visibility

**For Uganda Organizations (`homeCountry = "UG"`):**
- ✅ VAT Management (18%, 0%, exempt)
- ✅ WHT Calculator
- ✅ PAYE Calculator
- ✅ EFRIS Integration
- ✅ Input Tax Credit Validation
- ✅ Monthly VAT Returns
- ✅ Monthly WHT Returns
- ✅ Tax rate configuration

**For Other Countries (e.g., `homeCountry = "KE"`):**
- ❌ Uganda VAT features hidden
- ❌ Uganda WHT calculator disabled
- ❌ EFRIS integration not shown
- ✅ Basic tax handling available
- ✅ Manual tax configuration

### 3. API Behavior

All Uganda-specific endpoints check the country before executing:

```typescript
// Example: VAT Return API
if (organization.compliancePack !== 'UG_URA') {
  return {
    error: 'VAT Return only available for Uganda organizations'
  };
}
```

## Onboarding Flow

### API: Create Organization with Country Selection

```bash
POST /api/onboarding/setup
Content-Type: application/json

{
  "organizationName": "Acme Uganda Ltd",
  "organizationSlug": "acme-uganda",
  "homeCountry": "UG",              # ← Country selection
  "legalName": "Acme Uganda Limited",
  "taxIdNumber": "1000123456",      # URA TIN
  "tradingLicense": "BL-2024-001",
  "address": "Plot 123, Kampala Road",
  "phone": "+256700123456",
  "email": "info@acme.co.ug"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org_abc123",
      "name": "Acme Uganda Ltd",
      "slug": "acme-uganda",
      "homeCountry": "UG",
      "compliancePack": "UG_URA",
      "baseCurrency": "UGX"
    },
    "compliancePack": {
      "name": "Uganda",
      "pack": "UG_URA",
      "features": [
        "VAT (18% standard, 0% zero-rated, exempt)",
        "WHT (6-15% on various services)",
        "PAYE (Progressive income tax)",
        "EFRIS e-Invoicing integration",
        "Input Tax Credit validation",
        "One-click monthly tax returns"
      ],
      "initialized": true,
      "message": "Uganda URA compliance pack initialized successfully"
    }
  }
}
```

### API: Get Available Countries

```bash
GET /api/onboarding/countries
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "UG",
      "name": "Uganda",
      "currency": "UGX",
      "compliancePack": "UG_URA",
      "features": [
        "VAT (18% standard, 0% zero-rated, exempt)",
        "WHT (6-15% on various services)",
        "PAYE (Progressive income tax)",
        "EFRIS e-Invoicing integration"
      ],
      "taxTypes": ["VAT", "WHT", "PAYE"],
      "fullyImplemented": true,
      "recommended": true
    },
    {
      "code": "KE",
      "name": "Kenya",
      "currency": "KES",
      "compliancePack": "KE_KRA",
      "features": [
        "VAT (16% standard)",
        "WHT on various payments",
        "iTax integration (planned)"
      ],
      "taxTypes": ["VAT", "WHT", "PAYE"],
      "fullyImplemented": false,
      "recommended": false
    },
    {
      "code": "US",
      "name": "United States",
      "currency": "USD",
      "compliancePack": "US_GAAP",
      "features": [
        "State-level sales tax",
        "Form 1099 reporting"
      ],
      "taxTypes": ["SALES_TAX", "INCOME_TAX"],
      "fullyImplemented": false,
      "recommended": false
    }
  ]
}
```

## Supported Countries

| Country | Code | Compliance Pack | Status | Features |
|---------|------|----------------|--------|----------|
| **Uganda** | UG | UG_URA | ✅ **Fully Implemented** | VAT, WHT, PAYE, EFRIS |
| Kenya | KE | KE_KRA | ⏳ Planned | VAT, WHT, PAYE, iTax |
| Tanzania | TZ | TZ_TRA | ⏳ Planned | VAT, WHT, PAYE |
| Rwanda | RW | RW_RRA | ⏳ Planned | VAT, WHT, PAYE |
| United States | US | US_GAAP | 🔧 Basic | Sales Tax, 1099 |
| Other | DEFAULT | DEFAULT | 🔧 Manual | Custom configuration |

## Uganda-Specific Features (Only When UG Selected)

### 1. VAT Management
- **18% Standard Rate**: Most goods and services
- **0% Zero-Rated**: Exports, basic foods, medical supplies
- **Exempt**: Financial services, education, residential rent
- **Input Tax Credit**: Requires EFRIS e-receipt

### 2. WHT Calculation
- **6%**: Professional services, rent, contractors
- **10%**: Commission
- **15%**: Management fees, interest, dividends, royalties
- **Automatic**: Applied when payment exceeds threshold

### 3. PAYE (Income Tax)
- **Progressive Brackets**: 0%, 10%, 20%, 30%, 40%
- **Monthly Deduction**: Automatic calculation
- **Bracket Breakdown**: Detailed per-tier calculation

### 4. EFRIS Integration
- **e-Invoicing**: Automatic invoice submission to URA
- **e-Receipts**: Validates supplier receipts for ITC
- **FDN & QR Codes**: Stored on each invoice

### 5. Monthly Tax Returns
- **VAT Return**: One-click generation with transaction breakdown
- **WHT Return**: Automatic aggregation by WHT type
- **Filing Due Date**: 15th of following month

## Usage Examples

### Example 1: Uganda Organization

```typescript
// 1. Onboarding selects Uganda
POST /api/onboarding/setup
{ "homeCountry": "UG", ... }

// 2. Uganda features automatically available
POST /api/acme-uganda/invoices
{
  "items": [{
    "description": "Services",
    "unitPrice": 10000000,
    "taxRateId": "rate_standard_vat",  // ✅ 18% VAT available
    "taxCategory": "VAT_STANDARD_18"
  }]
}

// 3. Generate Uganda VAT Return
POST /api/acme-uganda/tax/vat-return    // ✅ Works
{ "startDate": "2025-12-01", "endDate": "2025-12-31" }
```

### Example 2: Kenya Organization (Not Yet Implemented)

```typescript
// 1. Onboarding selects Kenya
POST /api/onboarding/setup
{ "homeCountry": "KE", ... }

// 2. Uganda features NOT available
POST /api/acme-kenya/tax/vat-return    // ❌ Error
// Response: "VAT Return only available for Uganda organizations"

// 3. Manual tax configuration instead
POST /api/acme-kenya/tax-rates
{
  "name": "Kenya VAT",
  "rate": 16.00,
  "taxType": "VAT"
}
```

### Example 3: US Organization

```typescript
// 1. Onboarding selects United States
POST /api/onboarding/setup
{ "homeCountry": "US", ... }

// 2. Basic features available, no Uganda logic
POST /api/acme-us/invoices
{
  "items": [{
    "description": "Services",
    "unitPrice": 10000,
    "taxRate": 8.5,  // Manual sales tax
    "taxAmount": 850
  }]
}

// 3. Uganda features hidden
POST /api/acme-us/tax/vat-return    // ❌ Error
// Response: "VAT Return only available for Uganda organizations"
```

## Frontend Conditional Rendering (Implementation Guide)

### Check Country Before Showing Features

```typescript
// src/lib/tax/feature-flags.ts

export function shouldShowTaxFeatures(organization: Organization) {
  return {
    // Uganda-specific
    showUgandaVAT: organization.homeCountry === 'UG',
    showUgandaWHT: organization.homeCountry === 'UG',
    showUgandaPAYE: organization.homeCountry === 'UG',
    showEFRIS: organization.homeCountry === 'UG',
    showVATReturns: organization.homeCountry === 'UG',
    showWHTReturns: organization.homeCountry === 'UG',
    
    // Kenya-specific (when implemented)
    showKenyaVAT: organization.homeCountry === 'KE',
    
    // Generic
    showManualTax: !['UG', 'KE'].includes(organization.homeCountry),
  };
}
```

### Example: Conditional Menu Items

```tsx
// src/components/Navigation.tsx

import { shouldShowTaxFeatures } from '@/lib/tax/feature-flags';

export function Navigation({ organization }) {
  const taxFeatures = shouldShowTaxFeatures(organization);
  
  return (
    <nav>
      <NavItem href="/dashboard">Dashboard</NavItem>
      <NavItem href="/invoices">Invoices</NavItem>
      
      {/* Uganda Tax Features - Only show if UG selected */}
      {taxFeatures.showUgandaVAT && (
        <NavGroup label="Tax (Uganda)">
          <NavItem href="/tax/vat-rates">VAT Rates</NavItem>
          <NavItem href="/tax/wht-calculator">WHT Calculator</NavItem>
          <NavItem href="/tax/returns">Tax Returns</NavItem>
          <NavItem href="/tax/efris">EFRIS</NavItem>
        </NavGroup>
      )}
      
      {/* Kenya Tax Features - Only show if KE selected */}
      {taxFeatures.showKenyaVAT && (
        <NavGroup label="Tax (Kenya)">
          <NavItem href="/tax/kra">KRA Settings</NavItem>
        </NavGroup>
      )}
      
      {/* Manual Tax - For other countries */}
      {taxFeatures.showManualTax && (
        <NavGroup label="Tax Settings">
          <NavItem href="/tax/manual">Configure Tax Rates</NavItem>
        </NavGroup>
      )}
    </nav>
  );
}
```

### Example: Invoice Form

```tsx
// src/components/InvoiceForm.tsx

export function InvoiceForm({ organization }) {
  const taxFeatures = shouldShowTaxFeatures(organization);
  
  return (
    <form>
      <Input name="description" label="Description" />
      <Input name="amount" label="Amount" />
      
      {/* Uganda: Show VAT rate selector */}
      {taxFeatures.showUgandaVAT && (
        <Select name="taxRateId" label="VAT Rate">
          <option value="rate_standard">Standard VAT (18%)</option>
          <option value="rate_zero">Zero-rated (0%)</option>
          <option value="rate_exempt">Exempt</option>
        </Select>
      )}
      
      {/* Other countries: Manual tax input */}
      {taxFeatures.showManualTax && (
        <Input name="taxRate" label="Tax Rate (%)" type="number" />
      )}
    </form>
  );
}
```

## Migration Guide

### For Existing Organizations

If you have existing organizations without a country set:

```sql
-- Set country for existing orgs (one-time)
UPDATE "Organization" 
SET "homeCountry" = 'UG', "compliancePack" = 'UG_URA'
WHERE "baseCurrency" = 'UGX';  -- Identify Uganda orgs by currency

-- Then initialize compliance pack via API
POST /api/each-org/tax/compliance-pack
{ "homeCountry": "UG" }
```

## Adding New Countries

To add support for another country (e.g., Kenya):

1. **Add to `compliance-pack-selector.ts`:**
```typescript
KE: {
  country: 'KE',
  countryName: 'Kenya',
  compliancePack: 'KE_KRA',
  currency: 'KES',
  features: ['VAT (16% standard)', 'WHT', 'iTax integration'],
  taxTypes: ['VAT', 'WHT', 'PAYE'],
}
```

2. **Create compliance pack file:**
```typescript
// src/lib/tax/kenya-kra-compliance.ts
export async function initializeKenyaKRAPack(orgId: string) {
  // Create Kenya-specific tax rates and rules
}
```

3. **Update `initializeCompliancePackForCountry()`:**
```typescript
case 'KE':
  return await initializeKenyaKRAPack(organizationId);
```

4. **Kenya features now available when `homeCountry = "KE"`**

## Key Benefits

1. **🎯 Targeted Compliance**: Only shows relevant features for each country
2. **🚀 Easy Expansion**: Add new countries without affecting existing ones
3. **🔒 Data Isolation**: Uganda logic only runs for Uganda organizations
4. **💡 User-Friendly**: Users only see features applicable to their country
5. **🧪 Testable**: Can test country-specific features in isolation
6. **📈 Scalable**: Framework supports unlimited countries

## Summary

- ✅ Uganda features **only activate when Uganda is selected** during onboarding
- ✅ Other countries get basic tax handling or manual configuration
- ✅ Frontend conditionally renders Uganda-specific UI elements
- ✅ API endpoints validate country before executing Uganda logic
- ✅ Easy to add new countries (Kenya, Tanzania, Rwanda, etc.)
- ✅ No Uganda features visible to non-Uganda organizations

The system is **country-conditional by design** - Uganda tax compliance is a feature pack that activates only when Uganda is chosen as the home country.
