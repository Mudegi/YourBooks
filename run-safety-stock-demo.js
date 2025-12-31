/**
 * Quick script to run safety stock demo data creation
 */

const { PrismaClient } = require('@prisma/client');
const { createDemoCompanyData, checkDemoCompany } = require('./setup-demo-company-data.js');

const prisma = new PrismaClient();

async function runSafetyStockDemo() {
  console.log('🛡️ Running Safety Stock Demo Data Creation...\n');
  
  try {
    // Check for Demo Company
    const demoCompany = await checkDemoCompany();
    
    if (!demoCompany) {
      console.log('❌ No Demo Company Inc found.');
      console.log('Please create "Demo Company Inc" organization first.');
      return;
    }

    console.log(`✅ Found Demo Company: ${demoCompany.name}`);
    
    // Check current safety stock data
    const currentSafetyStock = await prisma.safetyStock.count({
      where: { organizationId: demoCompany.id }
    });
    
    console.log(`Current Safety Stock rules: ${currentSafetyStock}`);
    
    if (currentSafetyStock > 0) {
      console.log('⚠️  Safety stock data already exists. This will add more if needed.');
    }

    // Run the demo data creation
    const result = await createDemoCompanyData(demoCompany);
    
    console.log('\n🎉 Safety Stock Demo Data Ready!');
    console.log(`Safety Stock Rules: ${result.safetyStock || 'Created'}`);
    
    // Quick verification
    const finalSafetyStockCount = await prisma.safetyStock.count({
      where: { organizationId: demoCompany.id }
    });
    
    const finalInventoryCount = await prisma.inventoryItem.count({
      where: { 
        product: { organizationId: demoCompany.id }
      }
    });
    
    console.log(`   ✅ Safety Stock Rules: ${finalSafetyStockCount}`);
    console.log(`   ✅ Inventory Items: ${finalInventoryCount}`);
    
    console.log('\n🧪 Test the Safety Stock Module:');
    console.log(`   1. Navigate to: /${demoCompany.slug}/planning/safety-stock`);
    console.log(`   2. API Test: /api/planning/safety-stock/overview?orgId=${demoCompany.slug}`);
    console.log(`   3. Check different calculation methods and risk levels`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runSafetyStockDemo();