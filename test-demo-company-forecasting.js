/**
 * Test Forecasting System with Demo Company Inc Data
 * 
 * This script validates the enhanced forecasting system using Demo Company Inc data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import our enhanced services (if they exist)
let ForecastingService, DemandSensingService, LocalizationService;

try {
  ({ ForecastingService } = require('./src/services/planning/forecasting.service'));
  ({ DemandSensingService } = require('./src/services/planning/demand-sensing.service'));  
  ({ LocalizationService } = require('./src/services/planning/localization.service'));
} catch (error) {
  console.log('📝 Note: Enhanced forecasting services not found. Testing basic functionality.');
}

/**
 * Test basic forecasting functionality
 */
async function testBasicForecasting(organization) {
  console.log('\n🧪 Testing Basic Forecasting...');
  
  // Get some products to test
  const products = await prisma.product.findMany({
    where: { organizationId: organization.id },
    take: 3,
  });
  
  if (products.length === 0) {
    console.log('❌ No products found for testing');
    return;
  }
  
  for (const product of products) {
    console.log(`\n📦 Testing product: ${product.sku} - ${product.name}`);
    
    // Get historical sales data
    const salesData = await prisma.invoiceItem.findMany({
      where: {
        product: { id: product.id },
        invoice: { organizationId: organization.id },
      },
      include: {
        invoice: true,
      },
      orderBy: { invoice: { invoiceDate: 'desc' } },
      take: 100,
    });
    
    console.log(`   📊 Found ${salesData.length} sales records`);
    
    if (salesData.length >= 10) {
      // Calculate basic statistics
      const totalQuantity = salesData.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      const avgQuantity = totalQuantity / salesData.length;
      const avgRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.total), 0) / salesData.length;
      
      console.log(`   📈 Average quantity per sale: ${avgQuantity.toFixed(2)}`);
      console.log(`   💰 Average revenue per sale: $${avgRevenue.toFixed(2)}`);
      
      // Calculate simple moving average for next period
      const recentSales = salesData.slice(0, 6);
      const recentAvg = recentSales.reduce((sum, item) => sum + parseFloat(item.quantity), 0) / recentSales.length;
      console.log(`   🔮 6-period moving average: ${recentAvg.toFixed(2)}`);
      
      // Check seasonality (group by month)
      const monthlyData = {};
      salesData.forEach(item => {
        const month = item.invoice.invoiceDate.getMonth() + 1;
        if (!monthlyData[month]) monthlyData[month] = [];
        monthlyData[month].push(parseFloat(item.quantity));
      });
      
      const monthlyAvg = {};
      Object.keys(monthlyData).forEach(month => {
        monthlyAvg[month] = monthlyData[month].reduce((a, b) => a + b, 0) / monthlyData[month].length;
      });
      
      console.log(`   📅 Monthly patterns available: ${Object.keys(monthlyAvg).length} months`);
      
    } else {
      console.log('   ⚠️ Insufficient data for reliable forecasting (need at least 10 records)');
    }
  }
}

/**
 * Test enhanced forecasting services if available
 */
async function testEnhancedForecasting(organization) {
  if (!ForecastingService || !DemandSensingService || !LocalizationService) {
    console.log('\n📝 Enhanced forecasting services not available - run basic tests only');
    return;
  }
  
  console.log('\n🚀 Testing Enhanced Forecasting Services...');
  
  try {
    // Initialize services
    const localizationService = new LocalizationService();
    const demandSensingService = new DemandSensingService(localizationService);
    const forecastingService = new ForecastingService(demandSensingService, localizationService);
    
    // Get a product for testing
    const product = await prisma.product.findFirst({
      where: { organizationId: organization.id },
    });
    
    if (!product) {
      console.log('❌ No product found for enhanced testing');
      return;
    }
    
    console.log(`\n📦 Testing enhanced forecasting for: ${product.sku} - ${product.name}`);
    
    // Test demand sensing
    console.log('🔍 Testing demand sensing...');
    const demandInsights = await demandSensingService.analyzeDemandPatterns(
      product.id,
      organization.id,
      24 // 24 months
    );
    
    console.log(`   ✅ Demand insights: ${JSON.stringify(demandInsights, null, 2)}`);
    
    // Test localization for US
    console.log('🌍 Testing US localization...');
    const usHolidays = localizationService.getBusinessCalendar('US');
    const currentDate = new Date();
    const adjustment = localizationService.calculateDemandAdjustment('US', currentDate);
    
    console.log(`   📅 US business calendar loaded: ${usHolidays ? 'Yes' : 'No'}`);
    console.log(`   📈 Current demand adjustment: ${adjustment}`);
    
    // Test forecasting methods
    console.log('🔮 Testing forecasting methods...');
    
    const methods = ['MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'LINEAR_REGRESSION'];
    
    for (const method of methods) {
      try {
        const forecast = await forecastingService.generateForecast({
          productId: product.id,
          organizationId: organization.id,
          method,
          periods: 6,
          startDate: new Date(),
        });
        
        console.log(`   ✅ ${method}: Forecast generated successfully`);
        console.log(`      Quantity: ${forecast.quantity}, Confidence: ${forecast.confidence}%`);
        
      } catch (error) {
        console.log(`   ❌ ${method}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Enhanced forecasting test error:', error.message);
  }
}

/**
 * Test API endpoints if server is running
 */
async function testAPIEndpoints(organization) {
  console.log('\n🌐 Testing API Endpoints...');
  
  try {
    const fetch = require('node-fetch');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiBase = `${baseUrl}/api/${organization.slug}/planning/forecasts`;
    
    // Test methods endpoint
    console.log('🔍 Testing forecast methods endpoint...');
    const methodsResponse = await fetch(`${apiBase}?action=methods`);
    
    if (methodsResponse.ok) {
      const methods = await methodsResponse.json();
      console.log(`   ✅ Available methods: ${methods.join(', ')}`);
    } else {
      console.log(`   ⚠️ Methods endpoint returned: ${methodsResponse.status}`);
    }
    
    // Test recommendations (need a product ID)
    const product = await prisma.product.findFirst({
      where: { organizationId: organization.id },
    });
    
    if (product) {
      console.log('💡 Testing forecast recommendations...');
      const recoResponse = await fetch(`${apiBase}?action=recommendations&productId=${product.id}`);
      
      if (recoResponse.ok) {
        const recommendations = await recoResponse.json();
        console.log(`   ✅ Recommendations generated for ${product.sku}`);
      } else {
        console.log(`   ⚠️ Recommendations endpoint returned: ${recoResponse.status}`);
      }
    }
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('   📝 node-fetch not available - skip API tests');
      console.log('   💡 To test APIs: npm install node-fetch, then start the server');
    } else {
      console.log(`   ⚠️ API test error: ${error.message}`);
    }
  }
}

/**
 * Validate existing forecast data
 */
async function validateExistingForecasts(organization) {
  console.log('\n📊 Validating Existing Forecasts...');
  
  const forecasts = await prisma.demandForecast.findMany({
    where: { organizationId: organization.id },
    include: {
      product: true,
      warehouse: true,
    },
  });
  
  console.log(`   📈 Found ${forecasts.length} existing forecasts`);
  
  forecasts.forEach((forecast, index) => {
    console.log(`\n   ${index + 1}. ${forecast.product.sku} - ${forecast.product.name}`);
    console.log(`      Method: ${forecast.forecastMethod}`);
    console.log(`      Period: ${forecast.periodStart.toISOString().split('T')[0]} to ${forecast.periodEnd.toISOString().split('T')[0]}`);
    console.log(`      Forecasted Demand: ${forecast.forecastedDemand}`);
    console.log(`      Confidence Level: ${forecast.confidenceLevel}%`);
    if (forecast.accuracy) {
      console.log(`      Accuracy: ${forecast.accuracy}%`);
    }
    if (forecast.warehouse) {
      console.log(`      Warehouse: ${forecast.warehouse.name}`);
    }
  });
}

/**
 * Main test function
 */
async function main() {
  try {
    console.log('🧪 Testing Demo Company Inc Forecasting System\n');
    
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
      console.log('💡 Run setup-demo-company-data.js first to create demo data');
      return;
    }
    
    console.log(`🏢 Testing with: ${organization.name}`);
    console.log(`   Country: ${organization.homeCountry || 'Not set'}`);
    console.log(`   Currency: ${organization.baseCurrency || 'Not set'}`);
    
    // Run all tests
    await testBasicForecasting(organization);
    await testEnhancedForecasting(organization);
    await validateExistingForecasts(organization);
    await testAPIEndpoints(organization);
    
    console.log('\n🎉 Testing Completed!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Demo data is ready for testing');
    console.log('2. 🚀 Start your Next.js server: npm run dev');
    console.log('3. 🌐 Test the forecasting UI in your browser');
    console.log('4. 📊 Try different forecasting methods and scenarios');
    console.log('5. 🔍 Verify US business patterns in the generated data');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testBasicForecasting,
  testEnhancedForecasting,
  validateExistingForecasts,
};