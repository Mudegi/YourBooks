# Fixed Assets API Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Fixed Assets Management module using REST API calls.

## Prerequisites
- Organization created and authenticated
- JWT token available in Authorization header
- Asset categories seeded
- GL accounts configured

## 1. Asset Categories

### Create Asset Category
```bash
POST /api/{orgSlug}/asset-categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Motor Vehicles",
  "code": "VEH",
  "description": "Company vehicles including cars and trucks",
  "assetAccountId": "gl_account_id_for_fixed_assets",
  "depreciationAccountId": "gl_account_id_for_accumulated_depreciation",
  "expenseAccountId": "gl_account_id_for_depreciation_expense",
  "defaultMethod": "DECLINING_BALANCE",
  "defaultLifeYears": 5,
  "defaultSalvagePercent": 10,
  "ugandaTaxRate": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cat_xxx",
    "name": "Motor Vehicles",
    "code": "VEH",
    "ugandaTaxRate": 25,
    "assetAccount": { "accountCode": "1600", "accountName": "Fixed Assets" },
    "depreciationAccount": { "accountCode": "1650", "accountName": "Accumulated Depreciation" },
    "expenseAccount": { "accountCode": "6400", "accountName": "Depreciation Expense" }
  }
}
```

### List All Categories
```bash
GET /api/{orgSlug}/asset-categories
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "cat_xxx",
      "name": "Motor Vehicles",
      "code": "VEH",
      "ugandaTaxRate": 25,
      "_count": { "assets": 5 }
    }
  ]
}
```

## 2. Assets Management

### Create New Asset
```bash
POST /api/{orgSlug}/assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "categoryId": "cat_xxx",
  "branchId": "branch_xxx",
  "name": "Toyota Land Cruiser V8",
  "description": "Executive company vehicle",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 150000000,
  "vendor": "Toyota Uganda",
  "invoiceNumber": "TU-2024-0015",
  "depreciationMethod": "DECLINING_BALANCE",
  "usefulLifeYears": 5,
  "salvageValue": 15000000,
  "depreciationStartDate": "2024-02-01",
  "location": "Head Office - Kampala",
  "serialNumber": "VIN123456789",
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
      "id": "asset_xxx",
      "assetNumber": "ASSET-2024-0001",
      "name": "Toyota Land Cruiser V8",
      "purchasePrice": 150000000,
      "currentBookValue": 150000000,
      "accumulatedDepreciation": 0,
      "status": "ACTIVE",
      "category": {
        "name": "Motor Vehicles",
        "ugandaTaxRate": 25
      }
    },
    "schedule": [
      {
        "period": "2024-02",
        "depreciationAmount": 3125000,
        "taxDepreciationAmount": 3125000,
        "closingBookValue": 146875000
      }
    ]
  }
}
```

### List Assets
```bash
GET /api/{orgSlug}/assets?status=ACTIVE&categoryId=cat_xxx
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_xxx",
        "assetNumber": "ASSET-2024-0001",
        "name": "Toyota Land Cruiser V8",
        "purchasePrice": 150000000,
        "currentBookValue": 146875000,
        "accumulatedDepreciation": 3125000,
        "status": "ACTIVE"
      }
    ],
    "summary": {
      "totalAssets": 10,
      "totalCost": 500000000,
      "totalBookValue": 450000000,
      "totalDepreciation": 50000000
    }
  }
}
```

### Get Asset Details
```bash
GET /api/{orgSlug}/assets/{assetId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "asset": {
      "id": "asset_xxx",
      "assetNumber": "ASSET-2024-0001",
      "name": "Toyota Land Cruiser V8",
      "category": { ... },
      "depreciationSchedule": [ ... ],
      "maintenanceRecords": [ ... ]
    },
    "summary": {
      "totalMaintenance": 2500000,
      "maintenanceCount": 3,
      "postedDepreciation": 8,
      "unpostedDepreciation": 4
    }
  }
}
```

### Update Asset
```bash
PATCH /api/{orgSlug}/assets/{assetId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "location": "Branch Office - Jinja",
  "insurancePolicy": "AIG-2024-12345",
  "insuranceExpiry": "2025-12-31",
  "warrantyExpiry": "2026-01-15"
}

Response:
{
  "success": true,
  "data": {
    "id": "asset_xxx",
    "location": "Branch Office - Jinja",
    "insurancePolicy": "AIG-2024-12345"
  }
}
```

## 3. Depreciation

### Calculate Depreciation Schedule
```bash
POST /api/{orgSlug}/assets/{assetId}/depreciation
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "calculate"
}

Response:
{
  "success": true,
  "data": {
    "schedule": [
      {
        "period": "2024-02",
        "periodStartDate": "2024-02-01",
        "periodEndDate": "2024-02-29",
        "depreciationMethod": "DECLINING_BALANCE",
        "openingBookValue": 150000000,
        "depreciationAmount": 3125000,
        "taxDepreciationAmount": 3125000,
        "closingBookValue": 146875000,
        "posted": false
      },
      // ... more periods
    ],
    "summary": {
      "totalPeriods": 60,
      "totalDepreciation": 135000000
    }
  }
}
```

### Post Depreciation to GL
```bash
POST /api/{orgSlug}/assets/{assetId}/depreciation
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "post",
  "periodIds": ["dep_xxx", "dep_yyy"]
}

Response:
{
  "success": true,
  "data": {
    "posted": [
      {
        "depreciation": {
          "period": "2024-02",
          "depreciationAmount": 3125000
        },
        "transaction": {
          "transactionNumber": "JE-2024-0123",
          "entries": [
            {
              "account": "Depreciation Expense",
              "debit": 3125000,
              "credit": 0
            },
            {
              "account": "Accumulated Depreciation",
              "debit": 0,
              "credit": 3125000
            }
          ]
        }
      }
    ],
    "summary": {
      "totalPosted": 2,
      "totalFailed": 0,
      "totalAmount": 6250000
    }
  }
}
```

### Run Monthly Batch Depreciation
```bash
POST /api/{orgSlug}/depreciation/run-monthly
Authorization: Bearer {token}
Content-Type: application/json

{
  "year": 2024,
  "month": 12,
  "autoPost": true
}

Response:
{
  "success": true,
  "data": {
    "processed": 15,
    "posted": 15,
    "failed": 0,
    "totalDepreciation": 45000000,
    "totalTaxDepreciation": 48500000,
    "transactions": [
      {
        "transactionNumber": "JE-2024-1201",
        "amount": 45000000
      }
    ]
  }
}
```

## 4. Asset Disposal

### Dispose Asset (Sale)
```bash
POST /api/{orgSlug}/assets/{assetId}/dispose
Authorization: Bearer {token}
Content-Type: application/json

{
  "disposalDate": "2024-12-15",
  "disposalMethod": "SALE",
  "disposalPrice": 80000000,
  "buyer": "ABC Motors Ltd",
  "buyerTIN": "1234567890",
  "disposalInvoiceNo": "INV-2024-9999",
  "reason": "Upgrading to newer model",
  "autoPost": true
}

Response:
{
  "success": true,
  "data": {
    "disposal": {
      "id": "disp_xxx",
      "disposalDate": "2024-12-15",
      "disposalMethod": "SALE",
      "disposalPrice": 80000000,
      "gainLoss": 5000000,
      "gainLossType": "GAIN",
      "posted": true
    },
    "transaction": {
      "transactionNumber": "DSP-2024-0001",
      "entries": [
        {
          "account": "Cash",
          "debit": 80000000,
          "credit": 0
        },
        {
          "account": "Accumulated Depreciation",
          "debit": 75000000,
          "credit": 0
        },
        {
          "account": "Gain on Disposal",
          "debit": 0,
          "credit": 5000000
        },
        {
          "account": "Fixed Assets",
          "debit": 0,
          "credit": 150000000
        }
      ]
    },
    "summary": {
      "originalCost": 150000000,
      "accumulatedDepreciation": 75000000,
      "bookValue": 75000000,
      "disposalPrice": 80000000,
      "gainLoss": 5000000,
      "gainLossType": "GAIN"
    }
  }
}
```

### Dispose Asset (Scrap/Write-off)
```bash
POST /api/{orgSlug}/assets/{assetId}/dispose

{
  "disposalDate": "2024-12-20",
  "disposalMethod": "SCRAP",
  "disposalPrice": 0,
  "reason": "Beyond economical repair",
  "autoPost": true
}
```

## 5. Maintenance Records

### Create Maintenance Record
```bash
POST /api/{orgSlug}/assets/{assetId}/maintenance
Authorization: Bearer {token}
Content-Type: application/json

{
  "maintenanceType": "ROUTINE",
  "maintenanceDate": "2024-12-10",
  "description": "Routine service - oil change, filters, inspection",
  "vendor": "Toyota Service Center",
  "cost": 850000,
  "isScheduled": true,
  "nextMaintenanceDate": "2025-06-10",
  "nextMaintenanceMiles": 15000,
  "status": "COMPLETED",
  "completionDate": "2024-12-10",
  "meterReading": 45000,
  "performedBy": "John Technician"
}

Response:
{
  "success": true,
  "data": {
    "id": "maint_xxx",
    "maintenanceType": "ROUTINE",
    "maintenanceDate": "2024-12-10",
    "cost": 850000,
    "status": "COMPLETED",
    "nextMaintenanceDate": "2025-06-10"
  }
}
```

### List Maintenance Records
```bash
GET /api/{orgSlug}/assets/{assetId}/maintenance?status=COMPLETED
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "maintenanceRecords": [
      {
        "id": "maint_xxx",
        "maintenanceType": "ROUTINE",
        "maintenanceDate": "2024-12-10",
        "cost": 850000,
        "status": "COMPLETED"
      }
    ],
    "summary": {
      "totalRecords": 5,
      "totalCost": 4250000,
      "completedCount": 4,
      "scheduledCount": 1,
      "overdueCount": 0
    }
  }
}
```

## 6. Reports

### Asset Register Report
```bash
GET /api/{orgSlug}/reports/assets?type=asset-register&status=ACTIVE&asOfDate=2024-12-31
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reportType": "Asset Register",
    "organization": "YourBooks Ltd",
    "asOfDate": "2024-12-31",
    "assetsByCategory": {
      "Motor Vehicles": {
        "category": { ... },
        "assets": [ ... ],
        "totalCost": 350000000,
        "totalDepreciation": 87500000,
        "totalBookValue": 262500000
      },
      "Computers & Electronics": { ... }
    },
    "grandTotal": {
      "totalAssets": 25,
      "totalCost": 850000000,
      "totalDepreciation": 215000000,
      "totalBookValue": 635000000
    }
  }
}
```

### Depreciation Schedule Report
```bash
GET /api/{orgSlug}/reports/assets?type=depreciation-schedule&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reportType": "Depreciation Schedule",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "assets": [ ... ],
    "periodTotals": [
      {
        "period": "2024-01",
        "totalDepreciation": 18500000,
        "totalTaxDepreciation": 19750000,
        "assetsCount": 25
      }
    ],
    "summary": {
      "totalAssets": 25,
      "totalDepreciation": 215000000,
      "totalTaxDepreciation": 228500000
    }
  }
}
```

### Asset Summary by Category
```bash
GET /api/{orgSlug}/reports/assets?type=asset-summary&status=ACTIVE
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reportType": "Asset Summary by Category",
    "summary": [
      {
        "category": {
          "name": "Motor Vehicles",
          "code": "VEH",
          "ugandaTaxRate": 25
        },
        "assetCount": 5,
        "totalCost": 350000000,
        "totalDepreciation": 87500000,
        "totalBookValue": 262500000,
        "depreciationPercent": 25.0
      }
    ],
    "grandTotal": {
      "totalAssets": 25,
      "totalCost": 850000000,
      "totalDepreciation": 215000000,
      "totalBookValue": 635000000
    }
  }
}
```

## Testing Workflow

### Complete Asset Lifecycle Test

1. **Setup (One-time)**
```bash
# Seed asset categories
tsx prisma/seed-fixed-assets.ts {organizationId}

# Seed sample assets
tsx prisma/seed-sample-assets.ts {organizationId} {branchId}
```

2. **Create Asset**
```bash
POST /api/{orgSlug}/assets
# Use data from "Create New Asset" example above
```

3. **Calculate Depreciation Schedule**
```bash
POST /api/{orgSlug}/assets/{assetId}/depreciation
{ "action": "calculate" }
```

4. **Post Monthly Depreciation**
```bash
POST /api/{orgSlug}/depreciation/run-monthly
{ "year": 2024, "month": 12, "autoPost": true }
```

5. **Record Maintenance**
```bash
POST /api/{orgSlug}/assets/{assetId}/maintenance
# Use data from "Create Maintenance Record" example
```

6. **Generate Reports**
```bash
GET /api/{orgSlug}/reports/assets?type=asset-register
GET /api/{orgSlug}/reports/assets?type=depreciation-schedule
```

7. **Dispose Asset (when needed)**
```bash
POST /api/{orgSlug}/assets/{assetId}/dispose
# Use data from "Dispose Asset" example
```

## Uganda Tax Compliance Notes

### Depreciation Rates (URA)
- **Computers & Electronics**: 40% declining balance
- **Motor Vehicles**: 25% declining balance
- **Plant & Machinery**: 30% declining balance
- **Furniture & Fittings**: 20% straight-line or declining balance
- **Commercial Buildings**: 10% straight-line
- **Industrial Buildings**: 5% straight-line

### Required Fields for Tax Returns
- `taxDepreciationAmount`: URA-compliant depreciation
- `taxBookValue`: Tax book value (different from accounting book value)
- `buyerTIN`: Required when disposing assets via sale (Uganda)

### Dual Depreciation Tracking
The system tracks **two depreciation values**:
1. **Book Depreciation**: For financial statements (any method)
2. **Tax Depreciation**: For URA compliance (specific rates)

Example: Computer purchased at UGX 10M
- **Book** (straight-line, 3 years): 3.33M/year
- **Tax** (URA declining 40%): 4M/year
- **Tax benefit**: Extra 670K deduction

## Common Use Cases

### Monthly Depreciation Process
```bash
# Run on 1st of each month
POST /api/{orgSlug}/depreciation/run-monthly
{
  "year": 2024,
  "month": 12,
  "autoPost": true
}
```

### Vehicle Trade-in
```bash
POST /api/{orgSlug}/assets/{oldVehicleId}/dispose
{
  "disposalMethod": "TRADE_IN",
  "disposalPrice": 50000000,
  "buyer": "Toyota Uganda",
  "autoPost": true
}

# Then create new asset with trade-in value as discount
POST /api/{orgSlug}/assets
{
  "purchasePrice": 120000000,  # After trade-in
  ...
}
```

### Asset Revaluation (Loss/Write-off)
```bash
POST /api/{orgSlug}/assets/{assetId}/dispose
{
  "disposalMethod": "WRITE_OFF",
  "disposalPrice": 0,
  "reason": "Damaged beyond repair - flood damage",
  "autoPost": true
}
```

## Error Handling

### Common Errors
```json
// Missing required fields
{
  "error": "Missing required fields: categoryId, name, purchaseDate"
}

// Asset already disposed
{
  "error": "Asset already disposed"
}

// Cannot delete asset with posted depreciation
{
  "error": "Cannot delete asset with posted depreciation. Consider disposing instead."
}

// Invalid depreciation period
{
  "error": "Depreciation for this period already posted"
}
```

## Performance Tips

1. **Batch Processing**: Use monthly batch endpoint for multiple assets
2. **Filters**: Use categoryId/branchId filters to reduce data
3. **Date Ranges**: Limit report date ranges for faster queries
4. **Caching**: Cache asset categories (rarely change)

## Next Steps

After testing the APIs:
1. Create frontend UI components
2. Set up automated monthly depreciation cron job
3. Configure maintenance reminder notifications
4. Generate PDF reports
5. Export to Excel for tax filing
