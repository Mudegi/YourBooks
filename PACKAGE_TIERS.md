# YourBooks Package Tiers

## Overview

YourBooks is available in two packages: **Pro** and **Advanced**. Each tier provides a specific set of features geared toward different business needs.

---

## YourBooks Pro

**Ideal for**: Sole proprietors, small businesses, and startups focused on core accounting.

### Included Features

- **General Ledger** – Chart of accounts, journal entries, trial balance
- **Accounts Receivable** – Customers, invoices, aged receivables, payment tracking
- **Accounts Payable** – Vendors, bills, PO-to-pay, payment scheduling
- **Payments** – Customer and vendor payment processing and reconciliation
- **Banking** – Bank account management, statement imports, basic reconciliation
- **Inventory** – Product master, stock movements, simple adjustments
- **Basic Tax/VAT** – Tax rate setup, tax computation on invoices/bills, VAT return templates
- **Standard Reports** – Balance sheet, P&L, cash flow, trial balance, aged receivables/payables
- **User Roles & Access Control** – Admin, manager, viewer roles with permission enforcement
- **Multi-branch Support** – Basic branch setup and reporting
- **Audit Logs** – User activity and change history

### Not Included

- Manufacturing (BOMs, work orders, assembly builds)
- Fixed assets and depreciation
- Budgeting and forecasting
- Projects and job costing
- Advanced reporting and custom dashboards
- Compliance packs (Uganda URA, Kenya KRA, etc.)
- Automations and recurring transactions (basic only)
- CRM and sales pipeline
- Advanced inventory (cycle counts, lot/serial tracking, valuations)
- Warehouse management (transfers, putaway/picking)
- HCM, payroll, and employee management
- Field service management
- Maintenance and asset management
- Quality control (inspections, holds, NCRs, CAPA)
- Advanced planning (demand forecasts, safety stock, reorder policies)
- Advanced costing (standard costs, variances, landed costs)

---

## YourBooks Advanced

**Ideal for**: Growing businesses, manufacturers, distributors, and enterprises needing full-featured ERP.

### Included Features

**All Pro features, plus:**

- **Manufacturing** – Bill of materials, work orders, assembly builds, cost rollup, wastage tracking, scrap accounting
- **Fixed Assets** – Asset register, depreciation (straight-line, diminishing value), retirement, impairment
- **Projects & Job Costing** – Project setup, task tracking, labor allocation, billing by project
- **Budgeting & Forecasting** – Budget creation, variance analysis, forecast vs. actual
- **Advanced Reporting & BI** – Custom dashboards, ad-hoc reports, scheduled email delivery, data cubes
- **Compliance Packs** – Uganda URA (excise duty, e-invoicing), Kenya KRA, multi-country tax rules
- **Automations & Workflows** – Recurring transactions, approval workflows, auto-matching, scheduled tasks
- **CRM** – Companies, contacts, sales opportunities, activity tracking
- **Advanced Inventory** – Cycle counts, lot/serial tracking, inventory valuations, reservations
- **Warehouse Management** – Warehouses, transfer orders, putaway/picking workflows, cycle counting
- **HCM & Payroll** – Employee master, leave management, expense claims, basic payroll (if integrated)
- **Field Service** – Work order dispatch, technician tracking, SLA management
- **Maintenance & EAM** – Equipment master, maintenance plans, work order execution, spare parts tracking
- **Quality Management** – Inspections, quality holds, NCRs (non-conformances), CAPA (corrective/preventive actions)
- **Advanced Planning** – Demand forecasts, safety stock calculation, reorder point policies
- **Advanced Costing** – Standard costs, cost variances, landed cost allocation, cost revaluations
- **Multi-currency Support** – Currency conversion, multi-currency invoicing, forex gains/losses
- **Bank Feeds & Connections** – Direct bank connections, transaction matching, auto-categorization
- **E-Invoicing & Integrations** – E-invoice submission (country-specific), ERPNext sync, Xero sync, API access

---

## Feature Comparison Matrix

| Feature | Pro | Advanced |
|---------|-----|----------|
| **Accounting** | | |
| General Ledger | ✓ | ✓ |
| Accounts Receivable | ✓ | ✓ |
| Accounts Payable | ✓ | ✓ |
| Payments | ✓ | ✓ |
| Banking | ✓ | ✓ |
| Bank Feeds (basic) | ✓ | ✓ |
| **Inventory & Supply Chain** | | |
| Inventory Basic | ✓ | ✓ |
| Cycle Counts | | ✓ |
| Lot/Serial Tracking | | ✓ |
| Valuations | | ✓ |
| Warehouse Management | | ✓ |
| **Operations** | | |
| Manufacturing | | ✓ |
| Fixed Assets | | ✓ |
| Projects | | ✓ |
| **Compliance & Reporting** | | |
| Tax/VAT (basic) | ✓ | ✓ |
| Compliance Packs | | ✓ |
| Standard Reports | ✓ | ✓ |
| Advanced Reporting & BI | | ✓ |
| E-Invoicing | | ✓ |
| **HR & Operations** | | |
| HCM/Payroll | | ✓ |
| Field Service | | ✓ |
| Maintenance/EAM | | ✓ |
| **Quality & Planning** | | |
| Quality Management | | ✓ |
| Demand Planning | | ✓ |
| Advanced Costing | | ✓ |
| **Integrations** | | |
| Automations | ✓ (basic) | ✓ |
| CRM | | ✓ |
| API Access | | ✓ |
| Third-Party Sync | | ✓ |

---

## Pricing & Upgrades

- **YourBooks Pro**: Starting at $99/month (annual) or $129/month (monthly)
- **YourBooks Advanced**: Starting at $299/month (annual) or $399/month (monthly)

### Upgrade Path

Users on Pro can upgrade to Advanced at any time:
1. Navigate to **Settings** → **Subscription**
2. Click **Upgrade to Advanced**
3. Confirm new plan and billing details
4. Upgrade is effective immediately; users are prorated for the remainder of the month

---

## Technical Implementation

### Package Tier Gating

The system uses the `PackageTier` enum (`PRO`, `ADVANCED`) stored on the `Organization` model. All API routes and UI features check the organization's package tier before granting access.

#### Backend Enforcement

```typescript
// API route gating example
import { ensurePackageAccess } from '@/lib/access';
import { PackageTier } from '@prisma/client';

export async function POST(request, { params }) {
  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } });
  
  // Enforce Advanced package
  await ensurePackageAccess(org.id, [PackageTier.ADVANCED]);
  
  // Proceed with manufacturing logic...
}
```

#### Frontend Gating

Navigation items and UI sections use the `hasFeatureAccess()` utility:

```typescript
import { hasFeatureAccess } from '@/lib/package-gates';

if (hasFeatureAccess(organization.package, 'manufacturing')) {
  // Show manufacturing menu and page
}
```

### Feature Flags

All features are mapped in [src/lib/package-gates.ts](src/lib/package-gates.ts) for easy reference and testing:

```typescript
export const PACKAGE_FEATURES = {
  PRO: { manufacturing: false, ...},
  ADVANCED: { manufacturing: true, ...}
};
```

---

## User Experience

### Pro Users Encountering Advanced Features

1. **Navigation**: Advanced feature menu items are hidden; no clutter
2. **Direct Access**: If a Pro user tries to access an advanced URL directly, they see an upgrade prompt with:
   - Feature name and description
   - Link to upgrade page
   - Current plan details
3. **API Error**: If accessing via API, a 403 status is returned with message: `"Upgrade to YourBooks Advanced to unlock [feature]"`

### Upgrade Prompts

- **Sidebar CTA**: Pro users see a blue upgrade card in the sidebar highlighting what Advanced unlocks
- **Feature Upgrade**: When blocked from a feature, a modal explains the upgrade and provides a link to the upgrade page
- **Email**: Users receive upgrade recommendations based on usage patterns (e.g., if they've created 5+ BOMs despite not having manufacturing enabled)

---

## Migration & Testing

### Testing Package Tiers

1. **Pro Test Org**: Create a test organization and manually set `package = 'PRO'` in database
2. **Verify Gating**: Attempt to access advanced endpoints; expect 403 errors
3. **Verify UI**: Log in as Pro user; verify advanced nav items are hidden
4. **Upgrade Flow**: Change `package = 'ADVANCED'` and refresh; verify access restored

### Data Migration

If an organization downgrades from Advanced to Pro:
- **Preserve Data**: All historical data (BOMs, work orders, etc.) remains in the database
- **Hide Access**: Navigation and API access to advanced features are blocked
- **Recovery**: If they upgrade again, their data is available

---

## See Also

- [QUICKSTART.md](../QUICKSTART.md) – Quick start guide for new users
- [SETUP.md](../SETUP.md) – Environment setup and initialization
- [src/lib/access.ts](../src/lib/access.ts) – Access control utilities
- [src/lib/package-gates.ts](../src/lib/package-gates.ts) – Feature gate definitions
