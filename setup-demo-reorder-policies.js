/**
 * Setup Demo Reorder Policies for Demo Company
 * Creates sample reorder policies for testing the Planning Rules Engine
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDemoReorderPolicies() {
  console.log('🎯 Setting up Demo Reorder Policies...\n');
  
  try {
    // Find Demo Company
    const demoCompany = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Company' } },
          { slug: { contains: 'demo-company' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        baseCurrency: true,
        homeCountry: true,
      },
    });

    if (!demoCompany) {
      console.log('❌ Demo Company not found. Please run setup-demo-company-data.js first');
      return;
    }

    console.log(`✅ Found ${demoCompany.name} (${demoCompany.slug})`);
    console.log(`   Currency: ${demoCompany.baseCurrency}`);
    console.log(`   Country: ${demoCompany.homeCountry}\n`);

    // Get some products for this company
    const products = await prisma.product.findMany({
      where: {
        organizationId: demoCompany.id,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        purchasePrice: true,
        sellingPrice: true,
        category: true,
      },
      take: 10,
    });

    if (products.length === 0) {
      console.log('❌ No products found for Demo Company. Creating some demo products first...\n');
      
      // Create some demo products suitable for Uganda business context
      const demoProducts = [
        {
          name: 'Premium Coffee Beans (Arabica)',
          sku: 'COFFEE-001',
          unit: 'kg',
          purchasePrice: 15000, // 15,000 UGX per kg
          category: 'Agricultural Products',
        },
        {
          name: 'Matooke (Green Bananas)',
          sku: 'FRUIT-001', 
          unit: 'bunch',
          purchasePrice: 5000, // 5,000 UGX per bunch
          category: 'Fresh Produce',
        },
        {
          name: 'Solar Panel 100W',
          sku: 'SOLAR-001',
          unit: 'units',
          purchasePrice: 450000, // 450,000 UGX
          category: 'Electronics',
        },
        {
          name: 'Water Purification Tablets',
          sku: 'HEALTH-001',
          unit: 'pack',
          purchasePrice: 25000, // 25,000 UGX per pack
          category: 'Healthcare',
        },
        {
          name: 'Motorcycle Spare Parts Kit',
          sku: 'AUTO-001',
          unit: 'kit',
          purchasePrice: 180000, // 180,000 UGX
          category: 'Automotive',
        },
        {
          name: 'Textbooks (Primary School)',
          sku: 'EDU-001',
          unit: 'set',
          purchasePrice: 75000, // 75,000 UGX per set
          category: 'Education',
        },
        {
          name: 'Construction Cement (50kg)',
          sku: 'CONST-001',
          unit: 'bag',
          purchasePrice: 32000, // 32,000 UGX per bag
          category: 'Construction',
        },
        {
          name: 'Mobile Phone Accessories',
          sku: 'MOBILE-001',
          unit: 'set',
          purchasePrice: 50000, // 50,000 UGX
          category: 'Electronics',
        },
      ];

      const createdProducts = [];
      for (const productData of demoProducts) {
        // Remove unit field since it's not a direct field in Product model
        const { unit, ...productFields } = productData;
        
        const product = await prisma.product.create({
          data: {
            organizationId: demoCompany.id,
            productType: 'GOODS', // Set default product type
            ...productFields,
            isActive: true,
            trackInventory: true,
          },
        });
        createdProducts.push(product);
        console.log(`   ✅ Created product: ${product.name} (${product.sku})`);
      }
      
      products.push(...createdProducts);
    }

    console.log(`\n📦 Found ${products.length} products for reorder policies\n`);

    // Delete existing demo reorder policies to avoid duplicates
    await prisma.reorderPolicy.deleteMany({
      where: { organizationId: demoCompany.id },
    });

    console.log('🧹 Cleared existing reorder policies\n');

    // Create diverse reorder policies showcasing different strategies
    const reorderPolicies = [
      // High-volume, low-cost items - Fixed Quantity Strategy
      {
        productId: products.find(p => p.name.includes('Coffee'))?.id || products[0].id,
        policyType: 'REORDER_POINT', // Maps to FIXED_QTY
        reorderPoint: 50, // 50 kg
        reorderQuantity: 200, // Order 200 kg when hit reorder point
        minQuantity: 20,
        maxQuantity: 500,
        leadTimeDays: 14, // Cross-border logistics
        reviewCycleDays: 7,
        notes: 'Fixed quantity strategy for bulk coffee purchase. Uganda-optimized for import logistics.',
      },
      
      // Perishable items - Max Quantity Strategy  
      {
        productId: products.find(p => p.name.includes('Matooke'))?.id || products[1].id,
        policyType: 'MIN_MAX', // Maps to MAX_QTY
        reorderPoint: 10, // 10 bunches
        reorderQuantity: 30, // Variable quantity to reach max
        minQuantity: 10,
        maxQuantity: 50, // Max storage capacity
        leadTimeDays: 3, // Local supply
        reviewCycleDays: 2, // Frequent review for perishables
        notes: 'Max quantity strategy for perishable produce. Local supply chain optimized.',
      },

      // High-value items - Lot-for-Lot Strategy
      {
        productId: products.find(p => p.name.includes('Solar'))?.id || products[2].id,
        policyType: 'JUST_IN_TIME', // Maps to LOT_FOR_LOT
        reorderPoint: 2, // 2 units
        reorderQuantity: 5, // Order based on forecast
        minQuantity: 1,
        maxQuantity: 10,
        leadTimeDays: 21, // International shipping
        reviewCycleDays: 14,
        notes: 'Lot-for-lot strategy for expensive solar panels. Order exactly what\'s needed.',
      },

      // Healthcare items - Economic Order Quantity
      {
        productId: products.find(p => p.name.includes('Water'))?.id || products[3].id,
        policyType: 'ECONOMIC_ORDER_QUANTITY', // Maps to FIXED_QTY
        reorderPoint: 25, // 25 packs
        reorderQuantity: 100, // EOQ calculated amount
        minQuantity: 15,
        maxQuantity: 200,
        leadTimeDays: 10,
        reviewCycleDays: 7,
        notes: 'EOQ strategy for healthcare products. Optimized for cost and storage.',
      },

      // Automotive parts - Periodic Review
      {
        productId: products.find(p => p.name.includes('Motorcycle'))?.id || products[4].id,
        policyType: 'PERIODIC_REVIEW', // Maps to MAX_QTY
        reorderPoint: 5, // 5 kits
        reorderQuantity: 15,
        minQuantity: 3,
        maxQuantity: 25,
        leadTimeDays: 18, // Import from regional suppliers
        reviewCycleDays: 30, // Monthly review
        notes: 'Periodic review strategy for motorcycle parts. Monthly planning cycle.',
      },

      // Education materials - Min-Max with seasonal consideration
      {
        productId: products.find(p => p.name.includes('Textbooks'))?.id || products[5].id,
        policyType: 'MIN_MAX',
        reorderPoint: 8, // 8 sets
        reorderQuantity: 20,
        minQuantity: 5,
        maxQuantity: 40, // Higher for school term preparation
        leadTimeDays: 12,
        reviewCycleDays: 14,
        notes: 'Min-Max strategy for educational materials. Seasonal demand consideration.',
      },

      // Construction materials - Fixed reorder for project planning
      {
        productId: products.find(p => p.name.includes('Cement'))?.id || products[6].id,
        policyType: 'REORDER_POINT',
        reorderPoint: 100, // 100 bags
        reorderQuantity: 500, // Bulk purchase for cost efficiency
        minQuantity: 50,
        maxQuantity: 1000,
        leadTimeDays: 7, // Local suppliers
        reviewCycleDays: 10,
        notes: 'Fixed quantity strategy for construction cement. Bulk ordering for project needs.',
      },

      // Electronics - Just-in-time for fast-moving tech
      {
        productId: products.find(p => p.name.includes('Mobile'))?.id || products[7].id,
        policyType: 'JUST_IN_TIME',
        reorderPoint: 15, // 15 sets
        reorderQuantity: 25,
        minQuantity: 10,
        maxQuantity: 50,
        leadTimeDays: 8,
        reviewCycleDays: 5, // Frequent review for tech items
        notes: 'JIT strategy for mobile accessories. Fast-moving technology products.',
      },
    ];

    console.log('📊 Creating enterprise reorder policies...\n');

    const createdPolicies = [];
    for (let i = 0; i < Math.min(reorderPolicies.length, products.length); i++) {
      const policyData = reorderPolicies[i];
      const product = products.find(p => p.id === policyData.productId) || products[i];
      
      try {
        const policy = await prisma.reorderPolicy.create({
          data: {
            organizationId: demoCompany.id,
            productId: product.id,
            policyType: policyData.policyType,
            reorderPoint: policyData.reorderPoint,
            reorderQuantity: policyData.reorderQuantity,
            minQuantity: policyData.minQuantity,
            maxQuantity: policyData.maxQuantity,
            leadTimeDays: policyData.leadTimeDays,
            reviewCycleDays: policyData.reviewCycleDays,
            effectiveFrom: new Date(),
            isActive: true,
            notes: policyData.notes,
          },
        });

        createdPolicies.push(policy);
        
        console.log(`   ✅ ${policy.policyType}: ${product.name}`);
        console.log(`      Reorder Point: ${policy.reorderPoint} units`);
        console.log(`      Order Quantity: ${policy.reorderQuantity} units`);
        console.log(`      Lead Time: ${policy.leadTimeDays} days`);
        console.log(`      Value: ${Number(product.purchasePrice || 0).toLocaleString()} UGX`);
        console.log('');
      } catch (error) {
        console.log(`   ❌ Failed to create policy for ${product.name}: ${error.message}`);
      }
    }

    // Add some inactive policies for testing filters
    if (products.length > 4) {
      const inactivePolicy = await prisma.reorderPolicy.create({
        data: {
          organizationId: demoCompany.id,
          productId: products[0].id, // Use first product
          policyType: 'MIN_MAX',
          reorderPoint: 5,
          reorderQuantity: 10,
          minQuantity: 3,
          maxQuantity: 20,
          leadTimeDays: 7,
          reviewCycleDays: 14,
          effectiveFrom: new Date(),
          isActive: false, // Inactive for testing
          notes: 'Inactive policy for UI testing - demonstrates filter functionality',
        },
      });
      createdPolicies.push(inactivePolicy);
      console.log(`   ⏸️  INACTIVE: ${products[0].name} (for testing filters)`);
    }

    console.log(`\n🎉 Successfully created ${createdPolicies.length} reorder policies for ${demoCompany.name}!`);
    console.log(`\n🌐 Test the Planning Rules Engine at:`);
    console.log(`   http://localhost:3000/${demoCompany.slug}/planning/reorder-policies`);
    console.log(`\n📊 Features to test:`);
    console.log(`   • Strategy-based policies (Fixed Qty, Max Qty, Lot-for-Lot, JIT)`);
    console.log(`   • Uganda localization (UGX currency, regional defaults)`);
    console.log(`   • Live calculations toggle`);
    console.log(`   • Bulk operations (select multiple policies)`);
    console.log(`   • Advanced filtering (strategy, status, category)`);
    console.log(`   • Cards vs Table view modes`);
    console.log(`   • Enterprise analytics dashboard`);
    
    // Calculate some summary statistics
    const totalValue = createdPolicies.reduce((sum, policy, index) => {
      const product = products.find(p => p.id === policy.productId) || products[index] || products[0];
      return sum + (Number(policy.reorderQuantity) * Number(product.purchasePrice || 0));
    }, 0);

    console.log(`\n💰 Portfolio Summary:`);
    console.log(`   Total Policies: ${createdPolicies.length}`);
    console.log(`   Active Policies: ${createdPolicies.filter(p => p.isActive).length}`);
    console.log(`   Total Reorder Value: ${totalValue.toLocaleString()} UGX`);
    console.log(`   Average Lead Time: ${Math.round(createdPolicies.reduce((sum, p) => sum + p.leadTimeDays, 0) / createdPolicies.length)} days`);

  } catch (error) {
    console.error('❌ Error setting up demo reorder policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDemoReorderPolicies();