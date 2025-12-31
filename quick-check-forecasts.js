/**
 * Quick Check - Demo Company Forecast Data
 * 
 * This script quickly checks if Demo Company Inc has forecast data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCheck() {
  console.log('🔍 Quick check of Demo Company Inc forecast data...\n');
  
  try {
    // Find Demo Company Inc
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Company Inc' } },
          { name: { contains: 'Demo Company' } },
        ],
      },
    });
    
    if (!organization) {
      console.log('❌ Demo Company Inc not found');
      return;
    }
    
    console.log(`✅ Found: ${organization.name} (${organization.slug})`);
    
    // Check data counts
    const [products, customers, invoices, forecasts] = await Promise.all([
      prisma.product.count({ where: { organizationId: organization.id } }),
      prisma.customer.count({ where: { organizationId: organization.id } }),
      prisma.invoice.count({ where: { organizationId: organization.id } }),
      prisma.demandForecast.count({ where: { organizationId: organization.id } }),
    ]);
    
    console.log('\n📊 Data Summary:');
    console.log(`   Products: ${products}`);
    console.log(`   Customers: ${customers}`);
    console.log(`   Invoices: ${invoices}`);
    console.log(`   Forecasts: ${forecasts}`);
    
    if (forecasts > 0) {
      // Show sample forecasts
      const sampleForecasts = await prisma.demandForecast.findMany({
        where: { organizationId: organization.id },
        include: {
          product: true,
          warehouse: true,
        },
        take: 3,
      });
      
      console.log('\n🔮 Sample Forecasts:');
      sampleForecasts.forEach((forecast, index) => {
        console.log(`   ${index + 1}. ${forecast.product.sku} - ${forecast.product.name}`);
        console.log(`      Method: ${forecast.forecastMethod}`);
        console.log(`      Demand: ${forecast.forecastedDemand}`);
        console.log(`      Period: ${forecast.periodStart.toISOString().split('T')[0]} to ${forecast.periodEnd.toISOString().split('T')[0]}`);
        console.log();
      });
    }
    
    // Check API accessibility
    console.log('🌐 API Check:');
    console.log(`   Forecasting API: /api/${organization.slug}/planning/forecasts`);
    console.log(`   UI Page: /${organization.slug}/planning/forecasts`);
    
    if (forecasts === 0) {
      console.log('\n⚠️  No forecast data found!');
      console.log('💡 To create demo forecasts:');
      console.log('   1. Run: npm run demo:company');
      console.log('   2. Or manually create forecasts in the UI');
    } else {
      console.log('\n✅ Forecast data is available!');
      console.log('💡 If UI shows no records, check:');
      console.log('   1. Browser network tab for API errors');
      console.log('   2. Server console logs');
      console.log('   3. Authentication/permissions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();