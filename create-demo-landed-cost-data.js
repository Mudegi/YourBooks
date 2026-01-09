/**
 * Demo Landed Cost Data Setup
 * Creates realistic landed cost scenarios for businesses in landlocked countries
 * 
 * Simulates common landed cost scenarios for Uganda operations:
 * - Container imports from Mombasa port
 * - Fuel surcharges and border delays
 * - Multiple allocation methods
 * - High cost increases (20-40% typical for landlocked countries)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDemoLandedCostData() {
  console.log('🚚 Creating demo landed cost data for Cost Apportionment Engine...\n');

  try {
    // Get demo organization
    const organization = await prisma.organization.findFirst({
      where: { slug: 'demo-company' },
    });

    if (!organization) {
      console.log('❌ Demo company not found. Please run setup first.');
      return;
    }

    // Get products for landed cost allocation
    const products = await prisma.product.findMany({
      where: { organizationId: organization.id },
      take: 8,
    });

    if (products.length === 0) {
      console.log('❌ No products found. Please create products first.');
      return;
    }

    console.log('📦 Found', products.length, 'products for landed cost allocation');

    // Scenario 1: Container from Mombasa to Kampala (Uganda typical scenario)
    console.log('\n🚢 Creating Container CONT-2024-001 scenario...');
    
    const containerItems = products.slice(0, 4).map((product, index) => ({
      productId: product.id,
      quantity: 50 + (index * 25), // 50, 75, 100, 125 units
      unitCost: 100 + (index * 50), // $100, $150, $200, $250
      weight: 20 + (index * 15), // 20, 35, 50, 65 kg per unit
      volume: 0.1 + (index * 0.05), // 0.1, 0.15, 0.2, 0.25 CBM per unit
    }));

    const containerLandedCost = await prisma.landedCost.create({
      data: {
        organizationId: organization.id,
        referenceType: 'CONTAINER',
        referenceId: 'CONT-2024-001',
        totalProductCost: containerItems.reduce((sum, item) => 
          sum + (item.quantity * item.unitCost), 0),
        freightCost: 8500, // High freight cost from Mombasa to Kampala
        insuranceCost: 450,
        customsDuty: 6750, // 25% duty typical for Uganda
        handlingCost: 1200, // Port handling + clearing agent
        otherCosts: 2100, // Border delays, fuel surcharge, storage
        totalLandedCost: 8500 + 450 + 6750 + 1200 + 2100 + 
          containerItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        allocationMethod: 'BY_VALUE',
        isAllocated: true,
        allocatedAt: new Date(),
        notes: 'Container from Mombasa - 5 day border delay, fuel surcharge applied',
      },
    });

    // Create allocations for container (by value method)
    const totalContainerValue = containerItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitCost), 0);
    const totalLandedCostAmount = 8500 + 450 + 6750 + 1200 + 2100;

    for (const item of containerItems) {
      const itemValue = item.quantity * item.unitCost;
      const allocationPercent = itemValue / totalContainerValue;
      const allocatedAmount = totalLandedCostAmount * allocationPercent;
      const newUnitCost = item.unitCost + (allocatedAmount / item.quantity);

      await prisma.landedCostAllocationItem.create({
        data: {
          landedCostId: containerLandedCost.id,
          productId: item.productId,
          quantity: item.quantity,
          productCost: itemValue,
          allocatedAmount: allocatedAmount,
          unitLandedCost: newUnitCost,
        },
      });
    }

    console.log('✅ Container landed cost created with', containerItems.length, 'item allocations');

    // Scenario 2: Air Freight (By Weight allocation)
    console.log('\n✈️ Creating Air Freight SHIP-2024-015 scenario...');

    const airFreightItems = products.slice(2, 6).map((product, index) => ({
      productId: product.id,
      quantity: 25 + (index * 10), // 25, 35, 45, 55 units
      unitCost: 200 + (index * 100), // $200, $300, $400, $500
      weight: 2 + (index * 3), // 2, 5, 8, 11 kg per unit
      volume: 0.02 + (index * 0.01), // Small volumes for air freight
    }));

    const airFreightLandedCost = await prisma.landedCost.create({
      data: {
        organizationId: organization.id,
        referenceType: 'SHIPMENT',
        referenceId: 'SHIP-2024-015',
        totalProductCost: airFreightItems.reduce((sum, item) => 
          sum + (item.quantity * item.unitCost), 0),
        freightCost: 12000, // High air freight cost
        insuranceCost: 650,
        customsDuty: 5400,
        handlingCost: 800, // Airport handling
        otherCosts: 450, // Expedited processing
        totalLandedCost: 12000 + 650 + 5400 + 800 + 450 +
          airFreightItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        allocationMethod: 'BY_WEIGHT',
        isAllocated: true,
        allocatedAt: new Date(),
        notes: 'Urgent air freight - allocated by weight for fairness',
      },
    });

    // Create allocations by weight
    const totalAirFreightWeight = airFreightItems.reduce((sum, item) => 
      sum + (item.quantity * item.weight), 0);
    const totalAirLandedCostAmount = 12000 + 650 + 5400 + 800 + 450;

    for (const item of airFreightItems) {
      const itemWeight = item.quantity * item.weight;
      const allocationPercent = itemWeight / totalAirFreightWeight;
      const allocatedAmount = totalAirLandedCostAmount * allocationPercent;
      const newUnitCost = item.unitCost + (allocatedAmount / item.quantity);

      await prisma.landedCostAllocationItem.create({
        data: {
          landedCostId: airFreightLandedCost.id,
          productId: item.productId,
          quantity: item.quantity,
          productCost: item.quantity * item.unitCost,
          allocatedAmount: allocatedAmount,
          unitLandedCost: newUnitCost,
        },
      });
    }

    console.log('✅ Air freight landed cost created with weight-based allocation');

    // Scenario 3: Pending Allocation (not yet allocated)
    console.log('\n⏳ Creating Pending Purchase Receipt PRCPT-2024-089...');

    const pendingItems = products.slice(4, 7).map((product, index) => ({
      productId: product.id,
      quantity: 100 + (index * 50), // 100, 150, 200 units
      unitCost: 75 + (index * 25), // $75, $100, $125
      weight: 10 + (index * 5), // 10, 15, 20 kg per unit
      volume: 0.05 + (index * 0.02), // 0.05, 0.07, 0.09 CBM per unit
    }));

    await prisma.landedCost.create({
      data: {
        organizationId: organization.id,
        referenceType: 'PURCHASE_RECEIPT',
        referenceId: 'PRCPT-2024-089',
        totalProductCost: pendingItems.reduce((sum, item) => 
          sum + (item.quantity * item.unitCost), 0),
        freightCost: 3500,
        insuranceCost: 200,
        customsDuty: 2800,
        handlingCost: 600,
        otherCosts: 1100, // Border delays
        totalLandedCost: 3500 + 200 + 2800 + 600 + 1100 +
          pendingItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        allocationMethod: 'BY_VOLUME',
        isAllocated: false, // Pending allocation
        notes: 'Awaiting customs clearance - allocation pending',
      },
    });

    console.log('✅ Pending landed cost created (not yet allocated)');

    // Get summary of created landed costs
    console.log('\n📊 Landed Cost Summary:');
    const landedCosts = await prisma.landedCost.findMany({
      where: { organizationId: organization.id },
      include: { 
        allocations: { 
          include: { product: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let totalOriginalValue = 0;
    let totalLandedValue = 0;
    let totalItemsAllocated = 0;

    landedCosts.forEach(lc => {
      const originalValue = lc.totalProductCost.toNumber();
      const landedValue = lc.totalLandedCost.toNumber();
      const costIncrease = landedValue - originalValue;
      const increasePercent = originalValue > 0 ? (costIncrease / originalValue) * 100 : 0;
      
      totalOriginalValue += originalValue;
      totalLandedValue += landedValue;
      totalItemsAllocated += lc.allocations.length;

      console.log(`  📦 ${lc.referenceId}: $${originalValue.toLocaleString()} → $${landedValue.toLocaleString()} (+${increasePercent.toFixed(1)}%) - ${lc.allocations.length} items`);
    });

    const totalCostIncrease = totalLandedValue - totalOriginalValue;
    const averageIncreasePercent = totalOriginalValue > 0 ? 
      (totalCostIncrease / totalOriginalValue) * 100 : 0;

    console.log(`\n💰 Total Original Value: $${totalOriginalValue.toLocaleString()}`);
    console.log(`🚚 Total Landed Value: $${totalLandedValue.toLocaleString()}`);
    console.log(`📈 Total Cost Increase: $${totalCostIncrease.toLocaleString()}`);
    console.log(`📊 Average Cost Increase: ${averageIncreasePercent.toFixed(1)}%`);
    console.log(`📦 Total Items Allocated: ${totalItemsAllocated}`);

    console.log('\n✅ Demo landed cost data created successfully!');
    console.log('🌐 Visit: http://localhost:3000/demo-company/costing/landed-costs');
    console.log('📋 Note: Typical Uganda operations see 20-40% cost increases due to freight from Mombasa');

  } catch (error) {
    console.error('❌ Error creating demo landed cost data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the demo setup
createDemoLandedCostData();