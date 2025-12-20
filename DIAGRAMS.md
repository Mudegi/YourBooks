# YourBooks ERP - Database & Accounting Flow Diagrams

## 1. Double-Entry Bookkeeping Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSACTION                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ Transaction Header                                 │      │
│  │ - ID, Number, Date, Type, Description             │      │
│  │ - Organization, User, Status                      │      │
│  └─────────────────┬─────────────────────────────────┘      │
│                    │                                         │
│                    │ Has Many                                │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LEDGER ENTRIES                         │    │
│  │  ┌─────────────────┐    ┌─────────────────┐        │    │
│  │  │ Entry 1         │    │ Entry 2         │        │    │
│  │  │ Debit: $1,000   │    │ Credit: $1,000  │  ...   │    │
│  │  │ Account: Cash   │    │ Account: Sales  │        │    │
│  │  └─────────────────┘    └─────────────────┘        │    │
│  │                                                      │    │
│  │  VALIDATION RULE:                                   │    │
│  │  Σ(Debits) = Σ(Credits)  ← MUST BE TRUE            │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Account Balance Calculation

```
┌──────────────────────────────────────────────────────────────┐
│                    ACCOUNT TYPES                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ASSET                        LIABILITY                       │
│  ┌─────────┐                  ┌─────────┐                    │
│  │ DEBIT + │  Normal Balance  │ CREDIT +│  Normal Balance    │
│  │ CREDIT -│                  │ DEBIT - │                    │
│  └─────────┘                  └─────────┘                    │
│                                                               │
│  EXPENSE                       REVENUE                        │
│  ┌─────────┐                  ┌─────────┐                    │
│  │ DEBIT + │  Normal Balance  │ CREDIT +│  Normal Balance    │
│  │ CREDIT -│                  │ DEBIT - │                    │
│  └─────────┘                  └─────────┘                    │
│                                                               │
│  EQUITY                                                       │
│  ┌─────────┐                                                 │
│  │ CREDIT +│  Normal Balance                                 │
│  │ DEBIT - │                                                 │
│  └─────────┘                                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 3. Invoice to GL Posting Flow

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Create Invoice                                     │
├────────────────────────────────────────────────────────────┤
│  Customer: Acme Corp                                       │
│  Items:                                                    │
│    - Widget × 10 @ $100 = $1,000                          │
│    - Service × 1 @ $500 = $500                            │
│  Subtotal: $1,500                                         │
│  Tax (8.5%): $127.50                                      │
│  Total: $1,627.50                                         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Automatic GL Posting
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 2: General Ledger Entries                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Transaction: INV-2025-0001                                │
│  Date: 2025-12-18                                         │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Accounts Receivable (1200) │ $1,627.50 │    │
│  │ Credit │ Sales Revenue (4000)        │ $1,500.00 │    │
│  │ Credit │ Tax Payable (2100)          │   $127.50 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ✓ Balanced: $1,627.50 = $1,627.50                       │
│                                                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Update Account Balances
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 3: Account Balance Updates                           │
├────────────────────────────────────────────────────────────┤
│  Accounts Receivable: $0 + $1,627.50 = $1,627.50 DR      │
│  Sales Revenue: $0 + $1,500.00 = $1,500.00 CR            │
│  Tax Payable: $0 + $127.50 = $127.50 CR                  │
└────────────────────────────────────────────────────────────┘
```

## 4. Payment Recording Flow

```
┌────────────────────────────────────────────────────────────┐
│ Customer Pays Invoice                                      │
├────────────────────────────────────────────────────────────┤
│  Invoice: INV-2025-0001                                    │
│  Amount Due: $1,627.50                                     │
│  Payment Received: $1,627.50                               │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Create Payment Transaction
                 ▼
┌────────────────────────────────────────────────────────────┐
│ General Ledger Entries                                     │
├────────────────────────────────────────────────────────────┤
│  Transaction: PAY-2025-0001                                │
│  Date: 2025-12-20                                         │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Cash/Bank (1100)            │ $1,627.50 │    │
│  │ Credit │ Accounts Receivable (1200)  │ $1,627.50 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ✓ Balanced: $1,627.50 = $1,627.50                       │
│                                                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ Update Invoice & Account Balances                         │
├────────────────────────────────────────────────────────────┤
│  Invoice Status: PAID                                      │
│  Invoice Amount Paid: $1,627.50                           │
│  Invoice Amount Due: $0                                    │
│                                                            │
│  Cash/Bank: $1,627.50 DR (increased)                      │
│  Accounts Receivable: $0 (decreased)                      │
└────────────────────────────────────────────────────────────┘
```

## 5. Bill Payment Flow (Accounts Payable)

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Receive Bill from Vendor                          │
├────────────────────────────────────────────────────────────┤
│  Vendor: Office Supplies Inc.                              │
│  Items:                                                    │
│    - Paper × 100 @ $5 = $500                              │
│    - Pens × 50 @ $2 = $100                                │
│  Subtotal: $600                                           │
│  Tax: $51                                                 │
│  Total: $651                                              │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Record Bill
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 2: GL Entries for Bill                               │
├────────────────────────────────────────────────────────────┤
│  Transaction: BILL-2025-0001                               │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Office Supplies (6300)    │   $600.00  │    │
│  │ Debit  │ Tax Expense (7100)        │    $51.00  │    │
│  │ Credit │ Accounts Payable (2000)   │   $651.00  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Pay the Bill
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 3: Payment Transaction                                │
├────────────────────────────────────────────────────────────┤
│  Transaction: PAY-2025-0002                                │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Accounts Payable (2000)   │   $651.00  │    │
│  │ Credit │ Cash/Bank (1100)          │   $651.00  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Accounts Payable: $0 (cleared)                           │
│  Cash: Decreased by $651                                  │
└────────────────────────────────────────────────────────────┘
```

## 6. Inventory & COGS Flow

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Purchase Inventory                                 │
├────────────────────────────────────────────────────────────┤
│  Purchase 100 widgets @ $50 each = $5,000                 │
│                                                            │
│  GL Entries:                                               │
```

## 7. Credit Note Posting & Application Flow

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Create Credit Note                                 │
├────────────────────────────────────────────────────────────┤
│  Customer: Acme Corp                                       │
│  Reason: Goods Returned                                    │
│  Items:                                                    │
│    - Returned Widgets × 5 @ $100 = $500                   │
│  Subtotal: $500                                           │
│  Tax (18%): $90                                           │
│  Total Credit: $590                                       │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Auto-Post to GL on Approval
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 2: GL Entries (Reverse Revenue & Reduce AR)           │
├────────────────────────────────────────────────────────────┤
│  Transaction: CN-2025-0001                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Debit  │ Sales Revenue (4000)      │   $500.00   │     │
│  │ Debit  │ VAT Payable (2100)        │    $90.00   │     │
│  │ Credit │ Accounts Receivable (1200)│   $590.00   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Apply Credit to Invoice(s)
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 3: Application & Invoice Update                       │
├────────────────────────────────────────────────────────────┤
│  Apply $590 to INV-2025-0001                               │
│  Invoice Amount Due: Reduced by $590                       │
│  Credit Note Remaining: $0                                 │
└────────────────────────────────────────────────────────────┘
```

## 8. Debit Note Posting Flow

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Create Debit Note                                  │
├────────────────────────────────────────────────────────────┤
│  Customer: Acme Corp                                       │
│  Reason: Additional Charges                                │
│  Items:                                                    │
│    - Expedited Shipping × 1 @ $120 = $120                 │
│  Subtotal: $120                                           │
│  Tax (18%): $21.60                                        │
│  Total: $141.60                                           │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Auto-Post to GL on Approval
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 2: GL Entries (Increase AR & Recognize Revenue)       │
├────────────────────────────────────────────────────────────┤
│  Transaction: DN-2025-0001                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Debit  │ Accounts Receivable (1200)│   $141.60   │     │
│  │ Credit │ Other Revenue (4800)      │   $120.00   │     │
│  │ Credit │ VAT Payable (2100)        │    $21.60   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 9. Recurring Transactions Engine (Planned)

```
┌────────────────────────────────────────────────────────────┐
│ Recurring Transaction Template                             │
├────────────────────────────────────────────────────────────┤
│  Schedule: Monthly/Weekly/Custom Cron                      │
│  Source: Journal/Invoice/Bill/Payment                      │
│  Execution: Auto-create Transaction + GL Entries           │
│  Controls: Pause/Resume, Next Run, History, Failures       │
└────────────────────────────────────────────────────────────┘
```
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Inventory (1300)          │  $5,000.00 │    │
│  │ Credit │ Accounts Payable (2000)   │  $5,000.00 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Inventory Record:                                         │
│    Quantity on Hand: 100                                   │
│    Average Cost: $50                                       │
│    Total Value: $5,000                                     │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Sell Product
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 2: Sale Transaction                                   │
├────────────────────────────────────────────────────────────┤
│  Sell 10 widgets @ $100 each = $1,000                     │
│                                                            │
│  GL Entries (Revenue):                                     │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Accounts Receivable (1200)│  $1,000.00 │    │
│  │ Credit │ Sales Revenue (4000)      │  $1,000.00 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Automatic COGS Entry
                 ▼
┌────────────────────────────────────────────────────────────┐
│ STEP 3: Cost of Goods Sold                                │
├────────────────────────────────────────────────────────────┤
│  COGS = 10 units × $50 = $500                             │
│                                                            │
│  GL Entries:                                               │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Cost of Goods Sold (5000) │    $500.00 │    │
│  │ Credit │ Inventory (1300)          │    $500.00 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Inventory Record Updated:                                 │
│    Quantity on Hand: 90 (100 - 10)                        │
│    Average Cost: $50                                       │
│    Total Value: $4,500                                     │
│                                                            │
│  Gross Profit = Revenue - COGS                            │
│               = $1,000 - $500 = $500                      │
└────────────────────────────────────────────────────────────┘
```

## 7. Depreciation Flow

```
┌────────────────────────────────────────────────────────────┐
│ Fixed Asset: Delivery Truck                               │
├────────────────────────────────────────────────────────────┤
│  Purchase Price: $30,000                                   │
│  Residual Value: $5,000                                    │
│  Useful Life: 5 years                                      │
│  Method: Straight-Line                                     │
│                                                            │
│  Annual Depreciation:                                      │
│    ($30,000 - $5,000) / 5 = $5,000 per year              │
│    $5,000 / 12 = $416.67 per month                        │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Monthly Depreciation Entry
                 ▼
┌────────────────────────────────────────────────────────────┐
│ Monthly GL Entry (Automated)                               │
├────────────────────────────────────────────────────────────┤
│  Transaction: DEP-2025-0001                                │
│  Date: End of Month                                        │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Debit  │ Depreciation Expense (6500) │  $416.67 │    │
│  │ Credit │ Accumulated Depr. (1510)    │  $416.67 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Asset Value on Balance Sheet:                            │
│    Cost: $30,000                                          │
│    Less: Accumulated Depreciation: ($416.67)              │
│    Net Book Value: $29,583.33                             │
└────────────────────────────────────────────────────────────┘
```

## 8. Financial Statements Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     BALANCE SHEET                            │
│                  (Point in Time)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ASSETS                    │  LIABILITIES                    │
│  ├─ Current Assets         │  ├─ Current Liabilities        │
│  │  ├─ Cash               │  │  ├─ Accounts Payable        │
│  │  ├─ Accounts Receivable│  │  ├─ Tax Payable             │
│  │  └─ Inventory          │  │  └─ Short-term Debt         │
│  ├─ Fixed Assets          │  ├─ Long-term Liabilities      │
│  │  ├─ Property           │  │  └─ Long-term Debt          │
│  │  └─ Equipment          │  │                              │
│                            │  EQUITY                         │
│                            │  ├─ Owner's Capital            │
│                            │  ├─ Retained Earnings          │
│                            │  └─ Current Year Profit        │
│                            │                                 │
│  TOTAL ASSETS = LIABILITIES + EQUITY                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PROFIT & LOSS (INCOME STATEMENT)                │
│                    (Period of Time)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  REVENUE                                                     │
│  ├─ Sales Revenue                           $10,000         │
│  └─ Service Revenue                          $5,000         │
│  TOTAL REVENUE                                          $15,000│
│                                                              │
│  COST OF GOODS SOLD                                          │
│  └─ COGS                                     $6,000         │
│  GROSS PROFIT                                            $9,000│
│                                                              │
│  OPERATING EXPENSES                                          │
│  ├─ Salaries                                 $2,000         │
│  ├─ Rent                                     $1,000         │
│  ├─ Utilities                                  $500         │
│  └─ Depreciation                               $417         │
│  TOTAL EXPENSES                                          $3,917│
│                                                              │
│  NET PROFIT                                              $5,083│
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TRIAL BALANCE                             │
│                (Validation Report)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Account Name              │  Debit    │  Credit            │
│  ─────────────────────────────────────────────────────      │
│  Cash                      │  $5,000   │                    │
│  Accounts Receivable       │  $3,000   │                    │
│  Inventory                 │  $4,500   │                    │
│  Accounts Payable          │           │  $2,000            │
│  Tax Payable               │           │    $500            │
│  Owner's Capital           │           │  $5,000            │
│  Sales Revenue             │           │ $10,000            │
│  Cost of Goods Sold        │  $6,000   │                    │
│  Salaries Expense          │  $2,000   │                    │
│  ─────────────────────────────────────────────────────      │
│  TOTALS                    │ $20,500   │ $20,500            │
│                                                              │
│  ✓ Balanced (Debits = Credits)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 9. Multi-Tenancy Data Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ Organization 1: Acme Corp                       │        │
│  │ ├─ Chart of Accounts                            │        │
│  │ ├─ Transactions                                 │        │
│  │ ├─ Customers                                    │        │
│  │ ├─ Invoices                                     │        │
│  │ └─ Products                                     │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ Organization 2: XYZ Ltd                         │        │
│  │ ├─ Chart of Accounts                            │        │
│  │ ├─ Transactions                                 │        │
│  │ ├─ Customers                                    │        │
│  │ ├─ Invoices                                     │        │
│  │ └─ Products                                     │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ISOLATION: Every query filtered by organizationId          │
│  SECURITY: Middleware validates user access to org          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 10. Complete Transaction Lifecycle

```
┌──────────┐
│  DRAFT   │  ← Initial creation, can be edited
└────┬─────┘
     │ validate()
     │ checkBalance()
     ▼
┌──────────┐
│ POSTED   │  ← Committed to GL, affects account balances
└────┬─────┘
     │ void() - if needed
     ▼
┌──────────┐
│ VOIDED   │  ← Reversed with opposite entries
└──────────┘
```

---

## Summary: The Accounting Equation

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         ASSETS = LIABILITIES + EQUITY                      ║
║                                                            ║
║  This equation ALWAYS stays balanced through               ║
║  the double-entry system.                                  ║
║                                                            ║
║  Every transaction affects at least 2 accounts,            ║
║  maintaining this fundamental balance.                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```
