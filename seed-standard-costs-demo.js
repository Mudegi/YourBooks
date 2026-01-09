/**
 * Seed Standard Costs Demo Data
 * 
 * This script creates comprehensive standard cost data for "Demo Company Inc."
 * including various cost components, different products, and realistic variance scenarios.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Demo products with realistic cost structures
const DEMO_PRODUCTS = [
  {
    sku: 'LAPTOP-001',
    name: 'Business Laptop Pro',
    description: 'High-performance laptop for business professionals',
    productType: 'FINISHED_GOOD',
    category: 'Electronics',
    purchasePrice: 1200.00,
    sellingPrice: 1800.00,
    standardCosts: {
      materialCost: 950.00,
      laborCost: 180.00,
      overheadCost: 120.00,
      totalStandardCost: 1250.00,
      lastPurchasePrice: 1180.00, // Creating variance
    }
  },
  {
    sku: 'MOUSE-W01',
    name: 'Wireless Optical Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    productType: 'FINISHED_GOOD',
    category: 'Electronics',
    purchasePrice: 25.00,
    sellingPrice: 45.00,
    standardCosts: {
      materialCost: 18.50,
      laborCost: 4.20,
      overheadCost: 2.80,
      totalStandardCost: 25.50,
      lastPurchasePrice: 24.80,
    }
  },
  {
    sku: 'KBD-MEC01',
    name: 'Mechanical Keyboard RGB',
    description: 'Professional mechanical keyboard with RGB lighting',
    productType: 'FINISHED_GOOD',
    category: 'Electronics',
    purchasePrice: 120.00,
    sellingPrice: 180.00,
    standardCosts: {
      materialCost: 85.00,
      laborCost: 22.00,
      overheadCost: 15.00,
      totalStandardCost: 122.00,
      lastPurchasePrice: 135.00, // Higher variance for testing
    }
  },
  {
    sku: 'MON-27HD',
    name: '27" 4K Monitor',
    description: '27-inch 4K UHD professional monitor',
    productType: 'FINISHED_GOOD',
    category: 'Electronics',
    purchasePrice: 350.00,
    sellingPrice: 520.00,
    standardCosts: {
      materialCost: 280.00,
      laborCost: 45.00,
      overheadCost: 30.00,
      totalStandardCost: 355.00,
      lastPurchasePrice: 342.00,
    }
  },
  {
    sku: 'CHAIR-ERG',
    name: 'Ergonomic Office Chair',
    description: 'Premium ergonomic office chair with lumbar support',
    productType: 'FINISHED_GOOD',
    category: 'Furniture',
    purchasePrice: 280.00,
    sellingPrice: 420.00,
    standardCosts: {
      materialCost: 220.00,
      laborCost: 42.00,
      overheadCost: 28.00,
      totalStandardCost: 290.00,
      lastPurchasePrice: 275.00,
    }
  },
  {
    sku: 'DESK-STAND',
    name: 'Standing Desk Adjustable',
    description: 'Electric height-adjustable standing desk',
    productType: 'FINISHED_GOOD',
    category: 'Furniture',
    purchasePrice: 450.00,
    sellingPrice: 680.00,
    standardCosts: {
      materialCost: 380.00,
      laborCost: 65.00,
      overheadCost: 45.00,
      totalStandardCost: 490.00,
      lastPurchasePrice: 465.00,
    }
  },
  // Raw materials
  {
    sku: 'CPU-I7-12',
    name: 'Intel i7 12th Gen CPU',
    description: 'High-performance processor for business laptops',
    productType: 'RAW_MATERIAL',
    category: 'Components',
    purchasePrice: 320.00,
    sellingPrice: 0,
    standardCosts: {
      materialCost: 320.00,
      laborCost: 0.00,
      overheadCost: 8.00,
      totalStandardCost: 328.00,
      lastPurchasePrice: 315.00,
    }
  },
  {
    sku: 'RAM-16GB',
    name: '16GB DDR4 Memory Module',
    description: 'High-speed 16GB DDR4 memory for laptops',
    productType: 'RAW_MATERIAL',
    category: 'Components',
    purchasePrice: 80.00,
    sellingPrice: 0,
    standardCosts: {
      materialCost: 80.00,
      laborCost: 0.00,
      overheadCost: 2.00,
      totalStandardCost: 82.00,
      lastPurchasePrice: 78.50,
    }
  },
  {
    sku: 'SSD-512',
    name: '512GB NVMe SSD',
    description: 'High-speed 512GB NVMe solid state drive',
    productType: 'RAW_MATERIAL',
    category: 'Components',
    purchasePrice: 65.00,
    sellingPrice: 0,
    standardCosts: {
      materialCost: 65.00,
      laborCost: 0.00,
      overheadCost: 1.50,
      totalStandardCost: 66.50,
      lastPurchasePrice: 72.00, // Higher variance
    }
  },
  {
    sku: 'STEEL-TUBE',
    name: 'Steel Tubing 2" x 48"',
    description: 'High-grade steel tubing for furniture frames',
    productType: 'RAW_MATERIAL',
    category: 'Materials',
    purchasePrice: 35.00,
    sellingPrice: 0,
    standardCosts: {
      materialCost: 35.00,
      laborCost: 0.00,
      overheadCost: 1.00,
      totalStandardCost: 36.00,
      lastPurchasePrice: 38.50, // Material price increase
    }
  }
];

async function main() {
  console.log('🚀 Starting Standard Costs demo data creation...\n');

  try {
    // Find the demo company
    const demoCompany = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: 'demo-company' },
          { name: { contains: 'Demo Company' } }
        ]
      }
    });

    if (!demoCompany) {
      console.log('❌ Demo Company not found. Please run setup-demo-company-data.js first');
      return;
    }

    console.log(`✅ Found Demo Company: ${demoCompany.name} (${demoCompany.slug})`);

    // Check for existing standard costs
    const existingStandardCosts = await prisma.standardCost.count({
      where: { organizationId: demoCompany.id }
    });

    if (existingStandardCosts > 0) {
      console.log(`\n⚠️  Found ${existingStandardCosts} existing standard costs.`);
      console.log('Do you want to delete existing data and create fresh demo data? (This is destructive!)');
      console.log('If yes, manually delete existing standard costs and run this script again.');
      return;
    }

    // Create or update products and their standard costs
    console.log('\n📦 Creating demo products and standard costs...\n');

    for (const productData of DEMO_PRODUCTS) {
      console.log(`Processing: ${productData.sku} - ${productData.name}`);

      // Create or update product
      const product = await prisma.product.upsert({
        where: {
          organizationId_sku: {
            organizationId: demoCompany.id,
            sku: productData.sku
          }
        },
        create: {
          organizationId: demoCompany.id,
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          productType: productData.productType,
          category: productData.category,
          purchasePrice: productData.purchasePrice,
          sellingPrice: productData.sellingPrice,
          trackInventory: true,
          taxable: true,
          defaultTaxRate: 8.25, // US tax rate
          isActive: true,
        },
        update: {
          name: productData.name,
          description: productData.description,
          purchasePrice: productData.purchasePrice,
          sellingPrice: productData.sellingPrice,
        }
      });

      // Create standard cost
      const standardCost = await prisma.standardCost.create({
        data: {
          organizationId: demoCompany.id,
          productId: product.id,
          costingMethod: 'WEIGHTED_AVERAGE',
          materialCost: productData.standardCosts.materialCost,
          laborCost: productData.standardCosts.laborCost,
          overheadCost: productData.standardCosts.overheadCost,
          totalStandardCost: productData.standardCosts.totalStandardCost,
          lastPurchasePrice: productData.standardCosts.lastPurchasePrice,
          priceDelta: productData.standardCosts.lastPurchasePrice - productData.standardCosts.totalStandardCost,
          priceVariance: Math.abs(productData.standardCosts.lastPurchasePrice - productData.standardCosts.totalStandardCost),
          costingVersion: '1.0',
          status: 'ACTIVE',
          effectiveFrom: new Date(),
          validFrom: new Date(),
          isActive: true,
          isFrozen: false,
          approvalRequired: false,
          baseCurrency: demoCompany.baseCurrency || 'USD',
          rollupSource: 'MANUAL',
          notes: `Initial standard cost setup for ${productData.name}`,
        }
      });

      // Calculate variance percentage for reporting
      const variancePercent = productData.standardCosts.lastPurchasePrice
        ? ((productData.standardCosts.lastPurchasePrice - productData.standardCosts.totalStandardCost) / productData.standardCosts.totalStandardCost) * 100
        : 0;

      console.log(`  ✅ Created standard cost: $${productData.standardCosts.totalStandardCost} (Variance: ${variancePercent.toFixed(1)}%)`);
    }

    // Create some cost variance records for demonstration
    console.log('\n📊 Creating cost variance examples...\n');

    const products = await prisma.product.findMany({
      where: { 
        organizationId: demoCompany.id,
        sku: { in: ['LAPTOP-001', 'KBD-MEC01', 'SSD-512'] }
      },
      include: { standardCosts: true }
    });

    for (const product of products) {
      if (product.standardCosts.length > 0) {
        const standardCost = product.standardCosts[0];
        const varianceAmount = parseFloat(standardCost.priceDelta?.toString() || '0');
        
        if (Math.abs(varianceAmount) > 5) { // Only create variance records for significant variances
          await prisma.costVariance.create({
            data: {
              organizationId: demoCompany.id,
              productId: product.id,
              standardCostId: standardCost.id,
              varianceType: varianceAmount > 0 ? 'UNFAVORABLE' : 'FAVORABLE',
              materialVariance: varianceAmount,
              totalVariance: varianceAmount,
              quantity: 1,
              referenceType: 'PURCHASE_PRICE_COMPARISON',
              notes: `Variance detected against last purchase price for ${product.name}`,
            }
          });
          console.log(`  ✅ Created variance record for ${product.sku}: $${varianceAmount}`);
        }
      }
    }

    // Summary
    const totalStandardCosts = await prisma.standardCost.count({
      where: { organizationId: demoCompany.id }
    });

    const totalVariances = await prisma.costVariance.count({
      where: { organizationId: demoCompany.id }
    });

    console.log('\n🎉 Standard Costs demo data creation completed!');
    console.log(`📈 Created ${totalStandardCosts} standard costs`);
    console.log(`📊 Created ${totalVariances} cost variance records`);
    console.log(`🌐 Visit: http://localhost:3000/demo-company/costing/standard-costs`);

  } catch (error) {
    console.error('❌ Error creating standard costs demo data:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };