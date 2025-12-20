# YourBooks ERP - Implementation Guide

## ✅ Step 1: Database Schema (COMPLETED)

### Overview
The Prisma schema ([prisma/schema.prisma](prisma/schema.prisma)) has been designed with the following key principles:

#### **Double-Entry Bookkeeping Core**
- `Transaction` table: Stores the transaction header
- `LedgerEntry` table: Stores individual debits and credits
- **Critical Rule**: Every transaction must have `Σ(Debits) = Σ(Credits)`

#### **Multi-Tenancy**
- `Organization` table is the root entity
- All data is scoped by `organizationId`
- Users can belong to multiple organizations with different roles

#### **Key Tables & Relationships**

**1. Multi-Tenancy & Users**
```
Organization → OrganizationUser ← User
├── ChartOfAccounts
├── Transactions
├── Customers
├── Vendors
├── Products
└── All other entities...
```

**2. General Ledger**
```
Transaction (Header)
├── Multiple LedgerEntries (Debits/Credits)
│   └── Each links to ChartOfAccount
└── Must be balanced before saving
```

**3. Accounts Receivable**
```
Customer
└── Invoices
    ├── InvoiceItems
    └── PaymentAllocations ← Payment
```

**4. Accounts Payable**
```
Vendor
├── PurchaseOrders
└── Bills
    ├── BillItems
    └── PaymentAllocations ← Payment
```

**5. Inventory**
```
Product
├── InventoryItems (by location)
└── StockMovements (audit trail)
```

**6. Fixed Assets**
```
FixedAsset
└── DepreciationSchedule (monthly/yearly)
```

#### **Database Integrity Features**
- ✅ Foreign key constraints
- ✅ Unique constraints on business keys (invoice numbers, SKUs, etc.)
- ✅ Cascading deletes where appropriate
- ✅ Indexed fields for performance
- ✅ Decimal precision for monetary values (19,4)
- ✅ Audit timestamps (createdAt, updatedAt)

#### **Enums for Data Consistency**
- `UserRole`: ADMIN, ACCOUNTANT, MANAGER, VIEWER
- `AccountType`: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE, COST_OF_SALES
- `EntryType`: DEBIT, CREDIT
- `TransactionStatus`: DRAFT, POSTED, VOIDED, CANCELLED
- `InvoiceStatus`, `BillStatus`, `PaymentMethod`, etc.

---

## ✅ Step 2: Folder Structure (COMPLETED)

### Project Architecture

The project follows a **layered architecture** for separation of concerns:

```
src/
├── app/                    # Next.js App Router (Presentation Layer)
├── components/             # React Components (UI Layer)
├── services/              # Business Logic Layer
├── lib/                   # Utilities & Helpers
├── hooks/                 # Custom React Hooks
└── types/                 # TypeScript Definitions
```

### Key Architectural Decisions

#### **1. Service Layer Pattern**
All business logic is isolated in service classes:

- `services/accounting/double-entry.service.ts` - Core accounting rules
- `services/accounts-receivable/invoice.service.ts` - Invoice creation & GL posting
- `services/accounts-payable/bill.service.ts` - Bill processing
- `services/reports/balance-sheet.service.ts` - Financial reports

**Benefits:**
- ✅ Reusable across API routes and server components
- ✅ Easier to test
- ✅ Enforces business rules consistently
- ✅ Separates concerns

#### **2. Multi-Tenant Routing**
```
app/(dashboard)/[orgSlug]/...
```

- Organization slug in URL: `yourbooks.com/demo-company/invoices`
- Middleware validates organization access
- All queries automatically filtered by `organizationId`

#### **3. API Route Organization**
```
app/api/
├── auth/               # Authentication endpoints
├── customers/          # CRUD for customers
├── invoices/           # Invoice management
├── transactions/       # Journal entries
└── reports/            # Financial reports
```

**Standard API Response Format:**
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

#### **4. Component Organization**

**Reusable UI Components** (`components/ui/`)
- Button, Input, Select, Modal, Table, etc.
- Built with Tailwind CSS
- Follows shadcn/ui patterns

**Business Components** (`components/forms/`, `components/reports/`)
- Invoice Form, Customer Form, etc.
- Balance Sheet, P&L Report, etc.
- Domain-specific logic

**Layout Components** (`components/layout/`)
- Sidebar, Header, Breadcrumbs
- Organization Switcher

---

## 🔧 Key Services Explained

### 1. Double-Entry Service
**File:** `src/services/accounting/double-entry.service.ts`

**Purpose:** Enforces the fundamental accounting equation

**Key Methods:**
```typescript
// Validates that Σ(Debits) = Σ(Credits)
validateBalance(entries: LedgerEntryInput[]): boolean

// Creates a transaction with validation
createTransaction(input: TransactionInput): Promise<Transaction>

// Reverses a transaction
voidTransaction(transactionId: string): Promise<void>
```

**Example Usage:**
```typescript
import DoubleEntryService from '@/services/accounting/double-entry.service';

const transaction = await DoubleEntryService.createTransaction({
  organizationId: 'org-123',
  transactionDate: new Date(),
  transactionType: 'JOURNAL_ENTRY',
  description: 'Record office supplies purchase',
  createdById: 'user-123',
  entries: [
    {
      accountId: 'office-supplies-account',
      entryType: 'DEBIT',
      amount: 500,
      description: 'Office supplies',
    },
    {
      accountId: 'cash-account',
      entryType: 'CREDIT',
      amount: 500,
      description: 'Payment for supplies',
    },
  ],
});
```

**Validation Logic:**
1. Checks entries length (minimum 2)
2. Verifies at least one debit and one credit
3. Calculates total debits and credits
4. Ensures they are equal
5. Updates account balances based on account type

**Account Balance Calculation:**
- **Assets & Expenses**: Increase with Debits, Decrease with Credits
- **Liabilities, Equity & Revenue**: Increase with Credits, Decrease with Debits

### 2. Invoice Service
**File:** `src/services/accounts-receivable/invoice.service.ts`

**Purpose:** Creates invoices and automatically posts to General Ledger

**Accounting Flow:**
```
Invoice Creation
└── Automatic GL Posting:
    ├── Debit: Accounts Receivable (1200)
    ├── Credit: Sales Revenue (4000)
    └── Credit: Tax Payable (2100) [if applicable]
```

**Key Methods:**
```typescript
createInvoice(input: CreateInvoiceInput): Promise<{invoice, glTransaction}>
```

**Features:**
- ✅ Calculates subtotals, tax, and total automatically
- ✅ Generates invoice numbers (INV-2025-0001)
- ✅ Posts to GL in a database transaction
- ✅ Updates inventory for tracked products
- ✅ Creates stock movement records

---

## 🎯 Next Steps: Implementation Plan

### Phase 1: Core Setup (Week 1)
- [ ] Install dependencies: `npm install`
- [ ] Set up PostgreSQL: `docker-compose up -d`
- [ ] Configure `.env` file
- [ ] Run migrations: `npm run prisma:migrate`
- [ ] Seed database: `npm run prisma:seed`
- [ ] Test Prisma Studio: `npm run prisma:studio`

### Phase 2: Authentication (Week 2)
- [ ] Implement JWT authentication
- [ ] Create login/register API routes
- [ ] Build authentication middleware
- [ ] Create session management
- [ ] Build login/register pages
- [ ] Implement RBAC checks

### Phase 3: General Ledger (Week 3-4)
- [ ] Chart of Accounts CRUD
  - [ ] API routes: GET, POST, PATCH, DELETE
  - [ ] UI: List, Create, Edit forms
  - [ ] Account hierarchy display
- [ ] Journal Entries
  - [ ] Multi-line entry form
  - [ ] Double-entry validation UI
  - [ ] Real-time balance calculation
  - [ ] Transaction listing with filters
- [ ] Account Balance Display
  - [ ] Current balance per account
  - [ ] Balance history

### Phase 4: Accounts Receivable (Week 5-6)
- [ ] Customer Management
  - [ ] CRUD operations
  - [ ] Customer profile page
  - [ ] Credit limit tracking
- [ ] Invoice Management
  - [ ] Multi-item invoice form
  - [ ] Tax calculation
  - [ ] PDF generation
  - [ ] Email sending
  - [ ] Payment tracking
- [ ] Credit Notes
- [ ] Customer Aging Report

### Phase 5: Accounts Payable (Week 7-8)
- [ ] Vendor Management
- [ ] Purchase Orders
- [ ] Bill Management
- [ ] Bill Payment
- [ ] Vendor Aging Report

### Phase 6: Banking (Week 9)
- [ ] Bank Account Management
- [ ] Payment Recording
- [ ] Bank Reconciliation
  - [ ] Match transactions
  - [ ] Mark as reconciled
- [ ] Cash Flow Report

### Phase 7: Inventory (Week 10-11)
- [ ] Product Management
- [ ] Stock Movements
- [ ] COGS Calculation
- [ ] Inventory Valuation Reports
- [ ] Low Stock Alerts

### Phase 8: Fixed Assets (Week 12)
- [ ] Asset Registry
- [ ] Depreciation Calculation
- [ ] Depreciation Posting
- [ ] Asset Disposal

### Phase 9: Financial Reports (Week 13-14)
- [ ] Balance Sheet
  - [ ] Assets, Liabilities, Equity
  - [ ] Period comparison
- [ ] Profit & Loss (P&L)
  - [ ] Revenue and Expenses
  - [ ] Period comparison
- [ ] Trial Balance
- [ ] General Ledger Report
- [ ] Cash Flow Statement

### Phase 10: Tax & Compliance (Week 15)
- [ ] Tax Configuration
- [ ] Tax Calculation in Invoices/Bills
- [ ] Tax Reports
- [ ] VAT/GST Filing Reports

### Phase 11: Dashboard & Analytics (Week 16)
- [ ] Revenue/Expense Charts
- [ ] Cash Flow Widgets
- [ ] Outstanding Invoices/Bills
- [ ] Key Metrics (KPIs)

### Phase 12: Polish & Testing (Week 17-18)
- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] E2E tests for critical flows
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## 🔐 Security Implementation Checklist

### Authentication & Authorization
- [ ] JWT token with secure secret
- [ ] Token expiration and refresh
- [ ] Password hashing with bcrypt
- [ ] Role-based access control
- [ ] Organization-level isolation

### Data Security
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting on API routes

### Audit Trail
- [ ] Log all create/update/delete operations
- [ ] Store user ID and timestamp
- [ ] IP address and user agent
- [ ] Before/after values for updates

---

## 📊 Testing Strategy

### Unit Tests
Test individual services in isolation:
```typescript
// double-entry.service.test.ts
describe('DoubleEntryService', () => {
  it('should validate balanced entries', () => {
    const entries = [
      { accountId: 'A', entryType: 'DEBIT', amount: 100 },
      { accountId: 'B', entryType: 'CREDIT', amount: 100 },
    ];
    expect(DoubleEntryService.validateBalance(entries)).toBe(true);
  });

  it('should reject unbalanced entries', () => {
    const entries = [
      { accountId: 'A', entryType: 'DEBIT', amount: 100 },
      { accountId: 'B', entryType: 'CREDIT', amount: 50 },
    ];
    expect(DoubleEntryService.validateBalance(entries)).toBe(false);
  });
});
```

### Integration Tests
Test API routes with database:
```typescript
// invoices.test.ts
describe('POST /api/invoices', () => {
  it('should create invoice and post to GL', async () => {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
    expect(response.status).toBe(201);
    
    // Check GL transaction was created
    const glTransaction = await prisma.transaction.findFirst({
      where: { referenceId: invoice.id },
    });
    expect(glTransaction).toBeDefined();
  });
});
```

### E2E Tests
Test complete user flows:
```typescript
// invoice-flow.e2e.ts
test('complete invoice flow', async ({ page }) => {
  await page.goto('/demo-company/invoices/new');
  await page.fill('[name="customer"]', 'John Doe');
  await page.fill('[name="items[0].description"]', 'Widget');
  await page.fill('[name="items[0].quantity"]', '10');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/invoices\/INV-/);
  await expect(page.locator('.status')).toHaveText('SENT');
});
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`

### Production Database
- [ ] PostgreSQL instance provisioned
- [ ] Connection string configured
- [ ] SSL enabled
- [ ] Backups configured
- [ ] Performance tuning applied

### Application Deployment
- [ ] Deploy to Vercel/AWS/Azure
- [ ] Configure custom domain
- [ ] SSL certificate installed
- [ ] CDN configured for static assets
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

### Post-Deployment
- [ ] Smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup jobs

---

## 📚 Additional Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Accounting References
- Double-Entry Bookkeeping Principles
- GAAP (Generally Accepted Accounting Principles)
- IFRS (International Financial Reporting Standards)

### Development Tools
- **Prisma Studio**: Visual database browser
- **pgAdmin**: PostgreSQL management
- **VS Code Extensions**:
  - Prisma
  - ESLint
  - Tailwind CSS IntelliSense
  - Error Lens

---

## 💡 Best Practices

### Code Organization
- Keep services pure (no UI logic)
- Use TypeScript strictly
- Validate all inputs with Zod
- Handle errors gracefully
- Log important operations

### Database
- Always use transactions for multi-step operations
- Index frequently queried fields
- Use `Decimal` type for monetary values
- Soft delete where appropriate

### API Design
- RESTful conventions
- Consistent response format
- Proper HTTP status codes
- Pagination for large datasets
- API versioning

### Security
- Never trust user input
- Validate organizationId on every request
- Use parameterized queries (Prisma handles this)
- Sanitize output
- Keep dependencies updated

---

## 🎉 You're Ready!

This guide provides everything needed to build a professional accounting ERP system. Start with Phase 1 and work through systematically.

**Questions or Issues?**
- Review the Prisma schema for data model questions
- Check the service files for business logic examples
- Refer to ARCHITECTURE.md for structure details

**Happy Coding! 🚀**
