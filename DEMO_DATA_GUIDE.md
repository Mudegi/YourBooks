# Enhanced Forecasting System - Demo Data Guide

## 🎯 Overview

This guide helps you set up and test the enhanced forecasting system using realistic demo data for **Uganda Premium Distributors Ltd**, a fictional Ugandan distribution company with 24 months of historical sales data, seasonal patterns, and localized business context.

## 🚀 Quick Start

### 1. Setup Demo Data

```bash
# Install dependencies (if not already done)
npm install

# Generate demo data
npm run seed:demo

# Test the demo data
npm run test:demo
```

### 2. Reset Demo Data (if needed)

```bash
# Clean up existing demo data and recreate
npm run demo:reset

# Or clean up only
npm run demo:cleanup
```

## 🏢 Demo Company Profile

**Company**: Uganda Premium Distributors Ltd
- **Slug**: `uganda-premium-dist`
- **Business**: Consumer goods distribution across Uganda
- **Locations**: 5 locations across 4 regions
- **Products**: 19 items across 4 categories
- **Customers**: 12 customers across 4 segments
- **Data Period**: 24 months (Jan 2023 - Dec 2024)

### Locations & Regions

| Location | Type | Code | Region | Multiplier |
|----------|------|------|--------|------------|
| Kampala Central Branch | Branch | KLA-CTR | Central | 1.5x |
| Kampala Main Warehouse | Warehouse | KLA-WH1 | Central | - |
| Jinja Branch | Branch | JJA-BR1 | Eastern | 1.0x |
| Mbarara Branch | Branch | MBR-BR1 | Western | 0.8x |
| Gulu Branch | Branch | GUL-BR1 | Northern | 0.6x |

### Product Categories

#### 🍽️ Food & Beverages (Seasonal)
- **Peak Months**: December, January, July, August
- **Products**: Coca-Cola, Bell Lager, Rice, Sugar, Cooking Oil, Matooke, Coffee
- **Price Range**: UGX 2,500 - 125,000

#### 🧴 Personal Care (Non-Seasonal)
- **Products**: Colgate Toothpaste, Nivea Lotion, Always Pads, Dettol Soap
- **Price Range**: UGX 3,500 - 12,000

#### 🏠 Household Items (Seasonal)
- **Peak Months**: March, April, September, October
- **Products**: OMO Washing Powder, Vim Cleaner, Toilet Paper, Mosquito Coils
- **Price Range**: UGX 3,500 - 22,000

#### 📱 Electronics (Seasonal)
- **Peak Months**: November, December, January
- **Products**: Phone Chargers, LED Torch, Radio, Power Bank
- **Price Range**: UGX 15,000 - 65,000

### Customer Segments

| Segment | Discount | Payment Terms | Count |
|---------|----------|---------------|-------|
| Retail Shops | 5% | 30 days | 4 |
| Supermarkets | 12% | 45 days | 3 |
| Wholesale Distributors | 18% | 60 days | 2 |
| Institutional | 8% | 30 days | 3 |

## 📊 Historical Data Patterns

### Seasonal Influences
- **Holiday Peaks**: Christmas (1.5x), New Year (1.4x), Independence Day (1.35x)
- **Harvest Seasons**: March (-15%), September (-15%) - lower demand during harvest
- **School Terms**: Start of terms (+10% institutional demand)
- **Regional Variations**: Central region 50% higher, Northern region 40% lower

### Data Quality Features
- **24 Months**: January 2023 - December 2024
- **Monthly Volume**: 15-45 invoices per location per month
- **Line Items**: 1-8 products per invoice
- **Growth Trend**: 2-5% annual growth with monthly variations
- **Seasonality**: Category-specific seasonal patterns
- **External Events**: Uganda holidays, harvest cycles, election impacts

## 🧪 Testing the Enhanced Forecasting System

### API Endpoint Testing

**Base URL**: `/api/uganda-premium-dist/planning/forecasts`

#### 1. Get Available Methods
```bash
curl -X GET "http://localhost:3000/api/uganda-premium-dist/planning/forecasts?action=methods" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Generate Forecast
```bash
curl -X POST "http://localhost:3000/api/uganda-premium-dist/planning/forecasts?action=generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_FROM_DEMO_DATA",
    "periodStart": "2025-01-01",
    "periodEnd": "2025-12-31",
    "method": "EXPONENTIAL_SMOOTHING",
    "parameters": {
      "alpha": 0.3,
      "beta": 0.1,
      "gamma": 0.1
    },
    "historyMonths": 24,
    "includeExternalEvents": true
  }'
```

#### 3. Get Method Recommendations
```bash
curl -X GET "http://localhost:3000/api/uganda-premium-dist/planning/forecasts?action=recommendations&productId=PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Batch Generate Forecasts
```bash
curl -X POST "http://localhost:3000/api/uganda-premium-dist/planning/forecasts?action=batch" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "productId": "PRODUCT_ID_1",
        "periodStart": "2025-01-01",
        "periodEnd": "2025-12-31",
        "method": "MOVING_AVERAGE",
        "parameters": { "windowSize": 6 }
      },
      {
        "productId": "PRODUCT_ID_2",
        "periodStart": "2025-01-01",
        "periodEnd": "2025-12-31",
        "method": "LINEAR_REGRESSION",
        "parameters": { "includeSeasonality": true }
      }
    ]
  }'
```

#### 5. Create Supply Chain Plan
```bash
curl -X POST "http://localhost:3000/api/uganda-premium-dist/planning/forecasts?action=supply-chain-plan" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forecastIds": ["FORECAST_ID_1", "FORECAST_ID_2"],
    "planningHorizon": 90,
    "includeCapacityConstraints": true,
    "autoExecuteActions": false
  }'
```

### Test Scenarios

#### Scenario 1: High-Volume Product (Rice)
- **Product**: Rice (Super) 25kg (SKU: FB003)
- **Expected Pattern**: Seasonal peaks during holidays and harvest seasons
- **Best Method**: Exponential Smoothing (handles seasonality well)
- **Data Quality**: High (consistent sales across all regions)

#### Scenario 2: Regional Product (Matooke)
- **Product**: Matooke per bunch (SKU: FB006)
- **Expected Pattern**: Strong regional variations (higher in Central/Western)
- **Best Method**: Linear Regression with location factors
- **Data Quality**: Medium (regional bias)

#### Scenario 3: Electronic Product (Power Bank)
- **Product**: Power Bank 10000mAh (SKU: EL004)
- **Expected Pattern**: Holiday seasonality, urban bias
- **Best Method**: Moving Average with seasonal adjustment
- **Data Quality**: Lower (intermittent sales pattern)

#### Scenario 4: Stable Product (Toothpaste)
- **Product**: Colgate Toothpaste (SKU: PC001)
- **Expected Pattern**: Steady consumption, minimal seasonality
- **Best Method**: Moving Average or Linear Trend
- **Data Quality**: High (consistent demand)

## 🎛️ Demo User Accounts

### Manager Account
- **Email**: `demo.manager@ugandapremium.co.ug`
- **Role**: MANAGER
- **Permissions**: Full access to all forecasting features

### Planner Account  
- **Email**: `demo.planner@ugandapremium.co.ug`
- **Role**: EMPLOYEE
- **Permissions**: View and create forecasts, limited admin functions

## 🌍 Uganda Localization Features

### Business Calendar Events
- **New Year** (Jan 1): +40% demand
- **Easter** (Apr 18): +30% demand
- **Labour Day** (May 1): +20% demand
- **Martyrs Day** (Jun 3): +25% demand
- **Heroes Day** (Jun 9): +15% demand
- **Independence Day** (Oct 9): +35% demand
- **Christmas** (Dec 25): +50% demand
- **Boxing Day** (Dec 26): +30% demand

### Agricultural Cycles
- **March Harvest**: -15% food demand (local production)
- **September Harvest**: -15% food demand
- **School Terms**: +10% institutional demand (Feb, May, Sep)

### Regional Economic Factors
- **Central Region** (Kampala): Urban premium, 50% higher base demand
- **Eastern Region** (Jinja): Industrial area, average demand  
- **Western Region** (Mbarara): Agricultural area, 20% lower demand
- **Northern Region** (Gulu): Developing area, 40% lower demand

## 📈 Expected Test Results

### Forecast Accuracy Targets
- **Moving Average**: 75-85% accuracy for stable products
- **Exponential Smoothing**: 80-90% accuracy for seasonal products
- **Linear Regression**: 85-95% accuracy for trending products

### Data Quality Scores
- **High Quality Products** (>0.85): Rice, Sugar, Toothpaste, Soap
- **Medium Quality Products** (0.70-0.85): Beer, Coffee, Electronics
- **Lower Quality Products** (<0.70): Fresh produce, seasonal items

### Performance Benchmarks
- **API Response Time**: <2 seconds for single forecasts
- **Batch Processing**: <10 seconds for 5 products
- **Historical Analysis**: <15 seconds for 24-month analysis
- **Supply Chain Planning**: <30 seconds for comprehensive plan

## 🔧 Troubleshooting

### Common Issues

#### "Demo organization not found"
```bash
# Run the seeder first
npm run seed:demo
```

#### "No historical data available"
```bash
# Check if the seeder completed successfully
npm run test:demo

# If issues persist, reset the demo data
npm run demo:reset
```

#### "Product not found errors"
```bash
# Get valid product IDs from the demo data
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({ 
  where: { organization: { slug: 'uganda-premium-dist' } },
  select: { id: true, sku: true, name: true }
}).then(products => {
  console.log('Available products:');
  products.forEach(p => console.log(\`ID: \${p.id}, SKU: \${p.sku}, Name: \${p.name}\`));
  prisma.\$disconnect();
});
"
```

#### Database Connection Issues
```bash
# Ensure your database is running and Prisma is properly configured
npx prisma db push
npx prisma generate
```

## 🎉 Success Indicators

You'll know the demo is working correctly when:

✅ **Data Volume**: 500+ invoices with 2000+ line items  
✅ **Time Span**: Data covers full 24 months (2023-2024)  
✅ **Seasonality**: Holiday months show 20-50% demand increases  
✅ **Regional Variation**: Central region shows 50% higher sales  
✅ **Product Diversity**: All 19 products have sales history  
✅ **Customer Distribution**: All segments represented across regions  
✅ **Growth Trends**: 2-5% year-over-year growth visible  
✅ **API Responses**: All endpoints return valid forecasting data  
✅ **Method Recommendations**: System suggests appropriate algorithms  
✅ **Uganda Features**: Local holidays and harvest seasons impact demand  

## 📞 Support

If you encounter issues with the demo data:

1. Check the console output during seeding for errors
2. Verify database connectivity and Prisma configuration
3. Ensure all required dependencies are installed
4. Run the test script to validate data integrity
5. Reset demo data if corruption is suspected

The demo data provides a comprehensive foundation for testing all aspects of the enhanced forecasting system, from basic algorithm execution to complex supply chain integration scenarios.