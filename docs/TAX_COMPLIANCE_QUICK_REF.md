# Tax Compliance - Quick Reference

## Setup (5 Minutes)

### 1. Run Database Migration
```bash
cd d:\YourBooks
npx prisma migrate dev --name add-tax-compliance
npx prisma generate
```

### 2. Initialize Uganda URA Pack for Organization
```bash
curl -X POST http://localhost:3000/api/your-org/tax/compliance-pack \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"compliancePack": "UG_URA"}'
```

## Common Tasks

### Calculate VAT (Server-side)
```typescript
import { calculateUgandaVAT } from '@/lib/tax/uganda-ura-compliance';

// Standard 18% VAT
const vat = calculateUgandaVAT(10000000, 'STANDARD');
console.log(vat);
// { netAmount: 10000000, vatAmount: 1800000, grossAmount: 11800000 }
```

### Calculate WHT (Server-side)
```typescript
import { calculateUgandaWHT } from '@/lib/tax/uganda-ura-compliance';

const wht = calculateUgandaWHT(5000000, 'PROFESSIONAL_SERVICES');
console.log(wht);
// { grossAmount: 5000000, whtAmount: 300000, netAmount: 4700000 }
```

### Calculate PAYE (Server-side)
```typescript
import { calculateUgandaPAYE } from '@/lib/tax/uganda-ura-compliance';

const paye = calculateUgandaPAYE(1000000);  // UGX 1M salary
console.log(paye);
// { grossSalary: 1000000, paye: 127000, netSalary: 873000 }
```

### Generate Monthly VAT Return
```bash
curl -X POST http://localhost:3000/api/your-org/tax/vat-return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "saveToDB": true
  }'
```

### Generate Monthly WHT Return
```bash
curl -X POST http://localhost:3000/api/your-org/tax/wht-return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "saveToDB": true
  }'
```

## Tax Rates (Uganda 2024/2025)

### VAT
- Standard: **18%**
- Zero-rated: **0%** (exports, basic goods)
- Exempt: **0%** (financial services, education)

### WHT
- Professional Services: **6%**
- Rent: **6%**
- Management Fees: **15%**
- Interest: **15%**
- Dividends: **15%**
- Contractors: **6%**
- Commission: **10%**

### PAYE (Monthly)
| Income Range (UGX) | Tax Rate |
|--------------------|----------|
| 0 - 235,000 | 0% |
| 235,001 - 335,000 | 10% |
| 335,001 - 410,000 | 20% |
| 410,001 - 10,000,000 | 30% |
| Above 10,000,000 | 40% |

## Filing Deadlines

All monthly returns (VAT, WHT, PAYE) due by **15th of following month**.

## Database Fields

### Invoice
```typescript
{
  // ... existing fields
  efrisFDN: string | null           // EFRIS Fiscal Document Number
  efrisQRCode: string | null        // EFRIS QR Code
  whtApplicable: boolean            // WHT on this invoice?
  whtAmount: Decimal                // WHT amount
  whtRate: Decimal                  // WHT rate
}
```

### InvoiceItem
```typescript
{
  // ... existing fields
  taxRateId: string | null          // Link to TaxRate
  taxCategory: string | null        // "VAT_STANDARD_18"
}
```

### Bill
```typescript
{
  // ... existing fields
  whtApplicable: boolean
  whtAmount: Decimal
  whtRate: Decimal
  whtCertificateNo: string | null   // WHT certificate number
  efrisReceiptNo: string | null     // For input tax credit
}
```

### BillItem
```typescript
{
  // ... existing fields
  taxRateId: string | null
  taxCategory: string | null
  claimInputTax: boolean            // Can claim ITC?
}
```

### Transaction
```typescript
{
  // ... existing fields
  taxCategory: string | null        // Tax category tag
  taxAmount: Decimal | null
  taxReturnId: string | null        // Link to filed return
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/[orgSlug]/tax/compliance-pack` | POST | Initialize compliance pack |
| `/api/[orgSlug]/tax/compliance-pack` | GET | Get compliance settings |
| `/api/[orgSlug]/tax/calculate-wht` | POST | Calculate WHT on amount |
| `/api/[orgSlug]/tax/vat-return` | POST | Generate VAT return |
| `/api/[orgSlug]/tax/vat-return` | GET | Get saved VAT returns |
| `/api/[orgSlug]/tax/wht-return` | POST | Generate WHT return |
| `/api/[orgSlug]/tax/wht-return` | GET | Get saved WHT returns |

## Input Tax Credit Rules (Uganda)

✅ **Can Claim** if:
- Bill has valid EFRIS receipt number
- Tax category is STANDARD or ZERO_RATED
- Bill is not DRAFT/CANCELLED

❌ **Cannot Claim** if:
- No EFRIS receipt
- Tax category is EXEMPT
- Bill is DRAFT/CANCELLED

## Code Examples

### Create Invoice with VAT (TypeScript)
```typescript
const invoice = await prisma.invoice.create({
  data: {
    organizationId: 'org_123',
    customerId: 'cust_456',
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    subtotal: 10000000,
    taxAmount: 1800000,      // 18% VAT
    total: 11800000,
    items: {
      create: [{
        description: 'Web Development',
        quantity: 1,
        unitPrice: 10000000,
        taxRateId: 'rate_standard_vat',
        taxCategory: 'VAT_STANDARD_18',
        taxRate: 18.00,
        taxAmount: 1800000,
        total: 11800000,
      }]
    }
  }
});
```

### Create Bill with WHT (TypeScript)
```typescript
// 1. Calculate WHT
const whtCalc = calculateUgandaWHT(5000000, 'PROFESSIONAL_SERVICES');

// 2. Create bill
const bill = await prisma.bill.create({
  data: {
    organizationId: 'org_123',
    vendorId: 'vendor_789',
    billDate: new Date(),
    dueDate: addDays(new Date(), 30),
    subtotal: 5000000,
    taxAmount: 900000,       // 18% VAT
    total: 5900000,
    whtApplicable: true,
    whtAmount: whtCalc.whtAmount,  // 300000
    whtRate: 6.00,
    items: {
      create: [{
        description: 'Legal Services',
        quantity: 1,
        unitPrice: 5000000,
        taxRateId: 'rate_standard_vat',
        taxCategory: 'VAT_STANDARD_18',
        taxRate: 18.00,
        taxAmount: 900000,
        total: 5900000,
      }]
    }
  }
});

// 3. Record WHT transaction
await prisma.wHTTransaction.create({
  data: {
    organizationId: 'org_123',
    whtRuleId: 'wht_rule_professional',
    vendorId: 'vendor_789',
    billId: bill.id,
    grossAmount: 5000000,
    whtRate: 6.00,
    whtAmount: 300000,
    netAmount: 4700000,
    whtDate: new Date(),
    taxPeriod: '2025-12',
  }
});
```

### Generate Tax Returns (TypeScript)
```typescript
import { 
  generateUgandaVATReturn, 
  generateUgandaWHTReturn,
  saveVATReturn,
  saveWHTReturn 
} from '@/lib/tax/tax-return-generator';

// VAT Return
const vatReturn = await generateUgandaVATReturn(
  'org_123',
  new Date('2025-12-01'),
  new Date('2025-12-31')
);
const vatReturnId = await saveVATReturn('org_123', vatReturn);

// WHT Return
const whtReturn = await generateUgandaWHTReturn(
  'org_123',
  new Date('2025-12-01'),
  new Date('2025-12-31')
);
const whtReturnId = await saveWHTReturn('org_123', whtReturn);
```

## Testing

### Test Data Setup
```typescript
// 1. Create organization with UG_URA pack
await initializeUgandaURAPack('org_test');

// 2. Create test customer
const customer = await prisma.customer.create({ /* ... */ });

// 3. Create test invoice with VAT
const invoice = await prisma.invoice.create({ /* ... */ });

// 4. Generate VAT return
const vatReturn = await generateUgandaVATReturn(
  'org_test',
  startOfMonth(new Date()),
  endOfMonth(new Date())
);

// 5. Verify calculations
expect(vatReturn.netVAT).toBeGreaterThan(0);
expect(vatReturn.salesInvoiceCount).toBe(1);
```

## Troubleshooting

### VAT Return shows 0 Input Tax Credit
**Issue**: Input VAT not being claimed  
**Solution**: Ensure bills have `efrisReceiptNo` populated

### WHT not calculating
**Issue**: WHT amount is 0  
**Solution**: Check amount exceeds threshold (UGX 1M for professional services)

### Tax rate not found
**Issue**: Error when creating invoice  
**Solution**: Run compliance pack initialization:
```bash
POST /api/[orgSlug]/tax/compliance-pack
{ "compliancePack": "UG_URA" }
```

## Support Files

- Full Documentation: `docs/TAX_COMPLIANCE.md`
- Schema: `prisma/schema.prisma`
- Uganda URA Functions: `src/lib/tax/uganda-ura-compliance.ts`
- Tax Return Generator: `src/lib/tax/tax-return-generator.ts`
- API Routes: `src/app/api/[orgSlug]/tax/*`
