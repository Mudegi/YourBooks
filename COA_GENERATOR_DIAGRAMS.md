# COA Generator - Visual Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COA GENERATION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   API Call   │────────▶│  Validation  │────────▶│  Generation  │
│              │         │              │         │              │
│ POST /coa/   │         │ • Org exists?│         │ Transaction  │
│ generate     │         │ • No accounts│         │ starts...    │
│              │         │ • Valid type?│         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                                          │
                                                          ▼
                         ┌──────────────┐         ┌──────────────┐
                         │   Response   │◀────────│   Rollback   │
                         │              │         │   on Error   │
                         │ Success +    │         │              │
                         │ Count        │         │ All-or-      │
                         │              │         │ Nothing      │
                         └──────────────┘         └──────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPONENT LAYERS                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER                                      │
│  src/app/api/orgs/[orgSlug]/coa/generate/route.ts                  │
│                                                                      │
│  • GET /generate?action=check                                       │
│  • GET /generate?action=industries                                  │
│  • GET /generate?action=preview&industry=X                          │
│  • POST /generate {industryType, ...}                              │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                             │
│  src/lib/coa-generator.ts                                           │
│                                                                      │
│  • generateChartOfAccounts()     - Main generator                   │
│  • canGenerateCOA()              - Validation                       │
│  • getAvailableIndustries()      - Industry list                    │
│  • previewCOA()                  - Preview accounts                 │
│  • getAccountTemplates()         - Template lookup                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                                │
│  src/lib/onboarding-coa.ts                                          │
│                                                                      │
│  • setupOrganizationCOA()         - Simple COA setup                │
│  • completeOnboardingWithCOA()    - Full onboarding                 │
│  • validateOnboardingData()       - Input validation                │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  Prisma + PostgreSQL                                                │
│                                                                      │
│  • Organization table            - Company data                     │
│  • ChartOfAccount table          - Account records                  │
│  • Transaction wrapper           - Atomicity guarantee              │
└─────────────────────────────────────────────────────────────────────┘
```

## Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSACTION SAFETY                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  prisma.$transaction(async (tx) => {                                 │
│                                                                       │
│    ┌────────────────────────────────────────────────────┐           │
│    │  FOR EACH account template in templates:           │           │
│    │                                                      │           │
│    │    ┌──────────────────────────────────┐           │           │
│    │    │  tx.chartOfAccount.create({      │           │           │
│    │    │    organizationId,               │           │           │
│    │    │    code,                         │◀──────────┼─ ATOMIC  │
│    │    │    name,                         │           │           │
│    │    │    accountType,                  │           │           │
│    │    │    ...                           │           │           │
│    │    │  })                              │           │           │
│    │    └──────────────────────────────────┘           │           │
│    │                                                      │           │
│    │    ✓ Success → Continue                            │           │
│    │    ✗ Error → ROLLBACK ALL                          │           │
│    │                                                      │           │
│    └────────────────────────────────────────────────────┘           │
│                                                                       │
│    return createdAccounts;                                           │
│  })                                                                   │
└──────────────────────────────────────────────────────────────────────┘

              ┌────────────┐              ┌────────────┐
              │  SUCCESS   │              │   ERROR    │
              │            │              │            │
              │ All 39     │              │ Rollback   │
              │ accounts   │              │ to 0       │
              │ created    │              │ accounts   │
              └────────────┘              └────────────┘
```

## Account Code Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ACCOUNT CODE STANDARDS                             │
└─────────────────────────────────────────────────────────────────────┘

1000 ┌────────────────────────────────────────┐
     │           ASSETS                        │
     │                                         │
     │  1000 - Cash on Hand                   │
     │  1100 - Checking Account               │
     │  1200 - Accounts Receivable            │
     │  1300 - Inventory                      │
     │  1500 - Property, Plant & Equipment    │
     │  1510 - Accumulated Depreciation       │
1999 └────────────────────────────────────────┘

2000 ┌────────────────────────────────────────┐
     │         LIABILITIES                     │
     │                                         │
     │  2000 - Accounts Payable               │
     │  2100 - Tax Payable                    │
     │  2200 - Accrued Expenses               │
     │  2300 - Short-term Loans               │
     │  2500 - Long-term Debt                 │
2999 └────────────────────────────────────────┘

3000 ┌────────────────────────────────────────┐
     │            EQUITY                       │
     │                                         │
     │  3000 - Owner's Capital                │
     │  3100 - Retained Earnings              │
     │  3200 - Owner's Draw                   │
3999 └────────────────────────────────────────┘

4000 ┌────────────────────────────────────────┐
     │           REVENUE                       │
     │                                         │
     │  4000 - Sales Revenue                  │
     │  4100 - Service Revenue                │
     │  4200 - Interest Income                │
     │  4300 - Other Income                   │
4999 └────────────────────────────────────────┘

5000 ┌────────────────────────────────────────┐
     │        COST OF SALES                    │
     │                                         │
     │  5000 - Cost of Goods Sold             │
     │  5100 - Purchase Discounts             │
5999 └────────────────────────────────────────┘

6000 ┌────────────────────────────────────────┐
     │           EXPENSES                      │
     │                                         │
     │  6000 - Salaries & Wages               │
     │  6100 - Rent Expense                   │
     │  6200 - Utilities Expense              │
     │  6300 - Office Supplies                │
     │  6400 - Insurance Expense              │
     │  6500 - Depreciation Expense           │
     │  6600 - Marketing & Advertising        │
     │  6700 - Professional Fees              │
     │  6800 - Travel & Entertainment         │
     │  6900 - Bank Fees                      │
     │  7000 - Interest Expense               │
     │  7100 - Tax Expense                    │
     │  9000 - Miscellaneous Expense          │
9999 └────────────────────────────────────────┘
```

## Industry Templates Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                   INDUSTRY TEMPLATES                                 │
└─────────────────────────────────────────────────────────────────────┘

              BASE        INDUSTRY      TOTAL
             ACCOUNTS   SPECIFIC   =  ACCOUNTS
             ────────   ────────      ────────

GENERAL        33    +     0      =     33
               │
               ├─────────────────────────────────┐
               │                                  │
RETAIL         33    +     6      =     39        │
               │      • Merchandise Inventory     │
               │      • Product Sales             │
               │      • POS Fees                  │
               │                                  │
MANUFACTURING  33    +     8      =     41        │  All include
               │      • Raw Materials             │  base 33
               │      • WIP Inventory             │  accounts
               │      • Finished Goods            │
               │                                  │
SERVICES       33    +     6      =     39        │
               │      • Unbilled Receivables      │
               │      • Unearned Revenue          │
               │      • Subcontractor Costs       │
               │                                  │
TECHNOLOGY     33    +     8      =     41        │
               │      • Software Licenses         │
               │      • Subscription Revenue      │
               │      • Cloud Hosting             │
               │                                  │
NONPROFIT      33    +    11      =     44        │
               │      • Grants Receivable         │
               │      • Donation Revenue          │
               │      • Program Expenses          │
               └──────────────────────────────────┘
```

## Usage Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TYPICAL USAGE FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  USER REGISTRATION                                                    │
│                                                                       │
│  1. User creates account                                             │
│  2. User starts onboarding wizard                                    │
│                                                                       │
│     ┌────────────────────────────────────────────────┐              │
│     │  Step 1: Company Information                   │              │
│     │  • Name: "Acme Manufacturing"                  │              │
│     │  • Legal Name: "Acme Manufacturing Ltd"        │              │
│     │  • Currency: USD                               │              │
│     └────────────────────────────────────────────────┘              │
│                      │                                                │
│                      ▼                                                │
│     ┌────────────────────────────────────────────────┐              │
│     │  Step 2: Select Industry                       │              │
│     │  ○ Retail                                      │              │
│     │  ● Manufacturing ←─ Selected                   │              │
│     │  ○ Services                                    │              │
│     │  ○ Technology                                  │              │
│     └────────────────────────────────────────────────┘              │
│                      │                                                │
│                      ▼                                                │
│     ┌────────────────────────────────────────────────┐              │
│     │  Step 3: Preview Accounts (Optional)           │              │
│     │  Will create 41 accounts:                      │              │
│     │  • 9 Asset accounts                            │              │
│     │  • 5 Liability accounts                        │              │
│     │  • 3 Equity accounts                           │              │
│     │  • 5 Revenue accounts                          │              │
│     │  • 5 COGS accounts                             │              │
│     │  • 14 Expense accounts                         │              │
│     └────────────────────────────────────────────────┘              │
│                      │                                                │
│                      ▼                                                │
│     ┌────────────────────────────────────────────────┐              │
│     │  Step 4: Generate COA                          │              │
│     │                                                 │              │
│     │  [Generate Chart of Accounts] ←─ Click        │              │
│     │                                                 │              │
│     │  ⏳ Creating accounts...                       │              │
│     │  ✓ Created 41 accounts successfully!           │              │
│     └────────────────────────────────────────────────┘              │
│                      │                                                │
│                      ▼                                                │
│     ┌────────────────────────────────────────────────┐              │
│     │  Step 5: Complete Setup                        │              │
│     │  ✓ Organization created                        │              │
│     │  ✓ Chart of Accounts generated                 │              │
│     │  ✓ Ready to start using YourBooks!            │              │
│     │                                                 │              │
│     │  [Go to Dashboard] →                           │              │
│     └────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING                                     │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Generate COA    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Validate Input  │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │  Valid?     │          │  Invalid?   │
         │             │          │             │
         │  Continue   │          │  Return     │
         │             │          │  Error      │
         └──────┬──────┘          └─────────────┘
                │                        │
      ┌─────────▼─────────┐              │
      │  Start Transaction│              │
      └─────────┬─────────┘              │
                │                        │
      ┌─────────▼─────────┐              │
      │  Create Accounts  │              │
      └─────────┬─────────┘              │
                │                        │
       ┌────────┼────────┐               │
       │                 │               │
┌──────▼──────┐   ┌──────▼──────┐       │
│  Success?   │   │   Error?    │       │
│             │   │             │       │
│  Commit     │   │  ROLLBACK   │◀──────┘
│  Transaction│   │  Everything │
│             │   │             │
└──────┬──────┘   └──────┬──────┘
       │                 │
       │                 │
       └────────┬────────┘
                │
        ┌───────▼────────┐
        │  Return Result │
        │                │
        │  Success: true │
        │  or            │
        │  Success: false│
        │  + Error msg   │
        └────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Client Request │
│                 │
│  POST /api/orgs/│
│  demo/coa/      │
│  generate       │
│                 │
│  {              │
│    industryType:│
│    "RETAIL"     │
│  }              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │
│                 │
│  • Validate org │
│  • Check perms  │
│  • Parse body   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│  COA Generator  │──────▶│  Get Templates   │
│                 │       │                  │
│  • Validate     │       │  BASE_ACCOUNTS + │
│  • Get templates│       │  RETAIL_ACCOUNTS │
│  • Start trans  │       └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Transaction                         │
│                                      │
│  FOR template IN templates:         │
│    CREATE account                   │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │Acc1│ │Acc2│ │Acc3│ │...│        │
│  └────┘ └────┘ └────┘ └────┘       │
│                                      │
│  COMMIT or ROLLBACK                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│                 │
│  Organization:  │
│  ├─ ChartOfAcc 1│
│  ├─ ChartOfAcc 2│
│  ├─ ChartOfAcc 3│
│  └─ ...         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │
│                 │
│  {              │
│    success: true│
│    accounts: 39 │
│  }              │
└─────────────────┘
```

## File Organization

```
YourBooks/
├── src/
│   ├── lib/
│   │   ├── coa-generator.ts           ◀─ Core logic (550+ lines)
│   │   │   ├── Types
│   │   │   ├── BASE_ACCOUNTS (33)
│   │   │   ├── INDUSTRY_ACCOUNTS (10 types)
│   │   │   ├── generateChartOfAccounts()
│   │   │   ├── canGenerateCOA()
│   │   │   ├── getAvailableIndustries()
│   │   │   ├── previewCOA()
│   │   │   └── getAccountTemplates()
│   │   │
│   │   └── onboarding-coa.ts          ◀─ Integration (180+ lines)
│   │       ├── setupOrganizationCOA()
│   │       ├── completeOnboardingWithCOA()
│   │       └── validateOnboardingData()
│   │
│   ├── app/api/orgs/[orgSlug]/coa/
│   │   └── generate/
│   │       └── route.ts               ◀─ API endpoint (200+ lines)
│   │           ├── GET (check, industries, preview)
│   │           └── POST (generate)
│   │
│   └── tests/
│       └── test-coa-generator.ts      ◀─ Tests (550+ lines)
│           ├── 9 test cases
│           └── Full coverage
│
├── COA_GENERATOR_GUIDE.md             ◀─ Full docs (800+ lines)
├── COA_GENERATOR_QUICK_REF.md         ◀─ Quick ref (250+ lines)
├── COA_GENERATOR_IMPLEMENTATION_SUMMARY.md
└── COA_GENERATOR_DIAGRAMS.md          ◀─ This file
```

---

**Visual Guide Complete**
- System flow diagrams ✓
- Component architecture ✓
- Transaction flow ✓
- Account code structure ✓
- Industry comparison ✓
- Usage patterns ✓
- Error handling ✓
- Data flow ✓
- File organization ✓
