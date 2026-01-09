/**
 * Demo Variance Data Setup
 * Creates realistic variance scenarios for testing the Financial Truth engine
 * 
 * Simulates common variance scenarios for Uganda-based operations:
 * - Exchange rate fluctuations
 * - Fuel surcharges
 * - Border delays
 * - Supplier price hikes
 * - Production inefficiencies
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock variance calculation functions (simplified for demo)
class SimplifiedVarianceCalculator {
  static async calculateVariances(input) {
    const {
      organizationId,
      productId,
      standardCosts,
      actualCosts,
      quantity,
      reasonCode,
      notes
    } = input;

    // Calculate individual variances (simplified)
    const materialVariance = (actualCosts.materialCost - standardCosts.materialCost) * quantity;
    const laborVariance = (actualCosts.laborCost - standardCosts.laborCost) * quantity;
    const overheadVariance = (actualCosts.overheadCost - standardCosts.overheadCost) * quantity;
    const totalVariance = materialVariance + laborVariance + overheadVariance;

    // Determine primary variance type
    let varianceType = 'PRODUCTION';
    if (Math.abs(materialVariance) > Math.abs(laborVariance) && Math.abs(materialVariance) > Math.abs(overheadVariance)) {
      if (reasonCode?.includes('PRICE') || reasonCode?.includes('SUPPLIER')) {
        varianceType = 'PURCHASE_PRICE';
      } else {
        varianceType = 'MATERIAL_USAGE';
      }
    } else if (Math.abs(laborVariance) > Math.abs(overheadVariance)) {
      varianceType = 'LABOR_EFFICIENCY';
    }

    // Create variance record
    const costVariance = await prisma.costVariance.create({
      data: {
        organizationId,
        productId,
        varianceType,
        materialVariance,
        laborVariance,
        overheadVariance,
        totalVariance,
        quantity,
        referenceType: 'DEMO',
        referenceId: `DEMO-${Date.now()}`,
        notes,
      },
    });

    return {
      totalVariance,
      materialVariance,
      laborVariance,
      overheadVariance,
      costVarianceId: costVariance.id
    };
  }
}

async function createDemoVarianceData() {
  console.log('🧪 Creating demo variance data for Financial Truth engine...\n');

  try {
    // Get demo organization
    let organization = await prisma.organization.findFirst({
      where: { slug: 'demo-company' },
    });

    if (!organization) {
      console.log('❌ Demo company not found. Please run setup first.');
      return;
    }

    // Get some products for variance testing
    const products = await prisma.product.findMany({
      where: { organizationId: organization.id },
      take: 5,
    });

    if (products.length === 0) {
      console.log('❌ No products found. Please create products first.');
      return;
    }

    // Initialize simplified variance calculator
    const varianceCalculator = SimplifiedVarianceCalculator;

    // Scenario 1: Exchange Rate Fluctuation Impact (Uganda context)
    console.log('📈 Creating exchange rate variance scenario...');
    const exchangeRateVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[0].id,
      standardCosts: {
        materialCost: 50, // $50 standard
        laborCost: 20,    // $20 standard
        overheadCost: 15, // $15 standard
        totalCost: 85,
      },
      actualCosts: {
        materialCost: 65,  // $65 actual (30% increase)
        laborCost: 20,     // Same
        overheadCost: 18,  // $18 actual (20% increase)
        totalCost: 103,
      },
      quantity: 100,
      transactionCurrency: 'UGX',
      exchangeRate: 0.00026, // UGX to USD rate
      reasonCode: 'EXCHANGE_RATE_FLUCTUATION',
      notes: 'EXCHANGE_RATE_FLUCTUATION: UGX weakened against USD, imported materials cost more',
    });
    console.log('✅ Exchange rate variance created:', exchangeRateVariance.totalVariance);

    // Scenario 2: Fuel Surcharge (Transport costs)
    console.log('⛽ Creating fuel surcharge variance scenario...');
    const fuelSurchargeVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[1].id,
      standardCosts: {
        materialCost: 30,
        laborCost: 25,
        overheadCost: 10, // Standard transport overhead
        totalCost: 65,
      },
      actualCosts: {
        materialCost: 30,
        laborCost: 25,
        overheadCost: 18, // 80% increase due to fuel costs
        totalCost: 73,
      },
      quantity: 50,
      reasonCode: 'FUEL_SURCHARGE',
      notes: 'FUEL_SURCHARGE: Diesel prices increased 80%, affecting transport costs',
    });
    console.log('✅ Fuel surcharge variance created:', fuelSurchargeVariance.totalVariance);

    // Scenario 3: Border Delay Costs (Uganda landlocked challenges)
    console.log('🚚 Creating border delay variance scenario...');
    const borderDelayVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[2].id,
      standardCosts: {
        materialCost: 40,
        laborCost: 15,
        overheadCost: 12,
        totalCost: 67,
      },
      actualCosts: {
        materialCost: 48, // 20% increase due to delays
        laborCost: 15,
        overheadCost: 16, // Additional storage costs
        totalCost: 79,
      },
      quantity: 75,
      reasonCode: 'BORDER_DELAY_COSTS',
      notes: 'BORDER_DELAY_COSTS: 5-day delay at Mombasa port increased material costs',
    });
    console.log('✅ Border delay variance created:', borderDelayVariance.totalVariance);

    // Scenario 4: Supplier Price Hike
    console.log('📊 Creating supplier price hike scenario...');
    const supplierPriceVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[3].id,
      standardCosts: {
        materialCost: 35,
        laborCost: 20,
        overheadCost: 8,
        totalCost: 63,
      },
      actualCosts: {
        materialCost: 42, // 20% supplier price increase
        laborCost: 20,
        overheadCost: 8,
        totalCost: 70,
      },
      quantity: 120,
      reasonCode: 'SUPPLIER_PRICE_HIKE',
      notes: 'SUPPLIER_PRICE_HIKE: Main steel supplier increased prices due to global shortages',
    });
    console.log('✅ Supplier price hike variance created:', supplierPriceVariance.totalVariance);

    // Scenario 5: Production Inefficiency (Labor variance)
    console.log('⚙️ Creating production inefficiency scenario...');
    const productionVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[4].id,
      standardCosts: {
        materialCost: 25,
        laborCost: 30, // Standard 10 hours at $3/hour
        overheadCost: 12,
        totalCost: 67,
      },
      actualCosts: {
        materialCost: 28, // Slight material waste
        laborCost: 45,    // 15 hours due to inefficiency
        overheadCost: 12,
        totalCost: 85,
      },
      quantity: 60,
      reasonCode: 'PRODUCTION_INEFFICIENCY',
      notes: 'PRODUCTION_INEFFICIENCY: New workers took 50% longer than standard time',
    });
    console.log('✅ Production inefficiency variance created:', productionVariance.totalVariance);

    // Scenario 6: Power Outage Losses (Uganda-specific)
    console.log('⚡ Creating power outage variance scenario...');
    const powerOutageVariance = await varianceCalculator.calculateVariances({
      organizationId: organization.id,
      productId: products[0].id,
      standardCosts: {
        materialCost: 20,
        laborCost: 25,
        overheadCost: 15, // Normal overhead
        totalCost: 60,
      },
      actualCosts: {
        materialCost: 22, // Some spoilage during outage
        laborCost: 35,    // Overtime after power restored
        overheadCost: 25, // Generator fuel + lost time
        totalCost: 82,
      },
      quantity: 40,
      reasonCode: 'POWER_OUTAGE_LOSSES',
      notes: 'POWER_OUTAGE_LOSSES: 6-hour power outage caused spoilage and required overtime',
    });
    console.log('✅ Power outage variance created:', powerOutageVariance.totalVariance);

    // Get summary of created variances
    console.log('\n📊 Variance Summary:');
    const variances = await prisma.costVariance.findMany({
      where: { organizationId: organization.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let totalUnfavorable = 0;
    let totalFavorable = 0;

    variances.forEach(v => {
      const variance = v.totalVariance.toNumber();
      if (variance > 0) {
        totalUnfavorable += variance;
        console.log(`  🔴 ${v.product.name}: $${variance.toFixed(2)} unfavorable`);
      } else {
        totalFavorable += Math.abs(variance);
        console.log(`  🟢 ${v.product.name}: $${Math.abs(variance).toFixed(2)} favorable`);
      }
    });

    console.log(`\n💰 Total Unfavorable: $${totalUnfavorable.toFixed(2)}`);
    console.log(`💚 Total Favorable: $${totalFavorable.toFixed(2)}`);
    console.log(`📈 Net Variance: $${(totalUnfavorable - totalFavorable).toFixed(2)}`);

    console.log('\n✅ Demo variance data created successfully!');
    console.log('🌐 Visit: http://localhost:3000/demo-company/costing/variances');

  } catch (error) {
    console.error('❌ Error creating demo variance data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the demo setup
createDemoVarianceData();