# Professional Chart of Accounts Implementation

## Overview
Enterprise-grade hierarchical Chart of Accounts (COA) with multi-currency support, country-specific localization, and advanced financial controls.

## Architecture

### 1. Database Schema (Enhanced ChartOfAccount Model)

**New Professional Fields:**
```prisma
model ChartOfAccount {
  // ... existing fields
  
  // Professional Enterprise Features
  allowManualJournal Boolean   @default(true)   // Prevents manual posting to system accounts
  foreignBalance     Decimal?  @db.Decimal(15, 2) // Original currency balance for multi-currency
  level              Int       @default(0)       // Hierarchical depth (0=parent, 1=child)
  hasChildren        Boolean   @default(false)   // Tree optimization flag
  fullPath           String?                     // Materialized path (e.g., "1000/1010/1011")
  tags               String[]  @default([])      // Flexible categorization (Cost Centers, Departments)
  metadata           Json?                       // Extensibility for custom fields
  
  // Indexes for performance
  @@index([organizationId, level])
  @@index([organizationId, fullPath])
  @@index([organizationId, tags])
}
```

**Key Enhancements:**
- **allowManualJournal**: System accounts (AR, AP, Inventory, Retained Earnings) cannot accept manual journal entries
- **foreignBalance**: Tracks original currency amounts for multi-currency accounts
- **level**: Enables efficient hierarchical queries (parent accounts at level 0)
- **hasChildren**: Optimization flag - parent accounts cannot be posted to directly
- **fullPath**: Materialized path for fast subtree queries
- **tags**: Flexible dimensions (Cost Centers, Projects, Departments)

---

## 2. Country-Specific Localization

### COA Localization Manager (`src/services/gl/coa-localization.manager.ts`)

**Design Pattern:** Strategy Pattern for country-specific COA templates

**Supported Standards:**
- **Uganda (UG)**: ICPASU-compliant with VAT, WHT, PAYE, NSSF
- **United States (US)**: GAAP-compliant (extensible)
- **International (XX)**: IFRS-compliant (extensible)

**Uganda ICPASU Template Highlights:**
```typescript
{
  code: "1020",
  name: "Bank Account - UGX",
  accountType: "ASSET",
  accountSubType: "Current Assets",
  currency: "UGX",
  level: 1,
  parentCode: "1000",
  isBankAccount: true,
  allowManualJournal: true
}

{
  code: "2100",
  name: "VAT Payable",
  accountType: "LIABILITY",
  accountSubType: "Current Liabilities - Tax",
  level: 1,
  parentCode: "2000",
  allowManualJournal: false, // System-controlled
  isSystem: true
}

{
  code: "2120",
  name: "Withholding Tax Payable",
  accountType: "LIABILITY",
  accountSubType: "Current Liabilities - Tax",
  level: 1,
  parentCode: "2000",
  allowManualJournal: false, // System-controlled
  isSystem: true
}
```

**Account Code Validation:**
- **1000-1999**: Assets
- **2000-2999**: Liabilities
- **3000-3999**: Equity
- **4000-4999**: Revenue
- **5000-9999**: Expenses

**Usage:**
```typescript
const coaTemplate = COALocalizationManager.getStandardCOA(
  organization.homeCountry, // "UG"
  organization.baseCurrency  // "UGX"
);

// Returns: {
//   templates: AccountTemplate[],
//   countryCode: "UG",
//   baseCurrency: "UGX"
// }
```

---

## 3. GL Service (`src/services/gl/gl.service.ts`)

### Core Methods

#### `initializeCOA(organizationId, countryCode, baseCurrency)`
**Purpose:** Initialize COA for new organizations using localized templates

**Process:**
1. Fetch country-specific template via `COALocalizationManager.getStandardCOA()`
2. Sort templates by level (parents before children)
3. Create accounts in transaction with parent-child relationships
4. Update `hasChildren` flags automatically
5. Return success status and account count

**Example:**
```typescript
const result = await glService.initializeCOA(
  "org_123",
  "UG",
  "UGX"
);

// result: { success: true, accountsCreated: 47 }
```

#### `createAccount(organizationId, data)`
**Purpose:** Create new account with hierarchy validation

**Validations:**
- Account code matches type (1000-1999 for ASSET)
- Parent exists and has same type
- Auto-calculates level from parent
- Builds fullPath materialized path
- Updates parent's hasChildren flag

**Example:**
```typescript
const account = await glService.createAccount("org_123", {
  code: "1025",
  name: "Petty Cash",
  accountType: "ASSET",
  parentId: "parent_account_id",
  allowManualJournal: true,
  tags: ["Head Office", "Finance"]
});
```

#### `getAccountHierarchy(organizationId, options)`
**Purpose:** Retrieve hierarchical tree structure

**Features:**
- Returns nested parent-child structure
- Optional filters: accountType, includeInactive, maxDepth
- Sorted by code
- Includes balance, level, hasChildren

**Example:**
```typescript
const tree = await glService.getAccountHierarchy("org_123", {
  accountType: "ASSET",
  includeInactive: false
});

// Returns:
// [
//   {
//     id: "...",
//     code: "1000",
//     name: "Assets",
//     balance: 150000,
//     level: 0,
//     hasChildren: true,
//     children: [
//       { code: "1010", name: "Cash", level: 1, ... },
//       { code: "1020", name: "Bank", level: 1, ... }
//     ]
//   }
// ]
```

#### `calculateHierarchicalBalances(organizationId, asOfDate?)`
**Purpose:** Calculate parent account balances as sum of children

**Algorithm:**
1. Fetch all accounts with ledger entries
2. Calculate individual balances (debit - credit)
3. Recursively roll up children balances to parents
4. Track foreign currency balances separately

**Example:**
```typescript
const balances = await glService.calculateHierarchicalBalances("org_123");

// balances: [
//   { accountId: "...", code: "1000", balance: 150000, children: [...] },
//   { accountId: "...", code: "1010", balance: 50000, foreignBalance: 1000 }
// ]
```

#### `validatePosting(organizationId, accountId, isManualEntry)`
**Purpose:** Pre-validate journal entry posting

**Checks:**
- Account exists and is active
- If manual entry, `allowManualJournal` must be true
- Cannot post to parent accounts (`hasChildren` must be false)

**Example:**
```typescript
const validation = await glService.validatePosting("org_123", "account_id", true);

// validation: {
//   valid: false,
//   errors: [
//     "Account 'Accounts Receivable' does not allow manual journal entries. It is system-controlled.",
//     "Cannot post directly to parent accounts. Post to child accounts only."
//   ]
// }
```

#### `updateAccountBalance(accountId, amount, isDebit)`
**Purpose:** Update account balance after ledger entry

**Process:**
- Fetch current balance
- Apply delta (debit adds, credit subtracts)
- Update balance atomically

---

## 4. Professional Tree View UI

### Component: `chart-of-accounts/page.tsx`

**Features:**
1. **Hierarchical Tree Display**
   - Expand/collapse parent accounts
   - Visual indentation per level (24px per depth)
   - Parent nodes in bold with chevron icons
   - Child nodes indented beneath

2. **Multi-Currency Indicators**
   - 🌐 Globe icon for foreign currency accounts
   - Base currency balance column
   - Foreign balance column (if applicable)
   - Blue highlight for multi-currency accounts

3. **Account Controls**
   - 🔓 Unlock icon: Allows manual posting
   - 🔒 Lock icon: System-controlled (AR, AP, Inventory)
   - "Parent" badge: Indicates rollup account

4. **Smart Filtering**
   - Search by code or name
   - Filter by account type (ASSET, LIABILITY, etc.)
   - Show/hide inactive accounts toggle
   - Expand All / Collapse All buttons

5. **Visual Feedback**
   - Inactive accounts: Grayed out, reduced opacity
   - Hover effects on rows
   - Color-coded account types (badges)
   - Balance color coding (normal vs abnormal)

6. **Summary Dashboard**
   - 5 cards showing totals per account type
   - Active account count per type
   - Total balance per type in base currency

**Balance Color Logic:**
- **Normal balances** (dark): 
  - Assets/Expenses: Positive (debit balance)
  - Liabilities/Equity/Revenue: Positive (credit balance)
- **Abnormal balances** (red warning):
  - Opposite of above

**Tree Navigation:**
```
1000 - Assets (Parent) 🔓                           150,000.00
  ├─ 1010 - Cash 🔓                                  50,000.00
  ├─ 1020 - Bank - UGX 🔓                            75,000.00
  └─ 1021 - Bank - USD 🌐 🔓                         25,000.00    $500.00
2000 - Liabilities (Parent) 🔓                      50,000.00
  ├─ 2100 - VAT Payable 🔒                           15,000.00
  ├─ 2120 - WHT Payable 🔒                            5,000.00
  └─ 2200 - PAYE Payable 🔒                          10,000.00
```

---

## 5. Integration Points

### Invoice/Bill Service Integration
- **AR Account**: System posts receivables automatically (allowManualJournal=false)
- **AP Account**: System posts payables automatically (allowManualJournal=false)
- **VAT Account**: System posts tax automatically (allowManualJournal=false)
- **Revenue/Expense**: User-selected, manual posting allowed

### Inventory Integration
- **Inventory Asset**: System updates on stock movements (allowManualJournal=false)
- **COGS Expense**: System posts on sales (allowManualJournal=false)

### Multi-Currency Exchange
- When posting to USD account from UGX transaction:
  1. Post amountInBase (UGX equivalent) to `balance`
  2. Post original amount (USD) to `foreignBalance`
  3. Display both in UI

---

## 6. Best Practices

### Account Setup
1. **Parent Accounts (level 0)**: Summary only, never post directly
2. **Detail Accounts (level 1+)**: Actual posting targets
3. **System Accounts**: Flag with `allowManualJournal: false`
4. **Multi-Currency**: Set currency on account creation

### Posting Rules
✅ **Allowed:**
- Post to detail accounts (hasChildren=false)
- Post to accounts with allowManualJournal=true (for manual journals)
- System posts to any account

❌ **Blocked:**
- Manual post to allowManualJournal=false accounts
- Post to parent accounts (hasChildren=true)
- Post to inactive accounts

### Tags Usage
```typescript
tags: ["Cost Center: HQ", "Department: Finance", "Project: ERP2024"]
```

### Balance Rollup
- Parent balances auto-calculate from children
- Use `calculateHierarchicalBalances()` for reporting
- Run nightly for performance

---

## 7. Testing Checklist

- [x] Schema migration successful
- [ ] Uganda COA seeds correctly for new org
- [ ] Hierarchical tree displays correctly
- [ ] Expand/collapse works
- [ ] Multi-currency USD account shows foreign balance
- [ ] Lock icon prevents manual posting
- [ ] Cannot post to parent accounts
- [ ] Balance rollup calculation accurate
- [ ] Tags filter works
- [ ] Search functionality works
- [ ] Inactive accounts hide/show toggle
- [ ] Summary cards calculate correctly

---

## 8. Future Enhancements

1. **Additional Country Templates**
   - Kenya (IFRS)
   - Nigeria (IFRS + local)
   - South Africa (IFRS)

2. **Advanced Features**
   - Account consolidation (multiple subsidiaries)
   - Budgeting per account
   - Cost allocation rules
   - Inter-company eliminations

3. **Reporting**
   - Trial Balance with hierarchy
   - Balance Sheet with rollups
   - P&L with department breakdown
   - Cash Flow Statement

4. **Audit Trail**
   - Track all COA changes
   - Require approval for system account edits
   - Version history

---

## API Endpoints

### GET `/api/orgs/[orgSlug]/chart-of-accounts`
Returns all accounts for organization

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "1000",
      "name": "Assets",
      "accountType": "ASSET",
      "balance": 150000,
      "foreignBalance": null,
      "currency": "UGX",
      "level": 0,
      "hasChildren": true,
      "allowManualJournal": true,
      "parentId": null,
      "tags": []
    }
  ]
}
```

### POST `/api/orgs/[orgSlug]/chart-of-accounts`
Create new account

**Request:**
```json
{
  "code": "1025",
  "name": "Petty Cash",
  "accountType": "ASSET",
  "parentId": "parent_id",
  "currency": "UGX",
  "allowManualJournal": true,
  "tags": ["Head Office"]
}
```

---

## Summary

This implementation provides:
✅ Enterprise-grade hierarchical COA
✅ Country-specific templates (Uganda ICPASU)
✅ Multi-currency support with foreign balance tracking
✅ System account protection (no manual posting)
✅ Professional tree UI with expand/collapse
✅ Parent account balance rollups
✅ Flexible tagging for dimensions
✅ SOLID architecture (Strategy pattern for localization)

**No hardcoded Ugandan specifics** - all localization driven by `COALocalizationManager.getStandardCOA(countryCode)`.
