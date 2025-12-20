# Fixed Assets Management Module

## Overview

Comprehensive fixed assets management system with depreciation calculation, disposal tracking, maintenance history, and Uganda tax compliance. Supports multiple depreciation methods and automatic GL posting.

## Features

### 1. Asset Register
- **Asset Tracking**: Complete asset lifecycle from purchase to disposal
- **Auto-Numbering**: ASSET-YYYY-0001 format
- **Categories**: Organize assets by category (Vehicles, Computers, Buildings, etc.)
- **Branch Assignment**: Track which branch owns each asset
- **Insurance & Warranty**: Track policies and expiry dates
- **Location Tracking**: Physical location, serial number, model, manufacturer

### 2. Depreciation Methods
- **Straight-Line**: (Cost - Salvage) / Life
- **Declining Balance**: BookValue × Rate
- **Double Declining Balance**: BookValue × (2 / Life)
- **Sum of Years' Digits**: Weighted by remaining life
- **Units of Production**: Per-unit depreciation

### 3. Uganda Tax Depreciation
Integrated URA-compliant tax depreciation rates:
- **Computers & Electronics**: 40% per year
- **Motor Vehicles**: 25% per year
- **Plant & Machinery**: 30% per year
- **Furniture & Fittings**: 20% per year
- **Commercial Buildings**: 10% per year
- **Industrial Buildings**: 5% per year

Tracks both **book depreciation** (accounting) and **tax depreciation** (URA) separately.

### 4. Asset Disposal
- **Disposal Methods**: Sale, Trade-in, Scrap, Donation, Lost, Write-off
- **Gain/Loss Calculation**: Sale Price - Book Value
- **Auto GL Posting**: Creates disposal journal entries:
  - Dr. Cash/Receivable (disposal price)
  - Dr. Accumulated Depreciation (accumulated)
  - Dr/Cr. Gain/Loss on Disposal (difference)
  - Cr. Asset (original cost)
- **Uganda Compliance**: Buyer TIN tracking, invoice number

### 5. Maintenance Tracking
- **Service History**: Track all maintenance and repairs
- **Cost Tracking**: Maintenance costs per asset
- **Scheduled Maintenance**: Set next maintenance date/mileage
- **Vendor Tracking**: Who performed the service
- **Status Management**: Scheduled, In Progress, Completed, Overdue

### 6. Depreciation Schedule
- **Full Lifecycle**: Generate schedule for entire asset life
- **Period Tracking**: Monthly depreciation calculation
- **GL Integration**: Auto-post to journal entries:
  - Dr. Depreciation Expense
  - Cr. Accumulated Depreciation
- **Batch Processing**: Monthly run for all active assets

## Database Schema

### Models

#### 1. AssetCategory
```prisma
model AssetCategory {
  id                    String
  organizationId        String
  name                  String              // "Vehicles"
  code                  String              // "VEH"
  assetAccountId        String              // GL: Asset account
  depreciationAccountId String              // GL: Accumulated Depreciation
  expenseAccountId      String              // GL: Depreciation Expense
  defaultMethod         DepreciationMethod  // Default method
  defaultLifeYears      Int                 // Default useful life
  defaultSalvagePercent Decimal             // Default salvage %
  ugandaTaxRate         Decimal?            // URA tax rate
  assets                Asset[]
}
```

#### 2. Asset
```prisma
model Asset {
  id                    String
  assetNumber           String              // AUTO: ASSET-2025-0001
  name                  String
  categoryId            String
  branchId              String?
  // Purchase
  purchaseDate          DateTime
  purchasePrice         Decimal
  vendor                String?
  invoiceNumber         String?
  // Depreciation
  depreciationMethod    DepreciationMethod
  usefulLifeYears       Int
  salvageValue          Decimal
  depreciationStartDate DateTime
  // Current values
  currentBookValue      Decimal
  accumulatedDepreciation Decimal
  // Status
  status                AssetStatus
  // Relations
  depreciationSchedule  AssetDepreciation[]
  maintenanceRecords    AssetMaintenance[]
  disposalRecord        AssetDisposal?
}
```

#### 3. AssetDepreciation
```prisma
model AssetDepreciation {
  id                    String
  assetId               String
  period                String              // "2025-12"
  periodStartDate       DateTime
  periodEndDate         DateTime
  depreciationMethod    DepreciationMethod
  openingBookValue      Decimal
  depreciationAmount    Decimal
  accumulatedDepreciation Decimal
  closingBookValue      Decimal
  // Uganda tax
  taxDepreciationAmount Decimal?
  taxBookValue          Decimal?
  // GL posting
  posted                Boolean
  transactionId         String?
  postedDate            DateTime?
}
```

#### 4. AssetDisposal
```prisma
model AssetDisposal {
  id                  String
  assetId             String @unique
  disposalDate        DateTime
  disposalMethod      DisposalMethod
  disposalPrice       Decimal
  // Book values
  costAtDisposal      Decimal
  accDepAtDisposal    Decimal
  bookValueAtDisposal Decimal
  // Gain/Loss
  gainLoss            Decimal
  gainLossType        String              // "GAIN" or "LOSS"
  // Buyer (Uganda)
  buyer               String?
  buyerTIN            String?
  disposalInvoiceNo   String?
  // Posting
  posted              Boolean
  transactionId       String?
}
```

#### 5. AssetMaintenance
```prisma
model AssetMaintenance {
  id                  String
  assetId             String
  maintenanceType     MaintenanceType
  maintenanceDate     DateTime
  description         String
  vendor              String?
  cost                Decimal
  status              MaintenanceStatus
  // Scheduling
  nextMaintenanceDate DateTime?
  nextMaintenanceMiles Int?
}
```

## API Endpoints

### Asset Management

#### Create Asset
```
POST /api/[orgSlug]/assets
```
**Body:**
```json
{
  "categoryId": "cat_123",
  "branchId": "branch_123",
  "name": "Toyota Land Cruiser",
  "description": "Company vehicle",
  "purchaseDate": "2025-01-15",
  "purchasePrice": 50000000,
  "vendor": "Toyota Uganda",
  "invoiceNumber": "INV-2025-001",
  "depreciationMethod": "DECLINING_BALANCE",
  "usefulLifeYears": 5,
  "salvageValue": 5000000,
  "location": "Kampala Office",
  "serialNumber": "VIN12345",
  "model": "Land Cruiser V8",
  "manufacturer": "Toyota"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asset": {
      "id": "asset_123",
      "assetNumber": "ASSET-2025-0001",
      "name": "Toyota Land Cruiser",
      "currentBookValue": 50000000,
      "accumulatedDepreciation": 0
    },
    "schedule": [] // First 12 months
  }
}
```

#### List Assets
```
GET /api/[orgSlug]/assets?status=ACTIVE&categoryId=cat_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [],
    "summary": {
      "totalAssets": 25,
      "totalCost": 250000000,
      "totalBookValue": 180000000,
      "totalDepreciation": 70000000
    }
  }
}
```

#### Get Asset Details
```
GET /api/[orgSlug]/assets/[id]
```

#### Update Asset
```
PATCH /api/[orgSlug]/assets/[id]
```

#### Delete Asset
```
DELETE /api/[orgSlug]/assets/[id]
```
*Note: Cannot delete assets with posted depreciation*

### Depreciation

#### Calculate Depreciation Schedule
```
POST /api/[orgSlug]/assets/[id]/depreciation
```
**Body:**
```json
{
  "action": "calculate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "period": "2025-01",
        "depreciationAmount": 1041667,
        "taxDepreciationAmount": 1041667,
        "closingBookValue": 48958333
      }
    ],
    "summary": {
      "totalPeriods": 60,
      "totalDepreciation": 45000000
    }
  }
}
```

#### Post Depreciation to GL
```
POST /api/[orgSlug]/assets/[id]/depreciation
```
**Body:**
```json
{
  "action": "post",
  "periodIds": ["dep_123", "dep_124"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posted": [
      {
        "depreciation": {
          "id": "dep_123",
          "period": "2025-01",
          "depreciationAmount": 1041667
        },
        "transaction": {
          "id": "txn_123",
          "transactionNumber": "DEP-2025-0001"
        }
      }
    ],
    "summary": {
      "totalPosted": 2,
      "totalAmount": 2083334
    }
  }
}
```

#### Run Monthly Depreciation Batch
```
POST /api/[orgSlug]/depreciation/run-monthly
```
**Body:**
```json
{
  "year": 2025,
  "month": 1,
  "autoPost": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 25,
    "posted": 25,
    "errors": [],
    "totalDepreciation": 15000000,
    "summary": {
      "activeAssets": 25,
      "posted": 25,
      "failed": 0
    }
  }
}
```

### Asset Disposal

#### Record Disposal
```
POST /api/[orgSlug]/assets/[id]/dispose
```
**Body:**
```json
{
  "disposalDate": "2025-12-31",
  "disposalMethod": "SALE",
  "disposalPrice": 45000000,
  "buyer": "ABC Company",
  "buyerTIN": "1000123456",
  "disposalInvoiceNo": "INV-DISP-001",
  "reason": "Fleet upgrade",
  "autoPost": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "disposal": {
      "id": "disp_123",
      "gainLoss": 5000000,
      "gainLossType": "GAIN"
    },
    "transaction": {
      "id": "txn_456",
      "transactionNumber": "DSP-2025-0001"
    },
    "summary": {
      "originalCost": 50000000,
      "accumulatedDepreciation": 10000000,
      "bookValue": 40000000,
      "disposalPrice": 45000000,
      "gainLoss": 5000000,
      "posted": true
    }
  }
}
```

### Maintenance

#### Create Maintenance Record
```
POST /api/[orgSlug]/assets/[id]/maintenance
```
**Body:**
```json
{
  "maintenanceType": "ROUTINE",
  "maintenanceDate": "2025-01-20",
  "description": "Oil change and tire rotation",
  "vendor": "Toyota Service Center",
  "cost": 500000,
  "status": "COMPLETED",
  "completionDate": "2025-01-20",
  "meterReading": 50000,
  "nextMaintenanceDate": "2025-04-20",
  "nextMaintenanceMiles": 55000
}
```

#### List Maintenance Records
```
GET /api/[orgSlug]/assets/[id]/maintenance?status=COMPLETED
```

**Response:**
```json
{
  "success": true,
  "data": {
    "maintenanceRecords": [],
    "summary": {
      "totalRecords": 8,
      "totalCost": 4500000,
      "completedCount": 7,
      "scheduledCount": 1
    }
  }
}
```

### Asset Categories

#### Create Category
```
POST /api/[orgSlug]/asset-categories
```
**Body:**
```json
{
  "name": "Motor Vehicles",
  "code": "VEH",
  "description": "Company vehicles",
  "assetAccountId": "acc_asset",
  "depreciationAccountId": "acc_dep",
  "expenseAccountId": "acc_exp",
  "defaultMethod": "DECLINING_BALANCE",
  "defaultLifeYears": 5,
  "defaultSalvagePercent": 10,
  "ugandaTaxRate": 25
}
```

#### List Categories
```
GET /api/[orgSlug]/asset-categories
```

### Reports

#### Asset Register
```
GET /api/[orgSlug]/reports/assets?type=asset-register&status=ACTIVE&asOfDate=2025-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "Asset Register",
    "organization": "ABC Company",
    "asOfDate": "2025-12-31",
    "assetsByCategory": {
      "Motor Vehicles": {
        "assets": [],
        "totalCost": 150000000,
        "totalDepreciation": 37500000,
        "totalBookValue": 112500000
      }
    },
    "grandTotal": {
      "totalAssets": 25,
      "totalCost": 250000000,
      "totalDepreciation": 70000000,
      "totalBookValue": 180000000
    }
  }
}
```

#### Depreciation Schedule
```
GET /api/[orgSlug]/reports/assets?type=depreciation-schedule&startDate=2025-01-01&endDate=2025-12-31
```

#### Asset Summary by Category
```
GET /api/[orgSlug]/reports/assets?type=asset-summary&status=ACTIVE
```

## Usage Examples

### Example 1: Add New Vehicle

```typescript
// 1. Create asset
const asset = await fetch('/api/myorg/assets', {
  method: 'POST',
  body: JSON.stringify({
    categoryId: 'vehicles_cat',
    name: 'Toyota Land Cruiser',
    purchaseDate: '2025-01-15',
    purchasePrice: 50000000,
    depreciationMethod: 'DECLINING_BALANCE',
    usefulLifeYears: 5,
    salvageValue: 5000000,
  })
});

// 2. Generate depreciation schedule
const schedule = await fetch(`/api/myorg/assets/${asset.id}/depreciation`, {
  method: 'POST',
  body: JSON.stringify({ action: 'calculate' })
});

// 3. Review and approve schedule (manually)

// 4. Post first month
const posted = await fetch(`/api/myorg/assets/${asset.id}/depreciation`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'post',
    periodIds: [schedule.data.schedule[0].id]
  })
});
```

### Example 2: Monthly Depreciation Run

```typescript
// Run monthly depreciation for all assets
const result = await fetch('/api/myorg/depreciation/run-monthly', {
  method: 'POST',
  body: JSON.stringify({
    year: 2025,
    month: 1,
    autoPost: true // Auto-post to GL
  })
});

// Result:
// - Calculates depreciation for all ACTIVE assets
// - Creates journal entries (Dr. Expense, Cr. Acc. Depreciation)
// - Updates asset book values
// - Returns summary report
```

### Example 3: Dispose Asset

```typescript
// 1. Record disposal
const disposal = await fetch(`/api/myorg/assets/${assetId}/dispose`, {
  method: 'POST',
  body: JSON.stringify({
    disposalDate: '2025-12-31',
    disposalMethod: 'SALE',
    disposalPrice: 45000000,
    buyer: 'John Doe',
    buyerTIN: '1000123456', // Uganda TIN
    autoPost: true // Create disposal journal entry
  })
});

// Automatic GL entries:
// Dr. Cash 45,000,000
// Dr. Accumulated Depreciation 10,000,000
// Cr. Asset 50,000,000
// Cr. Gain on Disposal 5,000,000
```

### Example 4: Schedule Maintenance

```typescript
// Record completed maintenance
const maintenance = await fetch(`/api/myorg/assets/${assetId}/maintenance`, {
  method: 'POST',
  body: JSON.stringify({
    maintenanceType: 'ROUTINE',
    maintenanceDate: '2025-01-20',
    description: 'Oil change and inspection',
    vendor: 'Toyota Service Center',
    cost: 500000,
    status: 'COMPLETED',
    meterReading: 50000,
    nextMaintenanceDate: '2025-04-20',
    nextMaintenanceMiles: 55000
  })
});
```

## Depreciation Calculation Examples

### Straight-Line
```
Cost: UGX 50,000,000
Salvage: UGX 5,000,000
Life: 5 years

Annual: (50M - 5M) / 5 = 9M per year
Monthly: 9M / 12 = 750,000 per month

Schedule:
Year 1: 9M depreciation → 41M book value
Year 2: 9M depreciation → 32M book value
Year 3: 9M depreciation → 23M book value
Year 4: 9M depreciation → 14M book value
Year 5: 9M depreciation → 5M book value (salvage)
```

### Declining Balance (Uganda 25% for vehicles)
```
Cost: UGX 50,000,000
Rate: 25% (URA rate for vehicles)
Life: 5 years

Year 1: 50M × 25% = 12.5M → 37.5M book value
Year 2: 37.5M × 25% = 9.375M → 28.125M book value
Year 3: 28.125M × 25% = 7.031M → 21.094M book value
Year 4: 21.094M × 25% = 5.273M → 15.821M book value
Year 5: 15.821M × 25% = 3.955M → 11.866M book value
```

### Uganda Tax vs Book Depreciation
```
Vehicle: UGX 50,000,000

Book (Straight-line, 5 years):
Year 1: 9M depreciation

Tax (Declining 25%, Uganda URA):
Year 1: 12.5M depreciation (deductible)

Difference: 3.5M additional tax deduction in Year 1

System tracks both:
- Book value: For financial statements
- Tax value: For URA tax returns
```

## Integration Points

### 1. General Ledger
- **Auto-posting**: Depreciation and disposal entries
- **Account Linking**: Asset, Depreciation, Expense accounts per category
- **Transaction Types**: JOURNAL for depreciation, JOURNAL for disposal

### 2. Tax Compliance (Uganda)
- **URA Rates**: Built-in depreciation rates
- **Tax Returns**: Tax depreciation values for income tax computation
- **Disposal Tracking**: Buyer TIN for VAT/WHT compliance

### 3. Reports
- **Asset Register**: Complete asset listing with book values
- **Depreciation Schedule**: Period-by-period depreciation
- **Summary Reports**: Totals by category
- **Integration**: Feeds into Financial Statements (Balance Sheet, P&L)

## Best Practices

### 1. Asset Setup
- Create categories first with proper GL account mapping
- Set Uganda tax rates on categories for automatic tax depreciation
- Use descriptive names and codes for easy identification
- Always assign branch for multi-location tracking

### 2. Depreciation
- Run monthly depreciation on a schedule (1st of each month)
- Review schedule before posting
- Post to GL immediately after review
- Use batch processing for efficiency

### 3. Disposal
- Always use autoPost=true for automatic GL entries
- Record buyer TIN for Uganda compliance
- Keep disposal documentation for audit trail
- Review gain/loss before finalizing

### 4. Maintenance
- Schedule routine maintenance in advance
- Track all costs for total cost of ownership
- Set next maintenance dates/miles for reminders
- Use scheduled maintenance to prevent breakdowns

### 5. Reporting
- Run Asset Register monthly for management
- Generate Depreciation Schedule for tax planning
- Compare book vs tax depreciation for tax optimization
- Include in monthly financial close process

## Country-Conditional Features (Uganda)

When organization's country = "UG":
- Uganda tax depreciation rates activated
- Tax depreciation tracked separately from book
- Buyer TIN field required on disposals
- URA compliance in tax return reports

When organization's country ≠ "UG":
- Generic depreciation methods only
- Tax depreciation = Book depreciation
- Buyer TIN optional
- Standard disposal accounting

## Future Enhancements

1. **Asset Transfers**: Transfer assets between branches
2. **Bulk Import**: Import assets from CSV/Excel
3. **Revaluation**: Revalue assets (IFRS compliance)
4. **Impairment**: Record impairment losses
5. **Asset Groups**: Group related assets (fleet, IT equipment)
6. **Mobile App**: Mobile asset scanning and tracking
7. **Photos**: Attach photos to assets
8. **QR Codes**: Generate QR codes for physical tagging
9. **Alerts**: Email/SMS for maintenance due, insurance expiry
10. **Analytics**: Asset utilization, ROI, TCO analysis

## Conclusion

The Fixed Assets module provides comprehensive asset lifecycle management with:
- ✅ Complete asset register
- ✅ Multiple depreciation methods
- ✅ Uganda tax compliance
- ✅ Auto GL posting
- ✅ Disposal tracking
- ✅ Maintenance history
- ✅ Comprehensive reporting

This module integrates seamlessly with the existing ERP system's GL, tax compliance, and reporting modules to provide accurate asset accounting and tax optimization.
