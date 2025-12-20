# YourBooks - Accounting ERP System
## Project Folder Structure

```
YourBooks/
├── prisma/
│   ├── schema.prisma                    # ✅ Database schema (already created)
│   ├── seed.ts                          # Seed data for development
│   └── migrations/                      # Database migrations
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Auth layout group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                # Main app layout group
│   │   │   ├── [orgSlug]/             # Multi-tenant routes
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # Dashboard home
│   │   │   │   │
│   │   │   │   ├── general-ledger/
│   │   │   │   │   ├── chart-of-accounts/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── journal-entries/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── trial-balance/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── accounts-receivable/
│   │   │   │   │   ├── customers/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── invoices/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── edit/
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   ├── credit-notes/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── aging-report/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── accounts-payable/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── bills/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── purchase-orders/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── expense-claims/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── banking/
│   │   │   │   │   ├── accounts/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── reconcile/
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── new/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── cash-flow/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── products/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── stock-movements/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── adjustments/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── fixed-assets/
│   │   │   │   │   ├── assets/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── depreciation/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── reports/
│   │   │   │   │   ├── balance-sheet/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── profit-loss/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── general-ledger/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── trial-balance/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── cash-flow-statement/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── settings/
│   │   │   │   │   ├── organization/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── users/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── tax-configuration/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── fiscal-periods/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── audit-logs/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   └── layout.tsx          # Main dashboard layout
│   │   │   │
│   │   │   └── layout.tsx              # Dashboard layout wrapper
│   │   │
│   │   ├── api/                        # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── session/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── organizations/
│   │   │   │   ├── route.ts            # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts        # GET, PATCH, DELETE
│   │   │   │
│   │   │   ├── chart-of-accounts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── validate/
│   │   │   │       └── route.ts        # Validate double-entry balance
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── invoices/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── send/
│   │   │   │   │       └── route.ts
│   │   │   │   └── bulk/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── vendors/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── bills/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── payments/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── movements/
│   │   │   │   │   └── route.ts
│   │   │   │   └── adjustments/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── fixed-assets/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── depreciation/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── bank-accounts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── reconcile/
│   │   │   │           └── route.ts
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── balance-sheet/
│   │   │       │   └── route.ts
│   │   │       ├── profit-loss/
│   │   │       │   └── route.ts
│   │   │       ├── trial-balance/
│   │   │       │   └── route.ts
│   │   │       ├── general-ledger/
│   │   │       │   └── route.ts
│   │   │       └── cash-flow/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles with Tailwind
│   │   └── page.tsx                    # Landing page
│   │
│   ├── components/                     # React Components
│   │   ├── ui/                         # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── data-table.tsx         # Advanced data table
│   │   │   ├── dropdown.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   └── loading-spinner.tsx
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── organization-switcher.tsx
│   │   │
│   │   ├── forms/                      # Form components
│   │   │   ├── invoice-form.tsx
│   │   │   ├── bill-form.tsx
│   │   │   ├── journal-entry-form.tsx
│   │   │   ├── customer-form.tsx
│   │   │   ├── vendor-form.tsx
│   │   │   ├── product-form.tsx
│   │   │   └── account-form.tsx
│   │   │
│   │   ├── reports/                    # Report components
│   │   │   ├── balance-sheet.tsx
│   │   │   ├── profit-loss.tsx
│   │   │   ├── trial-balance.tsx
│   │   │   ├── general-ledger.tsx
│   │   │   └── report-filters.tsx
│   │   │
│   │   └── dashboard/                  # Dashboard widgets
│   │       ├── revenue-chart.tsx
│   │       ├── expense-chart.tsx
│   │       ├── cash-flow-widget.tsx
│   │       ├── recent-transactions.tsx
│   │       └── outstanding-invoices.tsx
│   │
│   ├── lib/                           # Core utilities
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # Authentication helpers
│   │   ├── session.ts                 # Session management
│   │   ├── permissions.ts             # RBAC helpers
│   │   ├── validation.ts              # Zod schemas
│   │   ├── utils.ts                   # General utilities
│   │   ├── currency.ts                # Currency formatting
│   │   ├── date.ts                    # Date utilities
│   │   └── constants.ts               # App constants
│   │
│   ├── services/                      # Business logic layer
│   │   ├── accounting/
│   │   │   ├── double-entry.service.ts    # Core double-entry logic
│   │   │   ├── journal-entry.service.ts
│   │   │   ├── posting.service.ts         # Auto-posting from invoices/bills
│   │   │   └── balance.service.ts         # Account balance calculations
│   │   │
│   │   ├── accounts-receivable/
│   │   │   ├── invoice.service.ts
│   │   │   ├── customer.service.ts
│   │   │   └── payment-allocation.service.ts
│   │   │
│   │   ├── accounts-payable/
│   │   │   ├── bill.service.ts
│   │   │   ├── vendor.service.ts
│   │   │   └── purchase-order.service.ts
│   │   │
│   │   ├── inventory/
│   │   │   ├── stock.service.ts
│   │   │   ├── cogs.service.ts           # COGS calculation
│   │   │   └── valuation.service.ts      # Inventory valuation
│   │   │
│   │   ├── banking/
│   │   │   ├── reconciliation.service.ts
│   │   │   └── cash-flow.service.ts
│   │   │
│   │   ├── fixed-assets/
│   │   │   ├── depreciation.service.ts
│   │   │   └── asset.service.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── balance-sheet.service.ts
│   │   │   ├── profit-loss.service.ts
│   │   │   ├── trial-balance.service.ts
│   │   │   ├── general-ledger.service.ts
│   │   │   └── cash-flow-statement.service.ts
│   │   │
│   │   ├── tax/
│   │   │   ├── tax-calculation.service.ts
│   │   │   └── tax-report.service.ts
│   │   │
│   │   └── audit/
│   │       └── audit-log.service.ts
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-organization.ts
│   │   ├── use-auth.ts
│   │   ├── use-permissions.ts
│   │   ├── use-toast.ts
│   │   └── use-debounce.ts
│   │
│   ├── types/                         # TypeScript types
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── enums.ts
│   │
│   └── middleware.ts                  # Next.js middleware (auth, org context)
│
├── public/                            # Static assets
│   ├── logo.svg
│   └── images/
│
├── tests/                             # Test files
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── flows/
│
├── .env                               # Environment variables
├── .env.example                       # Example environment variables
├── .eslintrc.json                     # ESLint config
├── .gitignore
├── next.config.js                     # Next.js config
├── package.json
├── tsconfig.json                      # TypeScript config
├── tailwind.config.ts                 # Tailwind CSS config
├── postcss.config.js                  # PostCSS config
├── README.md
└── docker-compose.yml                 # PostgreSQL + app containerization
```

## Key Architecture Decisions:

### 1. **Multi-Tenancy Implementation**
- Organization-based routing: `[orgSlug]` in URLs
- Middleware checks organization access before rendering
- All database queries filtered by `organizationId`

### 2. **Double-Entry Validation**
- `double-entry.service.ts` validates $\sum Debits = \sum Credits$
- API validates before saving transactions
- Database triggers can add additional safety

### 3. **API Layer**
- RESTful API routes in `/api`
- Consistent response format
- Error handling middleware

### 4. **Service Layer Pattern**
- Business logic separated from API routes
- Reusable across API and server components
- Handles complex accounting rules

### 5. **RBAC Implementation**
- Middleware checks user role and permissions
- `permissions.ts` helper functions
- Fine-grained access control per route

### 6. **Audit Trail**
- Service layer logs all create/update/delete operations
- Automatic timestamp and user tracking
- Stored in `AuditLog` table

This structure supports:
- ✅ Scalability (modular services)
- ✅ Maintainability (clear separation of concerns)
- ✅ Security (RBAC, audit logs)
- ✅ Double-entry integrity (validation layer)
- ✅ Multi-tenancy (organization isolation)
