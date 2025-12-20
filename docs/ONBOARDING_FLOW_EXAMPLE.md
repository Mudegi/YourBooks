# Complete Onboarding Flow - Country Selection Example

## Scenario: Setting Up a New Organization in Uganda

### Step 1: Get Available Countries

**Request:**
```bash
GET /api/onboarding/countries
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "UG",
      "name": "Uganda",
      "currency": "UGX",
      "compliancePack": "UG_URA",
      "features": [
        "VAT (18% standard, 0% zero-rated, exempt)",
        "WHT (6-15% on various services)",
        "PAYE (Progressive income tax)",
        "EFRIS e-Invoicing integration",
        "Input Tax Credit validation",
        "One-click monthly tax returns"
      ],
      "taxTypes": ["VAT", "WHT", "PAYE"],
      "fullyImplemented": true,    ← ✅ Ready to use
      "recommended": true           ← ✅ Highlighted
    },
    {
      "code": "KE",
      "name": "Kenya",
      "currency": "KES",
      "compliancePack": "KE_KRA",
      "features": [
        "VAT (16% standard)",
        "WHT on various payments",
        "iTax integration (planned)"
      ],
      "taxTypes": ["VAT", "WHT", "PAYE"],
      "fullyImplemented": false,   ← ⏳ Coming soon
      "recommended": false
    },
    {
      "code": "US",
      "name": "United States",
      "currency": "USD",
      "compliancePack": "US_GAAP",
      "features": [
        "State-level sales tax",
        "Form 1099 reporting"
      ],
      "taxTypes": ["SALES_TAX", "INCOME_TAX"],
      "fullyImplemented": false,
      "recommended": false
    }
  ]
}
```

### Step 2: Create Organization (Select Uganda)

**Request:**
```bash
POST /api/onboarding/setup
Content-Type: application/json

{
  "organizationName": "Kampala Coffee Traders Ltd",
  "organizationSlug": "kampala-coffee",
  "homeCountry": "UG",                          ← User selects Uganda
  "legalName": "Kampala Coffee Traders Limited",
  "taxIdNumber": "1000234567",                  ← URA TIN
  "tradingLicense": "BL-2025-0456",             ← Trading license
  "address": "Plot 45, Kampala Road, Kampala",
  "phone": "+256700234567",
  "email": "info@kampalacoffee.co.ug"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org_ug_12345",
      "name": "Kampala Coffee Traders Ltd",
      "slug": "kampala-coffee",
      "homeCountry": "UG",           ← Set to Uganda
      "compliancePack": "UG_URA",    ← Uganda pack activated
      "baseCurrency": "UGX"          ← Currency set to Ugandan Shilling
    },
    "compliancePack": {
      "name": "Uganda",
      "pack": "UG_URA",
      "features": [
        "VAT (18% standard, 0% zero-rated, exempt)",
        "WHT (6-15% on various services)",
        "PAYE (Progressive income tax)",
        "EFRIS e-Invoicing integration",
        "Input Tax Credit validation",
        "One-click monthly tax returns"
      ],
      "initialized": true,           ← ✅ All tax rates created
      "message": "Uganda URA compliance pack initialized successfully"
    }
  }
}
```

**What Happened Automatically:**
1. ✅ Organization created with `homeCountry = "UG"`
2. ✅ `compliancePack = "UG_URA"` set
3. ✅ `baseCurrency = "UGX"` set
4. ✅ **3 VAT rates created:**
   - Standard VAT (18%)
   - Zero-rated VAT (0%)
   - Exempt VAT (0%)
5. ✅ **5 WHT rules created:**
   - Professional Services (6%)
   - Rent (6%)
   - Management Fees (15%)
   - Interest (15%)
   - Contractors (6%)
6. ✅ Uganda features now visible in UI
7. ✅ Uganda API endpoints now functional

### Step 3: Verify Compliance Pack Setup

**Request:**
```bash
GET /api/kampala-coffee/tax/compliance-pack
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "org_ug_12345",
    "name": "Kampala Coffee Traders Ltd",
    "homeCountry": "UG",
    "compliancePack": "UG_URA",
    "baseCurrency": "UGX",
    
    "taxRates": [
      {
        "id": "rate_ug_standard",
        "name": "Standard VAT",
        "rate": 18.00,
        "taxCode": "T-18",
        "isDefault": true,
        "requiresEFRIS": true    ← Input tax needs EFRIS receipt
      },
      {
        "id": "rate_ug_zero",
        "name": "Zero-rated VAT",
        "rate": 0.00,
        "taxCode": "T-0",
        "isDefault": false,
        "requiresEFRIS": true
      },
      {
        "id": "rate_ug_exempt",
        "name": "Exempt VAT",
        "rate": 0.00,
        "taxCode": "EXEMPT",
        "isDefault": false,
        "requiresEFRIS": false   ← Cannot claim input tax
      }
    ],
    
    "whtRules": [
      {
        "id": "wht_ug_professional",
        "name": "Professional Services WHT",
        "whtType": "PROFESSIONAL_SERVICES",
        "rate": 6.00,
        "threshold": 1000000     ← UGX 1M threshold
      },
      {
        "id": "wht_ug_rent",
        "name": "Rent WHT",
        "whtType": "RENT",
        "rate": 6.00,
        "threshold": 500000      ← UGX 500K threshold
      },
      {
        "id": "wht_ug_management",
        "name": "Management Fees WHT",
        "whtType": "MANAGEMENT_FEES",
        "rate": 15.00,
        "threshold": 0
      }
      // ... more WHT rules
    ]
  }
}
```

### Step 4: Create Invoice with Uganda VAT

**Request:**
```bash
POST /api/kampala-coffee/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "cust_123",
  "invoiceDate": "2025-12-19",
  "dueDate": "2026-01-18",
  "items": [
    {
      "description": "Coffee Export - 1000kg Arabica",
      "quantity": 1000,
      "unitPrice": 15000,          ← UGX 15,000 per kg
      "taxRateId": "rate_ug_zero", ← 0% (export)
      "taxCategory": "VAT_ZERO_RATED"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv_ug_001",
    "invoiceNumber": "INV-2025-0001",
    "subtotal": 15000000,          ← UGX 15M
    "taxAmount": 0,                ← 0% VAT on export
    "total": 15000000,
    "efrisFDN": "EFRIS-FDN-2025-001", ← Submitted to URA
    "efrisQRCode": "https://efris.ura.go.ug/qr/...",
    "items": [
      {
        "description": "Coffee Export - 1000kg Arabica",
        "quantity": 1000,
        "unitPrice": 15000,
        "taxCategory": "VAT_ZERO_RATED", ← Tagged for tax return
        "taxRate": 0.00,
        "taxAmount": 0,
        "total": 15000000
      }
    ]
  }
}
```

### Step 5: Create Bill with WHT (Professional Services)

**Request:**
```bash
POST /api/kampala-coffee/bills
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendorId": "vendor_456",
  "billDate": "2025-12-19",
  "dueDate": "2026-01-18",
  "items": [
    {
      "description": "Legal Services - Contract Review",
      "quantity": 1,
      "unitPrice": 5000000,           ← UGX 5M
      "taxRateId": "rate_ug_standard",
      "taxCategory": "VAT_STANDARD_18"
    }
  ],
  "whtApplicable": true,              ← WHT applies
  "efrisReceiptNo": "EFRIS-RCPT-2025-123" ← For input tax credit
}
```

**System Calculates:**
```javascript
Gross Amount:    UGX 5,000,000
VAT (18%):       UGX   900,000
Total with VAT:  UGX 5,900,000
WHT (6%):        UGX   300,000  ← Withheld
Net Payment:     UGX 5,600,000  ← Pay to vendor
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bill_ug_001",
    "billNumber": "BILL-2025-0001",
    "subtotal": 5000000,
    "taxAmount": 900000,         ← VAT
    "total": 5900000,
    "whtApplicable": true,
    "whtAmount": 300000,         ← WHT withheld
    "whtRate": 6.00,
    "netPayment": 5600000,       ← Actual payment to vendor
    "efrisReceiptNo": "EFRIS-RCPT-2025-123", ← Can claim input tax
    "items": [
      {
        "description": "Legal Services - Contract Review",
        "taxCategory": "VAT_STANDARD_18",
        "claimInputTax": true    ← ✅ EFRIS receipt present
      }
    ]
  }
}
```

### Step 6: Generate Monthly VAT Return

**Request:**
```bash
POST /api/kampala-coffee/tax/vat-return
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}
```

**Response:**
```json
{
  "success": true,
  "taxReturnId": "return_vat_dec_2025",
  "data": {
    "period": "2025-12",
    
    "outputVAT": {
      "standardRateSales": 0,        ← No standard sales
      "standardRateVAT": 0,
      "zeroRatedSales": 15000000,    ← UGX 15M exports
      "exemptSales": 0,
      "totalOutputVAT": 0            ← 0% on exports
    },
    
    "inputVAT": {
      "standardRatePurchases": 5000000,
      "standardRateInputVAT": 900000,
      "claimableInputVAT": 900000,   ← ✅ Has EFRIS receipt
      "nonClaimableInputVAT": 0,
      "totalInputVAT": 900000
    },
    
    "netVAT": -900000,               ← Refund from URA
    "position": "REFUNDABLE",
    
    "salesInvoiceCount": 1,
    "purchaseBillCount": 1,
    
    "dueDate": "2026-01-15"          ← File by 15th of next month
  }
}
```

### Step 7: Generate Monthly WHT Return

**Request:**
```bash
POST /api/kampala-coffee/tax/wht-return
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "saveToDB": true
}
```

**Response:**
```json
{
  "success": true,
  "taxReturnId": "return_wht_dec_2025",
  "data": {
    "period": "2025-12",
    "totalWHTWithheld": 300000,    ← UGX 300K to remit to URA
    
    "whtByType": [
      {
        "whtType": "PROFESSIONAL_SERVICES",
        "description": "Professional Services WHT - 6%",
        "grossAmount": 5000000,
        "whtAmount": 300000,
        "transactionCount": 1
      }
    ],
    
    "whtTransactions": [
      {
        "date": "2025-12-19",
        "vendor": "ABC Legal Services",
        "description": "Legal Services - Contract Review",
        "grossAmount": 5000000,
        "whtRate": 6.00,
        "whtAmount": 300000,
        "certificateNo": "WHT-CERT-2025-001"
      }
    ],
    
    "dueDate": "2026-01-15"
  }
}
```

## Comparison: If Kenya Was Selected Instead

### Step 2 Alternative: Create Kenya Organization

**Request:**
```bash
POST /api/onboarding/setup
{
  "organizationName": "Nairobi Trading Co",
  "organizationSlug": "nairobi-trading",
  "homeCountry": "KE",              ← Select Kenya
  "taxIdNumber": "A001234567P"      ← KRA PIN
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "homeCountry": "KE",
      "compliancePack": "KE_KRA",
      "baseCurrency": "KES"
    },
    "compliancePack": {
      "name": "Kenya",
      "pack": "KE_KRA",
      "features": [],
      "initialized": false,
      "message": "Kenya KRA compliance pack not yet implemented. Using default tax handling."
    }
  }
}
```

**What Happens:**
- ✅ Organization created
- ❌ No automatic tax rates created
- ❌ No WHT rules created
- ❌ Uganda features NOT available
- ✅ Manual tax configuration available

### Attempt Uganda Features (Will Fail)

**Request:**
```bash
POST /api/nairobi-trading/tax/vat-return
Authorization: Bearer {token}
```

**Response:**
```json
{
  "error": "VAT Return only available for organizations with Uganda (UG) selected as home country",
  "status": 400
}
```

## Summary

✅ **Uganda Selected** → Full URA features activated  
❌ **Kenya Selected** → Uganda features blocked  
⚙️ **Other Countries** → Manual tax configuration  

The system is **100% country-conditional** - Uganda tax features only work when Uganda is selected during onboarding.
