# Customer Master Quick Reference Guide

## Overview
Enterprise-grade Customer Master for AR with global localization support.

---

## Key Files

### Service Layer
- **CustomerService**: `src/services/ar/customer.service.ts`
  - Country-blind implementation
  - Financial summary calculation
  - Credit checking
  - Aging analysis
  - GL integration

### API Endpoints
1. **Customer Financials**: `/api/orgs/[orgSlug]/customers/[id]/financials`
2. **Credit Check**: `/api/orgs/[orgSlug]/customers/[id]/credit-check`
3. **AR Aging Report**: `/api/orgs/[orgSlug]/reports/aging`

### UI Components
- **Customer Edit**: `src/app/(dashboard)/[orgSlug]/accounts-receivable/customers/[id]/edit/page.tsx`
  - Multi-tab interface (General, Financial, Address, Receivables, Documents)
  - Dynamic tax ID validation
  - Real-time credit status

---

## Quick Start: Credit Check

```typescript
import { customerService } from '@/services/ar/customer.service';

// Perform credit check before creating sales order
const creditCheck = await customerService.performCreditCheck(
  customerId,
  organizationId,
  proposedAmount // e.g., 25000.00
);

if (!creditCheck.isApproved) {
  console.log(`Blocked: ${creditCheck.reason}`);
  // Show warning or require approval
} else {
  console.log(`Approved: ${creditCheck.availableCredit} remaining`);
  // Proceed with order
}
```

---

## Quick Start: Get Customer Financials

```typescript
// Get comprehensive customer data
const customer = await customerService.getCustomerWithFinancials(
  customerId,
  organizationId
);

console.log({
  displayName: customer.displayName,
  totalOutstanding: customer.financialSummary.totalOutstanding,
  riskScore: customer.financialSummary.riskScore,
  agingSummary: customer.financialSummary.agingSummary,
  creditAvailable: customer.financialSummary.creditAvailable,
});
```

---

## Quick Start: Generate Aging Report

```typescript
// Generate AR aging report for organization
const report = await customerService.generateAgingReport(
  organizationId,
  {
    asOfDate: new Date(),
    includeInactive: false,
    branchId: 'branch_xxx', // Optional
  }
);

// Report contains:
// - customers: Array of customer aging data
// - totals: Organization-wide aging summary
console.log(report.totals);
```

---

## Tax ID Validation (Localized)

```typescript
import { localizationProvider } from '@/lib/localization/localization-provider';

// Get tax ID label for country
const label = await localizationProvider.getTaxIdLabel('UG');
// Returns: "TIN"

// Validate tax ID format
const isValid = await localizationProvider.validateTaxId(
  '1234567890',
  'UG'
);
// Returns: true (10 digits for Uganda)

// Get validation message
const message = await localizationProvider.getTaxIdValidationMessage('UG');
// Returns: "TIN must be 10 digits (e.g., 1234567890)"
```

---

## Supported Countries & Tax ID Formats

| Country | Code | Tax ID | Format | Example |
|---------|------|--------|--------|---------|
| Uganda | UG | TIN | 10 digits | 1234567890 |
| Kenya | KE | KRA PIN | A + 9 digits + Z | A123456789Z |
| Tanzania | TZ | TIN | 9 digits + Letter | 123456789A |
| United States | US | EIN | XX-XXXXXXX | 12-3456789 |
| United Kingdom | GB | VAT No | GB + 9/12 digits | GB123456789 |
| Canada | CA | BN | 9 digits | 123456789 |
| Australia | AU | ABN | 11 digits | 12345678901 |
| India | IN | GSTIN | 15 alphanumeric | 22AAAAA0000A1Z5 |
| South Africa | ZA | Tax Ref | 10 digits | 1234567890 |
| Nigeria | NG | TIN | 8-11 digits | 12345678 |
| Ghana | GH | TIN | Letter + 10-13 digits | A1234567890 |
| Zambia | ZM | TPIN | 10 digits | 1234567890 |
| Rwanda | RW | TIN | 9 digits | 123456789 |

---

## Credit Risk Scoring

```typescript
// Risk scores are auto-calculated based on aging:

// LOW: No overdue invoices
// MEDIUM: 31-60 days overdue
// HIGH: 61-90 days overdue
// CRITICAL: 90+ days overdue

const riskScore = customer.financialSummary.riskScore;
const isCreditHold = customer.financialSummary.isCreditHold;
```

---

## Aging Buckets

```typescript
const aging = customer.financialSummary.agingSummary;

console.log({
  current: aging.current,        // 0-30 days
  days31_60: aging.days31_60,    // 31-60 days
  days61_90: aging.days61_90,    // 61-90 days
  days90Plus: aging.days90Plus,  // 90+ days
});

// Detailed buckets with percentages
aging.buckets.forEach(bucket => {
  console.log(`${bucket.label}: $${bucket.amount} (${bucket.percentOfTotal}%)`);
});
```

---

## Address Formatting (Regional)

```typescript
// East African format (UG, KE, TZ)
const address = {
  street: '123 Main St',
  district: 'Kampala',
  city: 'Kampala',
  region: 'Central',
  postalCode: '256',
  country: 'Uganda',
};

// US/EU format
const address = {
  street: '123 Main St',
  street2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'United States',
};
```

---

## Payment Terms

```typescript
// Get localized payment terms
const terms = await localizationProvider.getPaymentTermsOptions('UG');

// Returns:
// [
//   { value: 0, label: 'Due on Receipt' },
//   { value: 7, label: 'Net 7' },
//   { value: 30, label: 'Net 30' },
//   { value: 120, label: 'Net 120 (Gov)' }, // Uganda-specific
// ]
```

---

## Integration Points

### Sales Orders
```typescript
// When creating sales order:
// 1. Get customer data (price list, discount, tax category)
const customer = await customerService.getCustomerWithFinancials(customerId, orgId);

// 2. Perform credit check
const check = await customerService.performCreditCheck(customerId, orgId, orderTotal);

// 3. Apply business rules
if (!check.isApproved) {
  // Block order or require approval
}

// 4. Use customer settings
order.paymentTerms = customer.paymentTerms;
order.shippingAddress = customer.shippingAddress;
order.taxCategory = customer.taxCategory;
```

### E-Invoicing (EFRIS/eTIMS)
```typescript
// Customer TIN used for invoice compliance
invoice.customerTIN = customer.taxIdNumber;
invoice.customerName = customer.displayName;

// Tax ID validation before invoice submission
const taxIdValid = customer.complianceFlags.taxIdValid;
if (!taxIdValid) {
  throw new Error(`Invalid ${customer.taxIdLabel} for customer`);
}
```

### General Ledger
```typescript
// Get AR balance from GL (source of truth)
const arBalance = await customerService.getArBalanceFromLedger(
  customerId,
  organizationId
);

// This queries the actual GL entries, not the invoice table
```

---

## Common Workflows

### 1. Create New Customer with Credit Limit
```typescript
const customer = await prisma.customer.create({
  data: {
    organizationId,
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+256700000000',
    taxIdNumber: '1234567890', // Uganda TIN
    creditLimit: 50000.00,
    paymentTerms: 30,
    taxCategory: 'WHOLESALE',
    billingAddress: { /* ... */ },
    shippingAddress: { /* ... */ },
  },
});

// Create opening balance if migrating
await createOpeningBalanceEntry(
  customer.id,
  customer.companyName,
  organizationId,
  userId,
  15000.00 // Opening AR balance
);
```

### 2. Check Credit Before Sales Order
```typescript
const creditCheck = await customerService.performCreditCheck(
  customerId,
  organizationId,
  proposedAmount
);

if (creditCheck.isApproved) {
  // Create sales order
} else if (creditCheck.requiresApproval) {
  // Send for management approval
} else {
  // Block order
  alert(`Order exceeds credit limit. Reason: ${creditCheck.reason}`);
}
```

### 3. Generate Dunning Letters (Coming Soon)
```typescript
const report = await customerService.generateAgingReport(organizationId);

// Filter customers with 30+ days overdue
const overdueCustomers = report.customers.filter(c =>
  c.agingSummary.days31_60 > 0 ||
  c.agingSummary.days61_90 > 0 ||
  c.agingSummary.days90Plus > 0
);

// Send reminder emails
overdueCustomers.forEach(customer => {
  sendPaymentReminder(customer);
});
```

---

## Best Practices

### 1. Always Use GL as Source of Truth
```typescript
// DON'T: Sum invoices directly
const balance = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

// DO: Get from GL
const balance = await customerService.getArBalanceFromLedger(customerId, orgId);
```

### 2. Validate Tax ID on Save
```typescript
const isValid = await localizationProvider.validateTaxId(
  taxIdNumber,
  organization.homeCountry
);

if (!isValid) {
  const message = await localizationProvider.getTaxIdValidationMessage(
    organization.homeCountry
  );
  throw new Error(message);
}
```

### 3. Use Financial Summary for Dashboards
```typescript
// DON'T: Calculate in component
const outstanding = customer.invoices
  .filter(i => i.status !== 'PAID')
  .reduce((sum, i) => sum + i.amountDue, 0);

// DO: Use pre-calculated summary
const outstanding = customer.financialSummary.totalOutstanding;
```

---

## Performance Tips

### 1. Cache Localization Data
```typescript
// Cache tax labels and payment terms for 1 hour
const cacheKey = `tax-label-${countryCode}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const label = await localizationProvider.getTaxIdLabel(countryCode);
await cache.set(cacheKey, label, 3600); // 1 hour
```

### 2. Limit Aging Report Scope
```typescript
// For large customer bases, filter by branch or date range
const report = await customerService.generateAgingReport(
  organizationId,
  {
    branchId: 'branch_xxx', // Filter by branch
    includeInactive: false, // Exclude inactive
  }
);
```

### 3. Use Pagination for Customer List
```typescript
// Don't load all customers at once
const customers = await prisma.customer.findMany({
  where: { organizationId, isActive: true },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { companyName: 'asc' },
});
```

---

## Troubleshooting

### Tax ID Validation Failing
```typescript
// Check country code is correct
console.log(organization.homeCountry); // Should be 'UG', 'US', etc.

// Check format
const taxId = '1234567890';
const isValid = await localizationProvider.validateTaxId(taxId, 'UG');
console.log(isValid); // Should be true for 10 digits

// Get expected format
const message = await localizationProvider.getTaxIdValidationMessage('UG');
console.log(message); // "TIN must be 10 digits (e.g., 1234567890)"
```

### Credit Check Not Working
```typescript
// Verify credit limit is set
console.log(customer.creditLimit); // Should be number or null (unlimited)

// Check current balance
const financial = await customerService.getCustomerWithFinancials(customerId, orgId);
console.log(financial.financialSummary.totalOutstanding);

// Verify proposed amount
console.log(proposedAmount); // Must be positive number
```

### Aging Report Empty
```typescript
// Check for active customers
const activeCount = await prisma.customer.count({
  where: { organizationId, isActive: true },
});
console.log(`Active customers: ${activeCount}`);

// Check for unpaid invoices
const unpaidCount = await prisma.invoice.count({
  where: {
    organizationId,
    status: { notIn: ['PAID', 'CANCELLED'] },
  },
});
console.log(`Unpaid invoices: ${unpaidCount}`);
```

---

## API Response Examples

### GET /api/orgs/[orgSlug]/customers/[id]/financials
```json
{
  "success": true,
  "data": {
    "id": "cust_123",
    "displayName": "Acme Corp",
    "taxIdLabel": "TIN",
    "complianceFlags": {
      "taxIdValid": true,
      "creditCheckRequired": false,
      "documentationComplete": true,
      "kycVerified": true
    },
    "financialSummary": {
      "totalOutstanding": 15000.00,
      "totalPaid": 85000.00,
      "totalInvoiced": 100000.00,
      "creditAvailable": 35000.00,
      "creditUtilization": 30.0,
      "isCreditHold": false,
      "riskScore": "LOW",
      "agingSummary": {
        "current": 12000.00,
        "days31_60": 2000.00,
        "days61_90": 1000.00,
        "days90Plus": 0.00
      }
    }
  }
}
```

---

## Documentation
See [CUSTOMER_MASTER_IMPLEMENTATION_SUMMARY.md](./CUSTOMER_MASTER_IMPLEMENTATION_SUMMARY.md) for complete implementation details.
