/**
 * Demo Data: Inventory Revaluations
 * 
 * Creates realistic revaluation scenarios for testing the enterprise
 * revaluation system, including Uganda-specific use cases like currency
 * fluctuations and border delays.
 * 
 * Run: node create-demo-revaluation-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating Demo Inventory Revaluation Data...\n');

  try {
    // Get the demo organization
    const organization = await prisma.organization.findFirst({
      where: {
        slug: 'demo-company',
      },
      include: {
        users: {
          take: 1,
        },
      },
    });

    if (!organization) {
      throw new Error('Demo organization not found. Please run basic demo setup first.');
    }

    const userId = organization.users[0].id;
    console.log(`📊 Organization: ${organization.name} (${organization.baseCurrency})`);
    console.log(`👤 User: ${organization.users[0].name}\n`);

    // Clear existing demo revaluations to avoid conflicts
    console.log('🧹 Clearing existing revaluations...');
    await prisma.costRevaluation.deleteMany({
      where: {
        organizationId: organization.id,
        revaluationNumber: {
          startsWith: 'REV-2024-',
        },
      },
    });

    // Get some products for revaluation
    const products = await prisma.product.findMany({
      where: {
        organizationId: organization.id,
        trackInventory: true,
      },
      include: {
        inventoryItems: {
          where: {
            quantityOnHand: { gt: 0 },
          },
        },
      },
      take: 8,
    });

    if (products.length === 0) {
      throw new Error('No products with inventory found. Please create some products first.');
    }

    const revaluationScenarios = [];

    // =============================================
    // SCENARIO 1: Currency Fluctuation (Uganda)
    // =============================================
    
    const importedProduct = products.find(p => 
      p.name.toLowerCase().includes('rice') || 
      p.name.toLowerCase().includes('sugar') || 
      p.name.toLowerCase().includes('fuel')
    ) || products[0];

    if (importedProduct.inventoryItems.length > 0) {
      const inventory = importedProduct.inventoryItems[0];
      const oldCost = inventory.averageCost;
      const newCost = oldCost * 1.25; // 25% increase due to UGX devaluation

      const scenario1 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0001',
          productId: importedProduct.id,
          revaluationDate: new Date('2024-01-15'),
          reason: 'CURRENCY_FLUCTUATION',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: inventory.quantityOnHand,
          valueDifference: (newCost - oldCost) * inventory.quantityOnHand,
          status: 'POSTED',
          notes: 'USD/UGX rate changed from 3,700 to 4,100. Imported goods cost adjustment.',
          createdAt: new Date('2024-01-15T08:30:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario1,
        scenarioName: 'Currency Fluctuation Impact',
        product: importedProduct,
      });
    }

    // =============================================
    // SCENARIO 2: Market Price Decline
    // =============================================

    const commodityProduct = products.find(p => 
      p.name.toLowerCase().includes('maize') || 
      p.name.toLowerCase().includes('coffee') || 
      p.name.toLowerCase().includes('tea')
    ) || products[1];

    if (commodityProduct.inventoryItems.length > 0) {
      const inventory = commodityProduct.inventoryItems[0];
      const oldCost = inventory.averageCost;
      const newCost = oldCost * 0.80; // 20% decline due to market conditions

      const scenario2 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0002',
          productId: commodityProduct.id,
          revaluationDate: new Date('2024-01-20'),
          reason: 'MARKET_DECLINE',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: inventory.quantityOnHand,
          valueDifference: (newCost - oldCost) * inventory.quantityOnHand,
          status: 'POSTED',
          notes: 'Commodity market prices declined due to oversupply. Adjusting to current market rates.',
          createdAt: new Date('2024-01-20T10:15:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario2,
        scenarioName: 'Market Price Decline',
        product: commodityProduct,
      });
    }

    // =============================================
    // SCENARIO 3: Damage Write-down
    // =============================================

    const perishableProduct = products.find(p => 
      p.name.toLowerCase().includes('milk') || 
      p.name.toLowerCase().includes('fruit') ||
      p.name.toLowerCase().includes('meat')
    ) || products[2];

    if (perishableProduct.inventoryItems.length > 0) {
      const inventory = perishableProduct.inventoryItems[0];
      const oldCost = inventory.averageCost;
      const damagedQty = Math.min(Math.floor(inventory.quantityOnHand * 0.15), 50); // 15% damaged
      const newCost = oldCost * 0.30; // 70% write-down for damaged goods

      const scenario3 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0003',
          productId: perishableProduct.id,
          revaluationDate: new Date('2024-01-25'),
          reason: 'DAMAGE_WRITE_DOWN',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: damagedQty,
          valueDifference: (newCost - oldCost) * damagedQty,
          status: 'APPROVED',
          notes: 'Power outage damaged refrigerated goods. Quality inspection report attached.',
          createdAt: new Date('2024-01-25T14:45:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario3,
        scenarioName: 'Damage Write-down',
        product: perishableProduct,
      });
    }

    // =============================================
    // SCENARIO 4: Border Delay Costs (Uganda)
    // =============================================

    const containerProduct = products.find(p => 
      p.name.toLowerCase().includes('electronics') || 
      p.name.toLowerCase().includes('machinery') ||
      p.name.toLowerCase().includes('hardware')
    ) || products[3];

    if (containerProduct.inventoryItems.length > 0) {
      const inventory = containerProduct.inventoryItems[0];
      const oldCost = inventory.averageCost;
      const newCost = oldCost * 1.12; // 12% increase due to additional costs

      const scenario4 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0004',
          productId: containerProduct.id,
          revaluationDate: new Date('2024-02-01'),
          reason: 'BORDER_DELAY_COSTS',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: inventory.quantityOnHand,
          valueDifference: (newCost - oldCost) * inventory.quantityOnHand,
          status: 'PENDING_APPROVAL',
          notes: 'Container delayed at Mombasa border for 10 days. Additional storage and demurrage costs incurred.',
          createdAt: new Date('2024-02-01T09:20:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario4,
        scenarioName: 'Border Delay Additional Costs',
        product: containerProduct,
      });
    }

    // =============================================
    // SCENARIO 5: Fuel Price Impact
    // =============================================

    const fuelSensitiveProduct = products.find(p => 
      p.name.toLowerCase().includes('transport') || 
      p.name.toLowerCase().includes('logistics') ||
      p.name.toLowerCase().includes('cement')
    ) || products[4];

    if (fuelSensitiveProduct.inventoryItems.length > 0) {
      const inventory = fuelSensitiveProduct.inventoryItems[0];
      const oldCost = inventory.averageCost;
      const newCost = oldCost * 1.18; // 18% increase due to fuel costs

      const scenario5 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0005',
          productId: fuelSensitiveProduct.id,
          revaluationDate: new Date('2024-02-05'),
          reason: 'FUEL_PRICE_IMPACT',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: inventory.quantityOnHand,
          valueDifference: (newCost - oldCost) * inventory.quantityOnHand,
          status: 'DRAFT',
          notes: 'Fuel prices increased 35% affecting transportation costs from Mombasa port.',
          createdAt: new Date('2024-02-05T11:30:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario5,
        scenarioName: 'Fuel Price Impact',
        product: fuelSensitiveProduct,
      });
    }

    // =============================================
    // SCENARIO 6: Error Correction
    // =============================================

    if (products[5] && products[5].inventoryItems.length > 0) {
      const inventory = products[5].inventoryItems[0];
      const oldCost = inventory.averageCost;
      const newCost = oldCost * 1.08; // 8% correction upward

      const scenario6 = await prisma.costRevaluation.create({
        data: {
          organizationId: organization.id,
          revaluationNumber: 'REV-2024-0006',
          productId: products[5].id,
          revaluationDate: new Date('2024-02-10'),
          reason: 'ERROR_CORRECTION',
          oldUnitCost: oldCost,
          newUnitCost: newCost,
          quantity: inventory.quantityOnHand,
          valueDifference: (newCost - oldCost) * inventory.quantityOnHand,
          status: 'APPROVED',
          notes: 'Correction for previously missed landed cost allocation. Period end adjustment.',
          createdAt: new Date('2024-02-10T16:00:00Z'),
        },
      });

      revaluationScenarios.push({
        ...scenario6,
        scenarioName: 'Error Correction',
        product: products[5],
      });
    }

    // =============================================
    // DISPLAY RESULTS
    // =============================================

    console.log('✅ Created Revaluation Scenarios:\n');

    let totalValueImpact = 0;
    revaluationScenarios.forEach((scenario, index) => {
      const valueImpact = scenario.valueDifference;
      totalValueImpact += valueImpact;

      console.log(`${index + 1}. ${scenario.scenarioName}`);
      console.log(`   📦 Product: ${scenario.product.name} (${scenario.product.sku})`);
      console.log(`   📄 Number: ${scenario.revaluationNumber}`);
      console.log(`   📅 Date: ${scenario.revaluationDate.toDateString()}`);
      console.log(`   🔄 Status: ${scenario.status}`);
      console.log(`   💰 Cost Change: ${scenario.oldUnitCost.toFixed(2)} → ${scenario.newUnitCost.toFixed(2)}`);
      console.log(`   📊 Qty: ${scenario.quantity.toLocaleString()}`);
      console.log(`   💸 Value Impact: ${valueImpact >= 0 ? '+' : ''}${valueImpact.toLocaleString()} ${organization.baseCurrency}`);
      console.log(`   📝 Reason: ${scenario.reason}`);
      console.log(`   💬 Notes: ${scenario.notes}\n`);
    });

    console.log('📈 SUMMARY STATISTICS:');
    console.log(`   Total Scenarios: ${revaluationScenarios.length}`);
    console.log(`   Total Value Impact: ${totalValueImpact >= 0 ? '+' : ''}${totalValueImpact.toLocaleString()} ${organization.baseCurrency}`);
    console.log(`   Average Impact: ${(totalValueImpact / revaluationScenarios.length).toLocaleString()} ${organization.baseCurrency}`);
    
    const statusCounts = revaluationScenarios.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Status Breakdown: ${Object.entries(statusCounts).map(([k,v]) => `${k}: ${v}`).join(', ')}`);

    console.log('\n🌍 UGANDA-SPECIFIC SCENARIOS:');
    const ugandaScenarios = revaluationScenarios.filter(s => 
      ['CURRENCY_FLUCTUATION', 'BORDER_DELAY_COSTS', 'FUEL_PRICE_IMPACT'].includes(s.reason)
    );
    console.log(`   Created ${ugandaScenarios.length} scenarios specific to Uganda operations`);
    console.log(`   These demonstrate real challenges faced by businesses importing through Mombasa`);
    console.log(`   Total Uganda-related impact: ${ugandaScenarios.reduce((sum, s) => sum + s.valueDifference, 0).toLocaleString()} ${organization.baseCurrency}`);

    console.log('\n✅ Demo revaluation data created successfully!');
    console.log(`🌐 View at: http://localhost:3000/demo-company/costing/revaluations`);
    console.log('\n💡 Test the following features:');
    console.log('   • Filter by status, reason code, and date ranges');
    console.log('   • View country-specific reason codes for Uganda');
    console.log('   • Preview GL entries for approved revaluations');
    console.log('   • Calculate market prices for new revaluations');
    console.log('   • Test approval workflow and financial controls');

  } catch (error) {
    console.error('❌ Error creating demo revaluation data:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });