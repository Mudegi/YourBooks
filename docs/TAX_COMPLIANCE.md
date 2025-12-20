# Country-Specific Tax Compliance System

## Overview

YourBooks ERP now includes a comprehensive **Country-Specific Tax Compliance** system that automatically handles tax calculations, filing-ready ledger tagging, and one-click tax return generation based on the organization's home country.

## Features

### 1. Multi-Country Support
- **Tenant-Country Mapping**: Each organization selects their home country which activates the appropriate compliance pack
- **Compliance Packs**: Pre-configured tax rules for specific jurisdictions
  - `DEFAULT`: Basic tax handling
  - `US_GAAP`: United States GAAP compliance
  - `UG_URA`: Uganda Revenue Authority compliance ✅ **FULLY IMPLEMENTED**
  - `KE_KRA`: Kenya Revenue Authority (planned)
  - More countries can be added as needed

### 2. Filing-Ready Ledger
- Every transaction is tagged with a **TaxCategory** (e.g., "VAT_STANDARD_18", "WHT_PROFESSIONAL_6")
- Enables **one-click tax return generation** without manual data entry
- Complete audit trail for tax authorities

### 3. Uganda URA Compliance Pack ✅

The first fully implemented compliance pack supports all Uganda Revenue Authority requirements:

#### A. VAT (Value Added Tax)
- **Standard Rate**: 18% on most goods and services
- **Zero-rated**: 0% on exports, basic food items, medical supplies
- **Exempt**: Financial services, education, residential rent
- **Input Tax Credit Restrictions**:
  - Can only claim input tax with valid **EFRIS e-receipt**
  - System validates EFRIS receipt before allowing ITC claim
  - Non-compliant purchases tracked separately

#### B. WHT (Withholding Tax)
Automatic calculation with configurable thresholds:
- **Professional Services**: 6% (lawyers, accountants, consultants, engineers)
- **Management Fees**: 15%
- **Rent**: 6%
- **Dividends**: 15%
- **Interest**: 15%
- **Royalties**: 15%
- **Commission**: 10%
- **Contractors**: 6%

#### C. PAYE (Pay As You Earn)
Tiered income tax with Uganda's 2024/2025 brackets:
- 0%: First UGX 235,000/month
- 10%: UGX 235,001 - 335,000
- 20%: UGX 335,001 - 410,000
- 30%: UGX 410,001 - 10,000,000
- 40%: Above UGX 10,000,000

#### D. One-Click Tax Returns
- **Monthly VAT Return** (Form VAT 03)
- **Monthly WHT Return**
- **Monthly PAYE Return** (planned)
- **Income Tax Provisional Return** (planned)

## Database Schema

### New Models

#### 1. TaxRate Model
```prisma
model TaxRate {
  id                String       @id @default(cuid())
  organizationId    String
  name              String       // "Standard VAT", "Zero-rated"
  taxType           TaxType      // VAT, GST, SALES_TAX, etc.
  rate              Decimal      // 18.00 for 18%
  country           String       // "UG", "KE", "US"
  isDefault         Boolean
  isActive          Boolean
  effectiveFrom     DateTime
  effectiveTo       DateTime?
  taxCode           String?      // "T-18" (Uganda tax code)
  claimable         Boolean      // Can input tax be claimed?
  requiresEFRIS     Boolean      // Input tax needs EFRIS receipt?
}
```

#### 2. WHTRule Model
```prisma
model WHTRule {
  id                String       @id @default(cuid())
  organizationId    String
  name              String       // "Professional Services WHT"
  country           String       // "UG", "KE"
  whtType           WHTType      // PROFESSIONAL_SERVICES, RENT, etc.
  rate              Decimal      // 6.00 for 6%
  threshold         Decimal?     // UGX 1,000,000
  serviceCategories String[]     // ["PROFESSIONAL", "CONSULTING"]
  effectiveFrom     DateTime
}
```

#### 3. WHTTransaction Model
```prisma
model WHTTransaction {
  id                String       @id @default(cuid())
  organizationId    String
  whtRuleId         String
  vendorId          String
  grossAmount       Decimal
  whtRate           Decimal
  whtAmount         Decimal
  netAmount         Decimal
  whtDate           DateTime
  whtCertificateNo  String?
  taxPeriod         String       // "2025-12"
  filed             Boolean
}
```

#### 4. TaxReturn Model
```prisma
model TaxReturn {
  id                String         @id @default(cuid())
  organizationId    String
  returnType        TaxReturnType  // VAT_MONTHLY, WHT_MONTHLY, etc.
  taxPeriod         String         // "2025-12"
  startDate         DateTime
  endDate           DateTime
  country           String         // "UG"
  status            TaxReturnStatus // DRAFT, FILED, PAID
  // VAT amounts
  outputVAT         Decimal
  inputVAT          Decimal
  netVAT            Decimal
  // WHT amounts
  whtWithheld       Decimal
  // Filing details
  filedDate         DateTime?
  referenceNumber   String?        // URA reference
  paymentDueDate    DateTime?
  returnData        Json           // Full return details
}
```

### Enhanced Existing Models

#### Invoice Model
```prisma
model Invoice {
  // ... existing fields
  efrisFDN          String?       // EFRIS Fiscal Document Number
  efrisQRCode       String?       // EFRIS QR Code
  whtApplicable     Boolean       // WHT on this invoice?
  whtAmount         Decimal
  whtRate           Decimal
}
```

#### InvoiceItem Model
```prisma
model InvoiceItem {
  // ... existing fields
  taxRateId         String?       // Link to TaxRate
  taxCategory       String?       // "VAT_STANDARD_18", "VAT_ZERO_RATED"
}
```

#### Bill Model
```prisma
model Bill {
  // ... existing fields
  whtApplicable     Boolean
  whtAmount         Decimal
  whtRate           Decimal
  whtCertificateNo  String?       // WHT certificate issued
  efrisReceiptNo    String?       // For input tax credit
}
```

#### BillItem Model
```prisma
model BillItem {
  // ... existing fields
  taxRateId         String?       // Link to TaxRate
  taxCategory       String?       // "VAT_STANDARD_18"
  claimInputTax     Boolean       // Can claim ITC?
}
```

#### Transaction Model
```prisma
model Transaction {
  // ... existing fields
  taxCategory       String?       // Tax category tag
  taxAmount         Decimal?
  taxReturnId       String?       // Link to filed return
}
```

## API Endpoints

### 1. Initialize Compliance Pack
```
POST /api/[orgSlug]/tax/compliance-pack
Authorization: Bearer <token>

Request:
{
  "compliancePack": "UG_URA"  // or "KE_KRA", "US_GAAP", "DEFAULT"
}

Response:
{
  "success": true,
  "data": {
    "message": "Uganda URA compliance pack initialized successfully",
    "vatRates": 3,
    "whtRules": 5
  }
}
```

**What it does:**
- Sets organization's `homeCountry` to "UG"
- Sets `compliancePack` to "UG_URA"
- Creates 3 VAT rates (18% standard, 0% zero-rated, exempt)
- Creates 5 WHT rules (professional services, rent, management, interest, contractors)

### 2. Get Compliance Pack Settings
```
GET /api/[orgSlug]/tax/compliance-pack
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Uganda Ltd",
    "homeCountry": "UG",
    "compliancePack": "UG_URA",
    "baseCurrency": "UGX",
    "taxRates": [
      {
        "id": "rate_1",
        "name": "Standard VAT",
        "rate": 18.00,
        "taxCode": "T-18",
        "requiresEFRIS": true
      },
      // ... more rates
    ],
    "whtRules": [
      {
        "id": "wht_1",
        "name": "Professional Services WHT",
        "rate": 6.00,
        "threshold": 1000000
      },
      // ... more rules
    ]
  }
}
```

### 3. Calculate WHT
```
POST /api/[orgSlug]/tax/calculate-wht
Authorization: Bearer <token>

Request:
{
  "grossAmount": 5000000,
  "whtType": "PROFESSIONAL_SERVICES",
  "vendorId": "vendor_123",
  "description": "Consultancy services"
}

Response:
{
  "success": true,
  "data": {
    "grossAmount": 5000000,
    "whtAmount": 300000,      // 6% of 5M = 300K
    "netAmount": 4700000,     // 5M - 300K
    "whtApplicable": true,    // Above threshold
    "whtRule": {
      "id": "wht_1",
      "name": "Professional Services WHT",
      "rate": 6.00,
      "threshold": 1000000
    }
  }
}
```

### 4. Generate Monthly VAT Return
```
POST /api/[orgSlug]/tax/vat-return
Authorization: Bearer <token>

Request:
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}

Response:
{
  "success": true,
  "taxReturnId": "return_123",
  "data": {
    "period": "2025-12",
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z",
    
    // Output VAT (Sales)
    "standardRateSales": 50000000,    // UGX 50M in sales
    "standardRateVAT": 9000000,       // 18% = UGX 9M
    "zeroRatedSales": 10000000,       // UGX 10M exports
    "exemptSales": 5000000,           // UGX 5M exempt
    "totalOutputVAT": 9000000,
    
    // Input VAT (Purchases)
    "standardRatePurchases": 30000000,  // UGX 30M purchases
    "standardRateInputVAT": 5400000,    // 18% = UGX 5.4M
    "claimableInputVAT": 4000000,       // UGX 4M with EFRIS receipts
    "nonClaimableInputVAT": 1400000,    // UGX 1.4M without EFRIS
    "totalInputVAT": 4000000,
    
    // Net Position
    "netVAT": 5000000,                  // UGX 5M payable to URA
    
    // Transaction counts
    "salesInvoiceCount": 45,
    "purchaseBillCount": 30,
    
    // Detailed transactions (for audit)
    "salesTransactions": [ /* ... */ ],
    "purchaseTransactions": [ /* ... */ ]
  }
}
```

### 5. Get Saved VAT Returns
```
GET /api/[orgSlug]/tax/vat-return?period=2025-12
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "return_123",
    "returnType": "VAT_MONTHLY",
    "taxPeriod": "2025-12",
    "status": "DRAFT",
    "netVAT": 5000000,
    "paymentDueDate": "2026-01-15T00:00:00.000Z",
    "returnData": { /* full VAT return data */ }
  }
}
```

### 6. Generate Monthly WHT Return
```
POST /api/[orgSlug]/tax/wht-return
Authorization: Bearer <token>

Request:
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}

Response:
{
  "success": true,
  "taxReturnId": "return_124",
  "data": {
    "period": "2025-12",
    "totalWHTWithheld": 800000,  // UGX 800K total WHT
    
    "whtByType": [
      {
        "whtType": "PROFESSIONAL_SERVICES",
        "description": "Professional Services WHT - 6%",
        "grossAmount": 10000000,
        "whtAmount": 600000,
        "transactionCount": 5
      },
      {
        "whtType": "RENT",
        "description": "Rent WHT - 6%",
        "grossAmount": 3000000,
        "whtAmount": 180000,
        "transactionCount": 2
      }
    ],
    
    "whtTransactions": [
      {
        "date": "2025-12-05T00:00:00.000Z",
        "vendor": "ABC Consultants",
        "description": "Consultancy services",
        "grossAmount": 5000000,
        "whtRate": 6.00,
        "whtAmount": 300000,
        "certificateNo": "WHT-2025-001"
      },
      // ... more transactions
    ]
  }
}
```

## Usage Workflows

### Workflow 1: Activate Uganda URA Compliance

```bash
# 1. Initialize compliance pack
POST /api/acme-uganda/tax/compliance-pack
{
  "compliancePack": "UG_URA"
}

# System automatically:
# - Sets homeCountry = "UG"
# - Creates VAT rates (18%, 0%, exempt)
# - Creates WHT rules (6%, 15%, etc.)
# - Sets baseCurrency = "UGX"
```

### Workflow 2: Create Invoice with VAT

```bash
# When creating invoice, select tax rate
POST /api/acme-uganda/invoices
{
  "customerId": "cust_123",
  "invoiceDate": "2025-12-15",
  "items": [
    {
      "description": "Web Development Services",
      "quantity": 1,
      "unitPrice": 10000000,
      "taxRateId": "rate_standard_vat",  # 18% VAT
      "taxCategory": "VAT_STANDARD_18"
    }
  ]
}

# System automatically:
# - Calculates VAT: 10M * 18% = 1.8M
# - Total: 11.8M
# - Tags transaction with "VAT_STANDARD_18"
# - Links to EFRIS for e-invoicing
```

### Workflow 3: Create Bill with WHT

```bash
# When creating bill for services
POST /api/acme-uganda/bills
{
  "vendorId": "vendor_123",
  "billDate": "2025-12-20",
  "items": [
    {
      "description": "Legal Services",
      "quantity": 1,
      "unitPrice": 5000000,
      "taxRateId": "rate_standard_vat",
      "taxCategory": "VAT_STANDARD_18"
    }
  ],
  "whtApplicable": true,
  "whtRate": 6.00
}

# System automatically:
# - Calculates WHT: 5M * 6% = 300K
# - Net payment to vendor: 4.7M
# - Creates WHTTransaction record
# - Withholds 300K for URA remittance
```

### Workflow 4: Generate Monthly Tax Returns

```bash
# At month end (e.g., December 31, 2025)

# 1. Generate VAT Return
POST /api/acme-uganda/tax/vat-return
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}
# Returns: VAT 03 form with all sales, purchases, ITC claims

# 2. Generate WHT Return
POST /api/acme-uganda/tax/wht-return
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}
# Returns: WHT summary by type with all withholdings

# 3. File returns with URA by January 15, 2026
# Returns are saved as DRAFT, can be marked FILED after submission
```

### Workflow 5: Input Tax Credit Validation

```bash
# When recording purchase bill
POST /api/acme-uganda/bills
{
  "vendorId": "vendor_456",
  "items": [{
    "description": "Office Supplies",
    "unitPrice": 2000000,
    "taxRateId": "rate_standard_vat",
    "taxCategory": "VAT_STANDARD_18",
    "claimInputTax": true
  }],
  "efrisReceiptNo": "EFRIS-202512-9876"  # Required for ITC!
}

# If efrisReceiptNo is missing:
# - claimableInputVAT = 0
# - nonClaimableInputVAT = full amount
# - Warning shown to user

# If efrisReceiptNo is present:
# - claimableInputVAT = full amount
# - Can offset against output VAT
```

## Calculator Functions

The system provides server-side calculation functions:

### 1. Calculate Uganda VAT
```typescript
import { calculateUgandaVAT } from '@/lib/tax/uganda-ura-compliance';

const result = calculateUgandaVAT(10000000, 'STANDARD');
// {
//   netAmount: 10000000,
//   vatAmount: 1800000,    // 18%
//   grossAmount: 11800000
// }
```

### 2. Calculate Uganda WHT
```typescript
import { calculateUgandaWHT } from '@/lib/tax/uganda-ura-compliance';

const result = calculateUgandaWHT(5000000, 'PROFESSIONAL_SERVICES', true);
// {
//   grossAmount: 5000000,
//   whtAmount: 300000,     // 6%
//   netAmount: 4700000,
//   whtApplicable: true    // Above threshold
// }
```

### 3. Calculate Uganda PAYE
```typescript
import { calculateUgandaPAYE } from '@/lib/tax/uganda-ura-compliance';

const result = calculateUgandaPAYE(1000000);  // UGX 1M monthly salary
// {
//   grossSalary: 1000000,
//   paye: 127000,
//   netSalary: 873000,
//   breakdown: [
//     { bracket: "0-235K", amount: 235000, rate: 0, tax: 0 },
//     { bracket: "235K-335K", amount: 100000, rate: 10, tax: 10000 },
//     { bracket: "335K-410K", amount: 75000, rate: 20, tax: 15000 },
//     { bracket: "410K-10M", amount: 590000, rate: 30, tax: 177000 }
//   ]
// }
```

## Filing Deadlines (Uganda)

| Tax Type | Filing Period | Due Date | Payment Date |
|----------|---------------|----------|--------------|
| VAT | Monthly | 15th of following month | Same as filing |
| WHT | Monthly | 15th of following month | Same as filing |
| PAYE | Monthly | 15th of following month | Same as filing |
| Income Tax (Provisional) | Quarterly | 15th after quarter end | Same as filing |
| Income Tax (Annual) | Annual | March 31 (companies) | Same as filing |

## Tax Categories

### Uganda VAT Categories
- `VAT_STANDARD_18`: Standard rate supplies (18%)
- `VAT_ZERO_RATED`: Zero-rated supplies (exports, basic goods)
- `VAT_EXEMPT`: Exempt supplies (financial services, education)

### Uganda WHT Categories
- `WHT_PROFESSIONAL_6`: Professional services (6%)
- `WHT_RENT_6`: Commercial rent (6%)
- `WHT_MANAGEMENT_15`: Management fees (15%)
- `WHT_INTEREST_15`: Interest payments (15%)
- `WHT_DIVIDENDS_15`: Dividends (15%)
- `WHT_ROYALTIES_15`: Royalties (15%)
- `WHT_COMMISSION_10`: Commission (10%)
- `WHT_CONTRACTORS_6`: Contractor payments (6%)

## Migration Guide

To enable tax compliance on existing installation:

```bash
# 1. Update schema
cd d:\YourBooks
npx prisma migrate dev --name add-tax-compliance

# 2. Generate Prisma client
npx prisma generate

# 3. For each organization, initialize compliance pack
# Using the API endpoint or directly:
npm run prisma:studio
# Then manually or via API:
POST /api/[orgSlug]/tax/compliance-pack
{ "compliancePack": "UG_URA" }
```

## Integration with EFRIS

The tax compliance system works seamlessly with EFRIS integration:

1. **Invoice Creation**: 
   - YourBooks calculates VAT
   - Sends invoice to EFRIS
   - EFRIS returns FDN (Fiscal Document Number) and QR code
   - Stored in invoice record

2. **Bill Processing**:
   - Vendor provides EFRIS receipt number
   - YourBooks validates receipt
   - If valid, allows input tax credit claim
   - If missing, flags as non-claimable

3. **Tax Returns**:
   - VAT return only includes EFRIS-validated transactions
   - WHT certificates reference EFRIS numbers
   - Full audit trail for URA

## Benefits

1. **Compliance**: Automatic adherence to Uganda URA tax laws
2. **Accuracy**: Eliminates manual tax calculations
3. **Efficiency**: One-click tax return generation
4. **Auditability**: Every transaction tagged with tax category
5. **Integration**: Works with EFRIS e-invoicing
6. **Scalability**: Easy to add more countries
7. **Transparency**: Clear breakdown of VAT, WHT, PAYE

## Future Enhancements

1. **Kenya KRA Compliance Pack**
2. **Tanzania TRA Compliance Pack**
3. **Rwanda RRA Compliance Pack**
4. **Multi-currency tax handling**
5. **Advanced PAYE with allowances/deductions**
6. **Electronic filing integration with URA portal**
7. **Tax calendar with automatic reminders**
8. **Tax analytics and forecasting**

## Support

For issues or questions:
- Documentation: `/docs/TAX_COMPLIANCE.md`
- API Reference: `/docs/API_ENDPOINTS.md`
- EFRIS Integration: `/docs/EFRIS_INTEGRATION.md`
