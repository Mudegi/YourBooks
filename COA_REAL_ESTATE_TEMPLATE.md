# Real Estate Industry - Chart of Accounts Template

## Overview

The **Real Estate Industry Template** provides a comprehensive Chart of Accounts specifically designed for property management, real estate investment, and rental operations. This template includes 33 specialized accounts covering residential and commercial property operations.

**Total Accounts:** 66 (33 Base + 33 Real Estate-Specific)

---

## ✅ Required Accounts - Key Features

### 1. **Rental Income** (4110) ⭐
- **Code:** 4110
- **Name:** Rental Income - Residential
- **Type:** REVENUE (Operating Revenue)
- **System Account:** YES
- **Description:** Residential property rental income
- **Usage:** Record monthly rent payments from residential tenants

### 2. **Tenant Security Deposits** (2130) ⭐ 
- **Code:** 2130
- **Name:** Tenant Security Deposits
- **Type:** LIABILITY (Current Liabilities)
- **System Account:** YES
- **Description:** Security deposits held on behalf of tenants - must be returned
- **⚠️ CRITICAL:** This is a **LIABILITY** account because these funds:
  - Are held on behalf of tenants
  - Must be returned at lease end (minus damages)
  - Are not income until forfeited
  - Create an obligation to the tenant

### 3. **Property Maintenance Expenses** (6210) ⭐
- **Code:** 6210
- **Name:** Property Maintenance Expenses
- **Type:** EXPENSE (Operating Expenses)
- **System Account:** YES
- **Description:** General property maintenance and repairs
- **Usage:** Track routine maintenance, repairs, and upkeep costs

### 4. **Property Taxes** (6250) ⭐
- **Code:** 6250
- **Name:** Property Taxes
- **Type:** EXPENSE (Operating Expenses)
- **System Account:** YES
- **Description:** Real estate property taxes
- **Usage:** Record annual or periodic property tax assessments

---

## 📊 Complete Account Listing

### ASSETS (1000s - 1500s) - 5 Accounts

#### Current Assets - Receivables (1200s)
```
1240 - Rent Receivable [SYSTEM]
       Outstanding rent payments from tenants
       Use: Track late or unpaid rent owed by tenants
```

#### Fixed Assets - Properties (1500s)
```
1520 - Investment Property [SYSTEM]
       Income-generating rental properties
       Use: Record cost basis of rental properties

1525 - Commercial Properties
       Commercial real estate holdings
       Use: Separate tracking for commercial vs residential

1530 - Property Under Development
       Properties being developed or renovated
       Use: Capitalize costs during construction/renovation

1540 - Land Held for Investment
       Undeveloped land holdings
       Use: Land purchased for future development
```

---

### LIABILITIES (2000s) - 4 Accounts

#### Current Liabilities - Tenant Obligations (2100s)
```
2130 - Tenant Security Deposits [SYSTEM] ⭐
       Security deposits held on behalf of tenants - must be returned
       Use: Record security deposits received from tenants
       ⚠️  LIABILITY because funds must be returned

2135 - Prepaid Rent Liability
       Rent collected in advance from tenants
       Use: First/last month rent held until earned

2140 - Tenant Damage Deposits
       Deposits held for potential property damage
       Use: Additional deposits beyond standard security
```

#### Long-term Liabilities (2500s)
```
2500 - Mortgage Payable - Properties
       Property mortgage loans
       Use: Outstanding balance on property loans
```

---

### REVENUE (4000s) - 8 Accounts

#### Operating Revenue - Rental Income (4100s)
```
4110 - Rental Income - Residential [SYSTEM] ⭐
       Residential property rental income
       Use: Primary rental revenue from residential units

4120 - Rental Income - Commercial
       Commercial property rental income
       Use: Rental revenue from commercial tenants

4130 - Parking & Storage Income
       Additional rental income from parking and storage
       Use: Separate revenue stream for parking/storage

4140 - Late Fee Income
       Late payment fees from tenants
       Use: Penalty fees for late rent payments

4150 - Pet Fees & Deposits
       Non-refundable pet fees and deposits
       Use: Pet-related charges (non-refundable portion)
```

#### Property Management Revenue (4200s)
```
4270 - Property Management Fees
       Management service income from third-party properties
       Use: Revenue from managing properties for others
```

#### Other Revenue (4300s)
```
4350 - Lease Cancellation Fees
       Fees for early lease termination
       Use: Penalties when tenants break lease early

4360 - Forfeited Security Deposits
       Non-refundable portion of security deposits
       Use: Security deposit kept due to damages/violations
       Note: Only recognized as revenue when forfeited
```

---

### EXPENSES (6000s) - 16 Accounts

#### Property Maintenance (6200s)
```
6210 - Property Maintenance Expenses [SYSTEM] ⭐
       General property maintenance and repairs
       Use: Routine maintenance and minor repairs

6215 - HVAC Maintenance
       Heating, ventilation, and air conditioning maintenance
       Use: HVAC system servicing and repairs

6220 - Landscaping & Grounds
       Lawn care and exterior maintenance
       Use: Lawn mowing, tree trimming, landscaping

6225 - Pest Control
       Pest management services
       Use: Regular pest control and extermination

6230 - Cleaning & Janitorial
       Common area cleaning services
       Use: Hallways, lobbies, common area cleaning

6235 - Security Services
       Property security and monitoring
       Use: Security guards, alarm monitoring
```

#### Property Operating Costs (6240s-6250s)
```
6240 - Utilities - Common Areas
       Electricity, water, gas for common areas
       Use: Utilities not billed to tenants

6245 - Property Insurance
       Building and liability insurance
       Use: Property insurance premiums

6250 - Property Taxes [SYSTEM] ⭐
       Real estate property taxes
       Use: Annual property tax assessments

6255 - HOA & Condo Fees
       Homeowners association and condo fees
       Use: Monthly HOA or condo association dues
```

#### Property Management & Leasing (6260s-6270s)
```
6260 - Property Management Fees
       Third-party property management costs
       Use: Fees paid to property management companies

6265 - Leasing Commissions
       Real estate agent leasing fees
       Use: Commissions to agents for finding tenants

6270 - Legal & Eviction Costs
       Legal fees and eviction proceedings
       Use: Attorney fees, court costs for evictions
```

#### Vacancy & Turnover Costs (6275s-6285s)
```
6275 - Vacancy Loss
       Lost income from vacant units
       Use: Track revenue loss during vacancy periods

6280 - Turnover Expenses
       Costs to prepare units between tenants
       Use: Cleaning, painting between tenants

6285 - Repairs & Renovations
       Major repairs and property improvements
       Use: Significant repairs or unit upgrades
```

---

## 🏗️ Hierarchical Code Structure

### Asset Categories
```
1200s → Current Assets - Receivables
  ├── 1240: Rent Receivable ⭐

1500s → Fixed Assets - Properties
  ├── 1520: Investment Property ⭐
  ├── 1525: Commercial Properties
  ├── 1530: Property Under Development
  └── 1540: Land Held for Investment
```

### Liability Categories
```
2100s → Current Liabilities - Tenant Obligations
  ├── 2130: Tenant Security Deposits ⭐ (LIABILITY!)
  ├── 2135: Prepaid Rent Liability
  └── 2140: Tenant Damage Deposits

2500s → Long-term Liabilities
  └── 2500: Mortgage Payable - Properties
```

### Revenue Categories
```
4100s → Operating Revenue - Rental Income
  ├── 4110: Rental Income - Residential ⭐
  ├── 4120: Rental Income - Commercial
  ├── 4130: Parking & Storage Income
  ├── 4140: Late Fee Income
  └── 4150: Pet Fees & Deposits

4200s → Property Management Revenue
  └── 4270: Property Management Fees

4300s → Other Revenue
  ├── 4350: Lease Cancellation Fees
  └── 4360: Forfeited Security Deposits
```

### Expense Categories
```
6200s → Property Maintenance & Operations
  ├── 6210: Property Maintenance Expenses ⭐
  ├── 6215: HVAC Maintenance
  ├── 6220: Landscaping & Grounds
  ├── 6225: Pest Control
  ├── 6230: Cleaning & Janitorial
  ├── 6235: Security Services
  ├── 6240: Utilities - Common Areas
  ├── 6245: Property Insurance
  ├── 6250: Property Taxes ⭐
  ├── 6255: HOA & Condo Fees
  ├── 6260: Property Management Fees
  ├── 6265: Leasing Commissions
  ├── 6270: Legal & Eviction Costs
  ├── 6275: Vacancy Loss
  ├── 6280: Turnover Expenses
  └── 6285: Repairs & Renovations
```

---

## 💡 Typical Transaction Flows

### 1. New Tenant Move-In
```typescript
// Receive security deposit (LIABILITY - not income!)
Debit:  1010 - Cash                          $1,500
Credit: 2130 - Tenant Security Deposits      $1,500

// Receive first month's rent
Debit:  1010 - Cash                          $2,000
Credit: 4110 - Rental Income - Residential   $2,000
```

### 2. Monthly Rent Collection
```typescript
// Rent payment received
Debit:  1010 - Cash                          $2,000
Credit: 4110 - Rental Income - Residential   $2,000

// Late fee charged
Debit:  1010 - Cash                          $50
Credit: 4140 - Late Fee Income               $50
```

### 3. Property Maintenance
```typescript
// HVAC repair
Debit:  6215 - HVAC Maintenance              $350
Credit: 1010 - Cash                          $350

// General maintenance
Debit:  6210 - Property Maintenance Expenses $200
Credit: 2010 - Accounts Payable              $200
```

### 4. Tenant Move-Out (No Damages)
```typescript
// Return full security deposit
Debit:  2130 - Tenant Security Deposits      $1,500
Credit: 1010 - Cash                          $1,500

// Turnover costs (cleaning, painting)
Debit:  6280 - Turnover Expenses             $400
Credit: 1010 - Cash                          $400
```

### 5. Tenant Move-Out (With Damages)
```typescript
// Forfeit $500 for damages, return $1,000
Debit:  2130 - Tenant Security Deposits      $1,500
Credit: 1010 - Cash                          $1,000
Credit: 4360 - Forfeited Security Deposits   $500
```

### 6. Property Tax Payment
```typescript
// Annual property tax
Debit:  6250 - Property Taxes                $5,000
Credit: 1010 - Cash                          $5,000
```

### 7. Mortgage Payment
```typescript
// Monthly mortgage payment
Debit:  2500 - Mortgage Payable - Properties $800
Debit:  6700 - Interest Expense              $600
Credit: 1010 - Cash                          $1,400
```

---

## 🔄 Security Deposits - Special Handling

### Why Security Deposits are Liabilities

**CRITICAL CONCEPT:** Security deposits are **NOT income** when received.

```
❌ WRONG:
When receiving security deposit:
Debit:  Cash
Credit: Revenue (Income)  ← INCORRECT!

✅ CORRECT:
When receiving security deposit:
Debit:  Cash
Credit: Tenant Security Deposits (LIABILITY)  ← Correct!
```

**Reasoning:**
1. **Obligation:** You owe this money back to the tenant
2. **Conditional Return:** Only kept if tenant damages property
3. **Not Earned:** You haven't provided any service for this money
4. **Trust Account:** Held in trust on behalf of tenant

### When Security Deposits Become Revenue

Security deposits only become revenue when **forfeited**:

```typescript
// Scenario: $1,500 deposit, $600 in damages

// Option 1: Recognize damages immediately
Debit:  2130 - Tenant Security Deposits      $600
Credit: 4360 - Forfeited Security Deposits   $600

Debit:  2130 - Tenant Security Deposits      $900
Credit: 1010 - Cash                          $900

// Option 2: Recognize after repair costs paid
Debit:  6210 - Property Maintenance          $600
Credit: 1010 - Cash                          $600

Debit:  2130 - Tenant Security Deposits      $1,500
Credit: 1010 - Cash                          $900
Credit: 4360 - Forfeited Security Deposits   $600
```

### Legal Requirements

Many jurisdictions require:
- Separate bank account for security deposits
- Interest payment on deposits
- Itemized deduction statements
- Time limits for return (e.g., 30 days)

---

## 📈 Key Performance Indicators (KPIs)

### Occupancy Metrics
```typescript
// Occupancy Rate
const occupancyRate = (rentedUnits / totalUnits) * 100;

// Average Rent per Unit
const avgRent = totalRentalIncome / rentedUnits;

// Vacancy Loss Rate
const vacancyRate = vacancyLoss / potentialRentalIncome;
```

### Expense Metrics
```typescript
// Maintenance Cost per Unit
const maintenancePerUnit = totalMaintenance / totalUnits;

// Operating Expense Ratio
const operatingExpenseRatio = operatingExpenses / effectiveGrossIncome;

// Net Operating Income (NOI)
const noi = totalRentalIncome - operatingExpenses;
```

### Revenue Metrics
```typescript
// Effective Gross Income
const effectiveGrossIncome = 
  rentalIncome + 
  otherIncome - 
  vacancyLoss;

// Late Fee Revenue %
const lateFeePercent = lateFeeIncome / totalRentalIncome;
```

---

## 🔄 Seeding Engine Format

### Direct Array Access
```typescript
import { getAccountTemplates } from '@/lib/coa-generator';

// Get all Real Estate accounts (base + industry-specific)
const realEstateAccounts = getAccountTemplates('REAL_ESTATE', true);

console.log(`Total accounts: ${realEstateAccounts.length}`);
// Output: Total accounts: 66 (33 base + 33 real estate)

// Filter system accounts
const systemAccounts = realEstateAccounts.filter(a => a.isSystem);
console.log(`System accounts: ${systemAccounts.length}`);
// Output: System accounts: 6
```

### Bulk Database Seeding
```typescript
import { prisma } from '@/lib/prisma';
import { getAccountTemplates } from '@/lib/coa-generator';

async function seedRealEstateAccounts(organizationId: string) {
  const accounts = getAccountTemplates('REAL_ESTATE', true);
  
  for (const account of accounts) {
    await prisma.chartOfAccount.create({
      data: {
        organizationId,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        accountSubType: account.accountSubType,
        description: account.description,
        isSystem: account.isSystem ?? false,
        isActive: true,
        balance: 0,
        currency: 'USD',
      }
    });
  }
}
```

### Automatic Generation (Recommended)
```typescript
import { generateChartOfAccounts } from '@/lib/coa-generator';

// Generates all 66 accounts in a single transaction
const result = await generateChartOfAccounts({
  organizationId: 'org_property_mgmt',
  industryType: 'REAL_ESTATE',
  baseCurrency: 'USD',
});

console.log(`Created ${result.accountsCreated} accounts`);
// Output: Created 66 accounts
```

---

## 📋 Usage Examples

### Option 1: Direct Function Call
```typescript
import { generateChartOfAccounts } from '@/lib/coa-generator';

const result = await generateChartOfAccounts({
  organizationId: 'org_realty_company',
  industryType: 'REAL_ESTATE',
  baseCurrency: 'USD',
});

if (result.success) {
  console.log(`✅ Created ${result.accountsCreated} accounts`);
}
```

### Option 2: REST API
```bash
# Preview accounts before creating
curl http://localhost:3000/api/orgs/realty-company/coa/generate?action=preview&industry=REAL_ESTATE

# Generate accounts
curl -X POST http://localhost:3000/api/orgs/realty-company/coa/generate \
  -H "Content-Type: application/json" \
  -d '{
    "industryType": "REAL_ESTATE"
  }'
```

### Option 3: Check Existing Accounts
```bash
# Check if COA already exists
curl http://localhost:3000/api/orgs/realty-company/coa/generate?action=check
```

---

## 🎯 Best Practices

### Property Accounting
1. **Separate Properties:** Consider using sub-accounts per property
2. **Track NOI:** Calculate Net Operating Income per property
3. **Capitalize Improvements:** Major renovations to Fixed Assets
4. **Expense Repairs:** Routine maintenance to Expense accounts

### Security Deposit Management
1. **Always as Liability:** Never record as revenue initially
2. **Separate Bank Account:** Many states require this
3. **Track Interest:** Pay interest where required
4. **Document Deductions:** Keep detailed records of damages

### Rent Collection
1. **Late Fees:** Separate account for visibility
2. **Aging Reports:** Track rent receivable by age
3. **Bad Debt:** Write off uncollectible rents
4. **Payment Plans:** Document tenant payment arrangements

### Expense Management
1. **Categorize Properly:** Use specific expense accounts
2. **Track Per Unit:** Calculate cost per unit metrics
3. **Budget vs Actual:** Monitor variance monthly
4. **Capital vs Operating:** Distinguish improvement types

---

## 🔍 Account Relationships

### Revenue Cycle
```
Rent Receivable (1240) → Rental Income (4110) → Cash (1010)
```

### Security Deposit Cycle
```
Cash (1010) → Security Deposits (2130) → [Either]
  → Cash (1010) [returned] OR
  → Forfeited Deposits (4360) [kept for damages]
```

### Maintenance Cycle
```
Cash (1010) → Property Maintenance (6210) → [Property Value Maintained]
```

### Property Purchase
```
Cash (1010) → Investment Property (1520)
               + Mortgage Payable (2500) [if financed]
```

---

## 📊 Financial Statement Presentation

### Balance Sheet
```
ASSETS
  Current Assets
    1010 - Cash
    1240 - Rent Receivable
  Fixed Assets
    1520 - Investment Property
    1525 - Commercial Properties
    ...

LIABILITIES
  Current Liabilities
    2130 - Tenant Security Deposits ⭐
    2135 - Prepaid Rent Liability
  Long-term Liabilities
    2500 - Mortgage Payable

EQUITY
  [Standard equity accounts]
```

### Income Statement
```
REVENUE
  4110 - Rental Income - Residential
  4120 - Rental Income - Commercial
  4140 - Late Fee Income
  ...
  Total Revenue

EXPENSES
  6210 - Property Maintenance
  6250 - Property Taxes
  6260 - Property Management Fees
  ...
  Total Expenses

NET OPERATING INCOME (NOI)
```

---

## ✨ Status

**Implementation Date:** December 20, 2025  
**Status:** ✅ Production Ready  
**Verification:** ✅ All tests passing  
**Total Accounts:** 66 (33 Base + 33 Real Estate)  
**System Accounts:** 6  
**Required Accounts:** ✅ All 4 included  

---

## 🚀 Next Steps

1. **Test with Sample Data:** Create test property transactions
2. **Verify Security Deposit Handling:** Ensure LIABILITY treatment
3. **Configure Reports:** Set up NOI and cash flow reports
4. **Train Users:** Emphasize security deposit accounting
5. **State Compliance:** Review local security deposit laws

---

**The Real Estate Industry COA Template is ready for production use!** 🏢
