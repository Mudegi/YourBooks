# Fixed Assets - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Setup (One-Time)

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Create Fixed Assets categories
node scripts/setup-fixed-assets.js YOUR_ORG_ID

# Optional: Add sample assets for testing
node scripts/setup-fixed-assets.js YOUR_ORG_ID --with-samples
```

### Step 2: Create Your First Asset

```bash
POST /api/your-org/assets
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "categoryId": "cat_vehicles_xxx",
  "name": "Toyota Land Cruiser V8",
  "description": "Executive company vehicle",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 150000000,
  "vendor": "Toyota Uganda",
  "depreciationMethod": "DECLINING_BALANCE",
  "usefulLifeYears": 5,
  "salvageValue": 15000000,
  "location": "Head Office - Kampala",
  "serialNumber": "VIN123456789"
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
      "currentBookValue": 150000000,
      "status": "ACTIVE"
    },
    "schedule": [/* depreciation schedule */]
  }
}
```

### Step 3: Run Monthly Depreciation

```bash
POST /api/your-org/depreciation/run-monthly
Content-Type: application/json

{
  "year": 2024,
  "month": 12,
  "autoPost": true
}
```

**This will:**
- Calculate depreciation for all active assets
- Create GL entries (Dr. Expense, Cr. Accumulated Depreciation)
- Post to general ledger
- Update asset book values

### Step 4: View Asset Register

```bash
GET /api/your-org/reports/assets?type=asset-register&status=ACTIVE
```

**Returns:**
- Assets grouped by category
- Current book values
- Accumulated depreciation
- Grand totals

### Step 5: Record Maintenance

```bash
POST /api/your-org/assets/ASSET_ID/maintenance
Content-Type: application/json

{
  "maintenanceType": "ROUTINE",
  "maintenanceDate": "2024-12-10",
  "description": "Oil change and routine service",
  "vendor": "Toyota Service Center",
  "cost": 850000,
  "nextMaintenanceDate": "2025-06-10"
}
```

## 📊 Common Scenarios

### Scenario 1: Buy a New Vehicle

```bash
# 1. Create asset
POST /api/your-org/assets
{
  "categoryId": "cat_vehicles",
  "name": "Toyota Hiace Van",
  "purchasePrice": 85000000,
  "purchaseDate": "2024-12-15",
  "depreciationMethod": "DECLINING_BALANCE",
  "usefulLifeYears": 5,
  "salvageValue": 8500000
}

# 2. Calculate first month depreciation
POST /api/your-org/assets/{id}/depreciation
{ "action": "calculate" }

# 3. Post to GL
POST /api/your-org/assets/{id}/depreciation
{
  "action": "post",
  "periodIds": ["dep_xxx"]
}
```

### Scenario 2: Sell an Asset

```bash
POST /api/your-org/assets/ASSET_ID/dispose
{
  "disposalDate": "2024-12-20",
  "disposalMethod": "SALE",
  "disposalPrice": 80000000,
  "buyer": "ABC Motors Ltd",
  "buyerTIN": "1234567890",
  "autoPost": true
}
```

**System automatically:**
- Calculates gain/loss (Sale Price - Book Value)
- Creates disposal journal entry
- Updates asset status to DISPOSED
- Posts to GL if autoPost=true

### Scenario 3: Monthly Depreciation Routine

```bash
# Run this on the 1st of every month
POST /api/your-org/depreciation/run-monthly
{
  "year": 2024,
  "month": 12,
  "autoPost": true
}
```

**Processes:**
- All ACTIVE assets
- Calculates both book and tax depreciation
- Posts to GL
- Updates asset book values

### Scenario 4: View Depreciation Schedule

```bash
# View schedule for specific asset
POST /api/your-org/assets/ASSET_ID/depreciation
{ "action": "calculate" }

# View all assets depreciation for a period
GET /api/your-org/reports/assets?type=depreciation-schedule&startDate=2024-01-01&endDate=2024-12-31
```

## 🇺🇬 Uganda Tax Compliance

### Tax Depreciation Rates

| Asset Category | URA Rate | Method |
|---------------|----------|---------|
| Motor Vehicles | 25% | Declining Balance |
| Computers | 40% | Declining Balance |
| Machinery | 30% | Declining Balance |
| Furniture | 20% | Straight-Line |
| Buildings | 10% | Straight-Line |

### Example: Vehicle Depreciation

**Purchase**: Toyota Land Cruiser, UGX 150M, Jan 2024

**Month 1 (January 2024)**:
- Tax Depreciation (25% declining): 150M × 25% ÷ 12 = **3,125,000**
- Book Depreciation (straight-line): (150M - 15M) ÷ 5 ÷ 12 = **2,250,000**
- **Tax Benefit**: 875,000 extra deduction!

**System tracks both** for accurate financial statements AND tax filing.

## 📋 Asset Categories Included

After running setup, you'll have these categories:

1. **Motor Vehicles** (VEH) - 25% tax rate
2. **Computers & Electronics** (COMP) - 40% tax rate
3. **Plant & Machinery** (MACH) - 30% tax rate
4. **Furniture & Fittings** (FURN) - 20% tax rate
5. **Buildings - Commercial** (BLDG-C) - 10% tax rate
6. **Buildings - Industrial** (BLDG-I) - 5% tax rate
7. **Land** (LAND) - Non-depreciable
8. **Leasehold Improvements** (LEASE) - 20% tax rate

## 🔧 Maintenance Tracking

```bash
# Create routine maintenance
POST /api/your-org/assets/ASSET_ID/maintenance
{
  "maintenanceType": "ROUTINE",
  "maintenanceDate": "2024-12-10",
  "description": "Routine service",
  "cost": 850000,
  "vendor": "Service Center",
  "nextMaintenanceDate": "2025-06-10",
  "status": "COMPLETED"
}

# View maintenance history
GET /api/your-org/assets/ASSET_ID/maintenance

# Filter by status
GET /api/your-org/assets/ASSET_ID/maintenance?status=SCHEDULED
```

## 📈 Reports Available

### 1. Asset Register
```bash
GET /api/your-org/reports/assets?type=asset-register&status=ACTIVE
```
Shows: All assets grouped by category with current values

### 2. Depreciation Schedule
```bash
GET /api/your-org/reports/assets?type=depreciation-schedule&startDate=2024-01-01&endDate=2024-12-31
```
Shows: Depreciation by period for all assets

### 3. Asset Summary
```bash
GET /api/your-org/reports/assets?type=asset-summary&status=ACTIVE
```
Shows: Category totals with depreciation percentages

## 🎯 Best Practices

### Monthly Routine
```
Day 1 of Month:
├── Run monthly depreciation batch
├── Review depreciation entries
├── Post to GL
└── Generate depreciation schedule report

Day 5 of Month:
├── Check for overdue maintenance
├── Schedule upcoming maintenance
└── Review maintenance costs
```

### Year-End Process
```
End of Year:
├── Generate full year asset register
├── Generate depreciation schedule report
├── Review disposal records
├── Calculate tax depreciation summary
└── Prepare tax return schedules
```

### Asset Purchase Workflow
```
1. Create Purchase Order (Procurement)
2. Receive Asset
3. Record in Fixed Assets module
4. Assign asset number
5. Calculate depreciation schedule
6. Start monthly depreciation
```

### Asset Disposal Workflow
```
1. Obtain approval for disposal
2. Find buyer (if sale)
3. Record disposal in system
4. Calculate gain/loss
5. Post disposal entry to GL
6. Update asset status to DISPOSED
```

## 🚨 Common Issues

### Issue: "Missing GL accounts"
**Solution**: Create these GL accounts first:
- 1600 - Fixed Assets
- 1650 - Accumulated Depreciation
- 6400 - Depreciation Expense

### Issue: "Cannot delete asset"
**Solution**: Assets with posted depreciation cannot be deleted. Use disposal instead.

### Issue: "Depreciation already posted for this period"
**Solution**: Each period can only be posted once. Review existing entries.

## 📞 Need Help?

- **Full Documentation**: `docs/FIXED_ASSETS.md`
- **API Testing Guide**: `docs/FIXED_ASSETS_API_TESTING.md`
- **Implementation Summary**: `FIXED_ASSETS_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist

Before going live:
- [ ] Run `setup-fixed-assets.js` script
- [ ] Verify GL accounts are mapped correctly
- [ ] Test creating an asset
- [ ] Test depreciation calculation
- [ ] Test monthly depreciation batch
- [ ] Test disposal process
- [ ] Generate test reports
- [ ] Train staff on asset management
- [ ] Set up monthly depreciation schedule
- [ ] Configure maintenance reminders

---

## 🎉 You're Ready!

Start tracking your fixed assets, automate depreciation, and stay compliant with Uganda tax requirements.

**Questions?** Check the full documentation in `/docs`
