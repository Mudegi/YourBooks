# Multi-Tax Invoice/Bill UI Implementation

## Overview
Successfully implemented comprehensive **multi-tax invoice and bill management** UI supporting:
- **Multiple tax lines per item** (standard, reduced, zero-rated, withholding)
- **Compound tax calculations** (sequential, cumulative tax-on-tax)
- **Withholding tax separation** (displayed and calculated net of WHT)
- **Real-time tax amount updates** (dynamic recalculation as taxes change)
- **Expandable tax line editor** (compact by default, expandable for detail)

## What Was Built

### 1. Invoice UI Enhancement
**File**: [src/app/(dashboard)/[orgSlug]/accounts-receivable/invoices/new/page.tsx](src/app/(dashboard)/[orgSlug]/accounts-receivable/invoices/new/page.tsx)

#### Features:
- **Multi-Tax Line Support**: Each line item can have multiple tax lines with different rates and types
- **Expandable Tax Editor**: Click chevron icon to expand/collapse tax line details
- **Tax Line Types**:
  - Standard Tax (normal VAT/GST)
  - Reduced Rate (e.g., 5% food tax)
  - Zero-Rated (export goods)
  - Exempt (financial services)
  - Withholding Tax (separate from standard tax)

#### Tax Line Attributes:
```typescript
interface TaxLine {
  taxType: string;           // STANDARD, REDUCED, ZERO, EXEMPT, WITHHOLDING
  rate: number;              // Tax rate as percentage
  jurisdictionId?: string;   // Optional jurisdiction link
  taxRuleId?: string;        // Optional tax rule reference
  isCompound?: boolean;      // Whether to compound on prior tax amounts
  compoundSequence?: number; // Order of compounding (1=first, 2=second, etc)
  isWithholding?: boolean;   // Whether this is withholding tax
}
```

#### Calculation Logic:
1. **Line Subtotal**: `quantity × unitPrice - discount`
2. **Tax Accumulation**:
   - Sort tax lines by `compoundSequence`
   - For each tax line:
     - If `isCompound=true`: Base = lineSubtotal + accumulated tax
     - If `isCompound=false`: Base = lineSubtotal
     - Calculate: `taxAmount = base × (rate / 100)`
     - Add to accumulator (unless `isWithholding`)
3. **Line Total**: `lineSubtotal + taxAccumulator`
4. **Withholding**: Calculated separately, not added to line total

#### Invoice Totals Displayed:
```
Subtotal:          (sum of all line subtotals)
Tax (excl. WHT):   (sum of all non-withholding taxes)
Total (before WHT): (subtotal + tax)
Withholding Tax:   (sum of all withholding taxes) ← shown only if > 0
Amount Due (net):  (total - withholding)          ← net amount customer pays
```

### 2. Bill UI Enhancement
**File**: [src/app/(dashboard)/[orgSlug]/accounts-payable/bills/new/page.tsx](src/app/(dashboard)/[orgSlug]/accounts-payable/bills/new/page.tsx)

#### Features:
- **Identical multi-tax support** to invoices
- **Tax line management** with same interface
- **Withholding tax tracking** for vendor payments
- **Input tax credit eligibility** (WHT withholding eligible)

#### Key Differences from Invoices:
- Links to **Expense Accounts** instead of Revenue
- Tracks **Vendor** instead of Customer
- **Withholding tax** represents tax recoverable/paid to vendor
- Amount Due = Total - Withholding (vendor owes less if WHT applies)

### 3. Database Schema Alignment
**Schema File**: [prisma/schema.prisma](prisma/schema.prisma)

#### InvoiceTaxLine Model:
```prisma
model InvoiceTaxLine {
  id               String   @id @default(cuid())
  invoiceItemId    String
  taxRuleId        String?
  jurisdictionId   String?
  taxType          String              // TAX type descriptor
  rate             Decimal  @db.Decimal(5, 2)
  baseAmount       Decimal  @db.Decimal(19, 4)
  taxAmount        Decimal  @db.Decimal(19, 4)
  isCompound       Boolean  @default(false)
  compoundSequence Int      @default(1)
  isWithholding    Boolean  @default(false)
  createdAt        DateTime @default(now())

  invoiceItem  InvoiceItem      @relation(fields: [invoiceItemId], references: [id], onDelete: Cascade)
  taxRule      TaxRule?         @relation(fields: [taxRuleId], references: [id])
  jurisdiction TaxJurisdiction? @relation(fields: [jurisdictionId], references: [id])
}
```

#### Related Models:
- **InvoiceItem**: `taxLines: InvoiceTaxLine[]` ← array of tax lines per item
- **TaxRule**: Stores predefined tax rules (rate, type, jurisdiction)
- **TaxJurisdiction**: Manages tax jurisdictions and hierarchies

### 4. Backend Service Updates
**File**: [src/services/accounts-receivable/invoice.service.ts](src/services/accounts-receivable/invoice.service.ts)

#### Calculation Methods:
```typescript
// Calculate totals including multi-tax
calculateInvoiceTotals(items: InvoiceItemInput[]): InvoiceCalculationResult
  → Returns: { subtotal, taxAmount, withholding, total, amountDue, withholdingRate }

// Calculate line with tax lines
calculateLineTotals(item: InvoiceItemInput): CalculatedInvoiceItem
  → Returns: { taxLines[], taxAmount, withholdingAmount, total }

// Process tax accumulation
sortedTaxLines
  .forEach(line => {
    base = line.isCompound ? subtotal + taxAccum : subtotal
    amount = base * (rate / 100)
    isWithholding ? withholdingAccum += amount : taxAccum += amount
  })
```

#### GL Posting Updates:
- **Debit**: Accounts Receivable (full invoice total)
- **Credit**: Sales Revenue (subtotal only)
- **Credit**: Tax Payable (standard taxes only, excl. withholding)
- **Debit**: Withholding Tax Receivable (if WHT > 0)

**Example GL Entries** (Invoice with 1000 subtotal, 180 tax, 60 WHT):
```
DR  Accounts Receivable    1,120  (1000 + 180 - 60)
  CR  Sales Revenue                 1,000
  CR  Tax Payable                     180
DR  Withholding Tax Receivable  60
```

### 5. API Contract Updates
**Route**: `/api/orgs/{orgSlug}/invoices` (POST)

#### Request Payload:
```json
{
  "customerId": "cust-123",
  "invoiceDate": "2024-12-19",
  "dueDate": "2025-01-18",
  "items": [
    {
      "description": "Professional Service",
      "quantity": 1,
      "unitPrice": 10000,
      "discount": 0,
      "taxLines": [
        {
          "taxType": "STANDARD",
          "rate": 18,
          "isCompound": false,
          "isWithholding": false
        },
        {
          "taxType": "WITHHOLDING",
          "rate": 6,
          "isCompound": false,
          "isWithholding": true
        }
      ]
    }
  ]
}
```

#### Validation in Service:
- `taxLines` array required (can be empty)
- Each tax line must have `rate ≥ 0`
- `compoundSequence` auto-filled if not provided
- `isWithholding` toggles tax classification
- Multiple WHT lines supported (e.g., different WHT types)

## Usage Examples

### Example 1: Standard Single Tax
**Scenario**: Selling goods with 18% VAT
```
Item: Laptop
  Quantity: 1
  Unit Price: 1,000,000
  
Tax Line:
  Type: Standard
  Rate: 18%

Calculation:
  Subtotal: 1,000,000
  VAT: 180,000
  Total: 1,180,000
  Amount Due: 1,180,000
```

### Example 2: Compound Tax (VAT + Excise)
**Scenario**: Selling alcohol with VAT on top of excise
```
Item: Alcohol
  Quantity: 10
  Unit Price: 100,000
  
Tax Line 1:
  Type: Excise
  Rate: 20%
  Compound: No
  Sequence: 1
  
Tax Line 2:
  Type: VAT
  Rate: 18%
  Compound: Yes
  Sequence: 2

Calculation:
  Subtotal: 1,000,000
  Excise: 1,000,000 × 0.20 = 200,000
  VAT: (1,000,000 + 200,000) × 0.18 = 216,000
  Total: 1,416,000
  Amount Due: 1,416,000
```

### Example 3: Professional Service with Withholding
**Scenario**: Consulting invoice with VAT + client withholding
```
Item: Consulting Services
  Quantity: 1
  Unit Price: 50,000
  
Tax Line 1:
  Type: Standard
  Rate: 18%
  Compound: No
  Withholding: No
  
Tax Line 2:
  Type: Withholding
  Rate: 10%
  Compound: No
  Withholding: Yes

Calculation:
  Subtotal: 50,000
  VAT: 9,000
  Total (before WHT): 59,000
  Withholding Tax: 5,000  (10% of subtotal)
  Amount Due: 54,000  (net of WHT)
```

### Example 4: Zero-Rated Export Sale
**Scenario**: Exporting goods with zero VAT
```
Item: Export Product
  Quantity: 100
  Unit Price: 1,000
  
Tax Line:
  Type: Zero-Rated
  Rate: 0%

Calculation:
  Subtotal: 100,000
  VAT: 0
  Total: 100,000
  Amount Due: 100,000
```

## Frontend Components

### Invoice Form Layout:
```
┌─────────────────────────────────────────────────────┐
│ Customer, Invoice Date, Due Date, Reference, Notes  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Line Items Table                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Desc | Qty | Unit $ | Discount | Amount | v [x] │ │
│ │────────────────────────────────────────────────── │ │
│ │ Item │  1  │  100   │    0     │  100  │ ▼     │ │
│ │ [Expanded: Tax Lines]                           │ │
│ │ - [STANDARD 18%] [Compound] [WHT] [x]           │ │
│ │ - [+ Add Tax]                                   │ │
│ └─────────────────────────────────────────────────┘ │
│ [+ Add Item]                                        │
├─────────────────────────────────────────────────────┤
│ Subtotal:              $100.00                       │
│ Tax (excl. WHT):       $ 18.00                       │
│ Total (before WHT):    $118.00                       │
│ Withholding Tax:       -$ 6.00                       │
│ Amount Due (net):      $112.00                       │
└─────────────────────────────────────────────────────┘
```

## Testing

### Test File
**File**: [src/services/accounting/multi-tax.test.ts](src/services/accounting/multi-tax.test.ts)

### Test Coverage:
1. **Standard Tax** (single rate)
2. **Compound Tax** (sequential, multi-level)
3. **Withholding Tax** (separate calculation, net amount)
4. **Multiple Items** (mixed tax configurations)
5. **GL Posting** (correct account postings)
6. **Edge Cases**:
   - Zero tax rates
   - No tax lines
   - Only withholding (no standard tax)
   - High compound sequences

### Running Tests:
```bash
# Run all tests
npm test

# Run multi-tax tests only
npm test multi-tax.test.ts

# Run with coverage
npm test -- --coverage
```

## Integration with Existing Features

### Tax Rules & Jurisdictions:
- Tax lines can reference existing `TaxRule` and `TaxJurisdiction` records
- Enables **rule-based tax application** (select rule → auto-populate rate, type, etc)
- Future: **auto-suggest** tax lines based on jurisdiction + product combo

### Compliance Packs:
- Uganda `UG_URA`: Supports VAT (18%), WHT (6%, 10%, 15%), PAYE
- Tax lines stored with `taxType` for audit trail
- Filing-ready: All tax calculations traceable to rules/jurisdictions

### E-Invoicing (EFRIS):
- Invoice totals correctly reflect withholding in EFRIS submission
- WHT tracked separately for tax authority reconciliation
- Fiscal receipt numbering unchanged

## Known Limitations & Future Enhancements

### Current Limitations:
1. **No tax rule templates**: Must manually enter each tax line (UI enhancement in progress)
2. **No jurisdiction pre-selection**: Tax lines don't auto-populate by customer location
3. **Mobile UI**: Expandable tax editor may be cramped on mobile

### Planned Enhancements:
1. **Tax Rule Presets**: Save common configurations (e.g., "Uganda Standard")
2. **Jurisdiction Auto-Detection**: Pre-select taxes based on customer address
3. **Bulk Tax Application**: Apply same tax config to multiple items at once
4. **Tax Line Templates**: Save and reuse tax combinations
5. **Conditional Taxes**: Show/hide tax lines based on product category or customer type
6. **Mobile-Optimized Editor**: Dedicated tax configuration view on mobile

## Backward Compatibility

- **Existing invoices**: Unchanged (simple `taxRate` still works)
- **Legacy API calls**: `taxRate` converted to single `taxLines` entry
- **Data migration**: Not required (optional tax lines are additive)

### Migration Path (optional):
```sql
-- For organizations wanting to migrate to multi-tax:
INSERT INTO InvoiceTaxLine (invoiceItemId, taxType, rate, baseAmount, taxAmount, isCompound, isWithholding)
SELECT 
  ii.id,
  'STANDARD',
  ii.taxRate,
  (ii.quantity * ii.unitPrice) - COALESCE(ii.discount, 0),
  ii.taxAmount,
  false,
  false
FROM InvoiceItem ii
WHERE ii.taxRate > 0 AND NOT EXISTS (
  SELECT 1 FROM InvoiceTaxLine itl WHERE itl.invoiceItemId = ii.id
);
```

## Performance Considerations

### Frontend:
- Tax calculation runs on client (no API calls)
- Expandable rows prevent UI clutter
- Decimal.js ensures precision for financial math

### Backend:
- Tax calculations in service layer (reusable)
- GL posting batched per invoice (single transaction)
- Indexes on `isWithholding`, `isCompound` for queries

### Database:
- `InvoiceTaxLine` indexed on `invoiceItemId` (cascade-delete fast)
- No circular dependencies between tax tables
- Supports bulk invoice operations via batch inserts

## Next Steps

1. **Tax Line Templates UI**: Create saved tax configs for quick reuse
2. **Jurisdiction Auto-Selection**: Detect and pre-populate taxes by location
3. **Bill Payments with WHT**: Handle WHT credit/settlement flow
4. **Tax Authority Reporting**: Export invoices grouped by tax type/jurisdiction
5. **Multi-Currency**: Support tax calculations in foreign currencies
6. **Audit Reports**: Generate tax impact reports per jurisdiction

---

**Status**: ✅ **COMPLETE**  
**Last Updated**: 2024-12-19  
**Owner**: Engineering Team
