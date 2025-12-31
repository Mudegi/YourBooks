/**
 * Demo Data Seeder for Enhanced Forecasting System
 * 
 * Creates realistic test data for Uganda-based retail/distribution company
 * to demonstrate the enhanced forecasting capabilities including:
 * - Multi-dimensional product catalog
 * - Historical sales data with seasonal patterns
 * - Branch/warehouse structure
 * - Customer segments
 * - 24 months of realistic InvoiceLine data
 * - Sample forecast scenarios
 * 
 * Usage: node seed-demo-forecasting-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Demo company: Uganda Premium Distributors Ltd (example of Uganda localization)
const DEMO_ORG = {
  slug: 'uganda-premium-dist',
  name: 'Uganda Premium Distributors Ltd',
  description: 'Leading distributor of consumer goods across Uganda',
  country: 'UG', // Configurable country code
  currency: 'UGX',
  timeZone: 'Africa/Kampala',
};

// Product categories with configurable seasonal patterns
// These patterns would be loaded from localization configuration in production
const PRODUCT_CATEGORIES = [
  {
    name: 'Food & Beverages',
    seasonal: true,
    peakMonths: [12, 1, 7, 8], // Holiday seasons and mid-year
    products: [
      { sku: 'FB001', name: 'Coca-Cola 500ml', basePrice: 2500, category: 'Beverages' },
      { sku: 'FB002', name: 'Bell Lager 500ml', basePrice: 3500, category: 'Alcoholic Beverages' },
      { sku: 'FB003', name: 'Rice (Super) 25kg', basePrice: 125000, category: 'Staple Foods' },
      { sku: 'FB004', name: 'Sugar (Kakira) 2kg', basePrice: 12000, category: 'Basic Commodities' },
      { sku: 'FB005', name: 'Cooking Oil 2L', basePrice: 18000, category: 'Cooking Essentials' },
      { sku: 'FB006', name: 'Matooke (per bunch)', basePrice: 8000, category: 'Fresh Produce' },
      { sku: 'FB007', name: 'Coffee (Bugisu) 250g', basePrice: 15000, category: 'Local Products' },
    ]
  },
  {
    name: 'Personal Care',
    seasonal: false,
    peakMonths: [],
    products: [
      { sku: 'PC001', name: 'Colgate Toothpaste', basePrice: 7500, category: 'Oral Care' },
      { sku: 'PC002', name: 'Nivea Body Lotion', basePrice: 12000, category: 'Skin Care' },
      { sku: 'PC003', name: 'Always Pads (Pack)', basePrice: 8500, category: 'Feminine Care' },
      { sku: 'PC004', name: 'Dettol Soap 110g', basePrice: 3500, category: 'Bath & Body' },
    ]
  },
  {
    name: 'Household Items',
    seasonal: true,
    peakMonths: [3, 4, 9, 10], // Cleaning seasons
    products: [
      { sku: 'HH001', name: 'OMO Washing Powder 2kg', basePrice: 22000, category: 'Laundry' },
      { sku: 'HH002', name: 'Vim Cleaning Powder', basePrice: 4500, category: 'Cleaning' },
      { sku: 'HH003', name: 'Toilet Paper (4-pack)', basePrice: 6000, category: 'Paper Products' },
      { sku: 'HH004', name: 'Mosquito Coils (10pk)', basePrice: 3500, category: 'Pest Control' },
    ]
  },
  {
    name: 'Electronics',
    seasonal: true,
    peakMonths: [11, 12, 1], // Holiday season
    products: [
      { sku: 'EL001', name: 'Samsung Phone Charger', basePrice: 25000, category: 'Mobile Accessories' },
      { sku: 'EL002', name: 'LED Torch', basePrice: 15000, category: 'Lighting' },
      { sku: 'EL003', name: 'Radio (Small)', basePrice: 45000, category: 'Audio' },
      { sku: 'EL004', name: 'Power Bank 10000mAh', basePrice: 65000, category: 'Power Solutions' },
    ]
  }
];

// Branch/Warehouse locations across Uganda
const LOCATIONS = [
  {
    name: 'Kampala Central Branch',
    type: 'BRANCH',
    code: 'KLA-CTR',
    address: 'Plot 15 Kampala Road, Kampala',
    region: 'Central',
    isHeadquarters: true,
  },
  {
    name: 'Kampala Main Warehouse',
    type: 'WAREHOUSE', 
    code: 'KLA-WH1',
    address: 'Industrial Area, Kampala',
    region: 'Central',
    isHeadquarters: false,
  },
  {
    name: 'Jinja Branch',
    type: 'BRANCH',
    code: 'JJA-BR1',
    address: 'Main Street, Jinja',
    region: 'Eastern',
    isHeadquarters: false,
  },
  {
    name: 'Mbarara Branch', 
    type: 'BRANCH',
    code: 'MBR-BR1',
    address: 'High Street, Mbarara',
    region: 'Western',
    isHeadquarters: false,
  },
  {
    name: 'Gulu Branch',
    type: 'BRANCH', 
    code: 'GUL-BR1',
    address: 'Churchill Drive, Gulu',
    region: 'Northern',
    isHeadquarters: false,
  },
];

// Customer segments for targeted forecasting
const CUSTOMER_SEGMENTS = [
  {
    name: 'Retail Shops',
    description: 'Small retail shops and kiosks',
    discountRate: 0.05,
    paymentTerms: 30,
  },
  {
    name: 'Supermarkets',
    description: 'Medium to large supermarkets',
    discountRate: 0.12,
    paymentTerms: 45,
  },
  {
    name: 'Wholesale Distributors',
    description: 'Secondary distributors',
    discountRate: 0.18,
    paymentTerms: 60,
  },
  {
    name: 'Institutional',
    description: 'Schools, hospitals, hotels',
    discountRate: 0.08,
    paymentTerms: 30,
  },
];

// Configurable business events - these would come from localization service in production
// This is just example data for Uganda, the system supports any country through configuration
const DEMO_LOCALIZATION_EVENTS = [
  // Religious holidays
  { month: 1, day: 1, name: 'New Year', impact: 1.4 },
  { month: 4, day: 18, name: 'Easter', impact: 1.3 },
  { month: 5, day: 1, name: 'Labour Day', impact: 1.2 },
  { month: 6, day: 3, name: 'Martyrs Day', impact: 1.25 },
  { month: 6, day: 9, name: 'Heroes Day', impact: 1.15 },
  { month: 10, day: 9, name: 'Independence Day', impact: 1.35 },
  { month: 12, day: 25, name: 'Christmas', impact: 1.5 },
  { month: 12, day: 26, name: 'Boxing Day', impact: 1.3 },
  
  // Harvest seasons (increased food demand)
  { month: 3, day: 15, name: 'March Harvest', impact: 0.85 }, // Lower demand during harvest
  { month: 9, day: 15, name: 'September Harvest', impact: 0.85 },
  
  // School terms (increased institutional demand)
  { month: 2, day: 1, name: 'School Term Start', impact: 1.1 },
  { month: 5, day: 1, name: 'School Term Start', impact: 1.1 },
  { month: 9, day: 1, name: 'School Term Start', impact: 1.1 },
];

/**
 * Generate realistic sales data with seasonal patterns
 */
function generateSalesData(product, baseQuantity, month, year, locationMultiplier = 1) {
  let quantity = baseQuantity;
  
  // Apply seasonal patterns
  const category = PRODUCT_CATEGORIES.find(cat => 
    cat.products.some(p => p.sku === product.sku)
  );
  
  if (category && category.seasonal && category.peakMonths.includes(month)) {
    quantity *= (1.2 + Math.random() * 0.3); // 20-50% increase in peak months
  }
  
  // Apply configurable localization events
  const event = DEMO_LOCALIZATION_EVENTS.find(e => e.month === month);
  if (event) {
    quantity *= event.impact;
  }
  
  // Apply location-based multiplier
  quantity *= locationMultiplier;
  
  // Add random variation (±20%)
  quantity *= (0.8 + Math.random() * 0.4);
  
  // Apply growth trend (2-5% annual growth)
  const monthsFromStart = (year - 2023) * 12 + month;
  const growthRate = 0.02 + Math.random() * 0.03; // 2-5% annual
  quantity *= Math.pow(1 + growthRate/12, monthsFromStart);
  
  return Math.max(1, Math.round(quantity));
}

/**
 * Generate demo customers across segments
 */
async function createCustomers(organizationId, customerSegments) {
  const customers = [];
  
  const customerData = [
    // Retail Shops
    { name: 'Nakasero Mini Shop', segment: 'Retail Shops', location: 'Kampala' },
    { name: 'Wandegeya General Store', segment: 'Retail Shops', location: 'Kampala' },
    { name: 'Jinja Road Kiosk', segment: 'Retail Shops', location: 'Jinja' },
    { name: 'Mbarara Center Shop', segment: 'Retail Shops', location: 'Mbarara' },
    
    // Supermarkets
    { name: 'Capital Shoppers Kampala', segment: 'Supermarkets', location: 'Kampala' },
    { name: 'Jinja Super Center', segment: 'Supermarkets', location: 'Jinja' },
    { name: 'Mbarara Fresh Market', segment: 'Supermarkets', location: 'Mbarara' },
    
    // Wholesale
    { name: 'Eastern Distributors Ltd', segment: 'Wholesale Distributors', location: 'Jinja' },
    { name: 'Western Supply Co', segment: 'Wholesale Distributors', location: 'Mbarara' },
    
    // Institutional
    { name: 'Makerere University', segment: 'Institutional', location: 'Kampala' },
    { name: 'Mulago Hospital', segment: 'Institutional', location: 'Kampala' },
    { name: 'Gulu Regional Hospital', segment: 'Institutional', location: 'Gulu' },
  ];
  
  for (const custData of customerData) {
    const segment = customerSegments.find(s => s.name === custData.segment);
    
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: custData.name,
        email: `${custData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: `+256${Math.floor(700000000 + Math.random() * 99999999)}`,
        address: `${custData.location}, Uganda`,
        customerType: 'BUSINESS',
        status: 'ACTIVE',
        customerSegmentId: segment.id,
      },
    });
    
    customers.push(customer);
  }
  
  return customers;
}

/**
 * Main seeding function
 */
async function seedDemoData() {
  console.log('🌱 Starting demo data seeding for Enhanced Forecasting System...');
  
  try {
    // 1. Create demo organization
    console.log('📊 Creating demo organization...');
    const organization = await prisma.organization.create({
      data: {
        ...DEMO_ORG,
        address: 'Plot 42 Industrial Area, Kampala, Uganda',
        phone: '+256414123456',
        email: 'info@ugandapremium.co.ug',
        website: 'https://ugandapremium.co.ug',
        registrationNumber: 'UG-12345678',
        taxNumber: '1001234567',
        status: 'ACTIVE',
      },
    });
    
    console.log(`✅ Created organization: ${organization.name} (ID: ${organization.id})`);
    
    // 2. Create customer segments
    console.log('👥 Creating customer segments...');
    const customerSegments = [];
    for (const segmentData of CUSTOMER_SEGMENTS) {
      const segment = await prisma.customerSegment.create({
        data: {
          ...segmentData,
          organizationId: organization.id,
          status: 'ACTIVE',
        },
      });
      customerSegments.push(segment);
      console.log(`✅ Created segment: ${segment.name}`);
    }
    
    // 3. Create branches and warehouses
    console.log('🏢 Creating branches and warehouses...');
    const locations = [];
    for (const locationData of LOCATIONS) {
      const location = await prisma[locationData.type.toLowerCase()].create({
        data: {
          organizationId: organization.id,
          name: locationData.name,
          code: locationData.code,
          address: locationData.address,
          phone: `+256${Math.floor(700000000 + Math.random() * 99999999)}`,
          status: 'ACTIVE',
          ...(locationData.type === 'WAREHOUSE' && {
            capacity: 10000 + Math.random() * 40000,
            utilizationPercentage: 60 + Math.random() * 30,
          }),
        },
      });
      locations.push({ ...location, type: locationData.type, region: locationData.region });
      console.log(`✅ Created ${locationData.type}: ${location.name}`);
    }
    
    // 4. Create products
    console.log('📦 Creating products...');
    const products = [];
    for (const category of PRODUCT_CATEGORIES) {
      for (const productData of category.products) {
        const product = await prisma.product.create({
          data: {
            organizationId: organization.id,
            name: productData.name,
            sku: productData.sku,
            description: `High-quality ${productData.name} - ${category.name}`,
            category: productData.category,
            subCategory: category.name,
            unitPrice: productData.basePrice,
            costPrice: productData.basePrice * 0.7, // 30% margin
            minStockLevel: 50 + Math.random() * 150,
            maxStockLevel: 500 + Math.random() * 1500,
            reorderPoint: 100 + Math.random() * 200,
            unit: productData.sku.startsWith('FB') ? 'pieces' : 'units',
            status: 'ACTIVE',
            trackInventory: true,
            taxRate: 0.18, // Uganda VAT
          },
        });
        products.push({
          ...product,
          seasonal: category.seasonal,
          peakMonths: category.peakMonths,
        });
        console.log(`✅ Created product: ${product.sku} - ${product.name}`);
      }
    }
    
    // 5. Create customers
    console.log('🤝 Creating customers...');
    const customers = await createCustomers(organization.id, customerSegments);
    console.log(`✅ Created ${customers.length} customers`);
    
    // 6. Generate 24 months of historical sales data
    console.log('📈 Generating 24 months of historical sales data...');
    
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');
    
    // Location multipliers based on region size
    const locationMultipliers = {
      'Central': 1.5,  // Kampala area - highest
      'Eastern': 1.0,  // Average
      'Western': 0.8,  // Lower
      'Northern': 0.6, // Lowest
    };
    
    let invoiceNumber = 1001;
    
    for (let year = 2023; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
        if (year === 2025 && month > 12) break; // Don't go beyond current date
        
        console.log(`   Generating data for ${year}-${month.toString().padStart(2, '0')}...`);
        
        // Generate 15-45 invoices per month per location
        for (const location of locations.filter(l => l.type === 'BRANCH')) {
          const invoiceCount = 15 + Math.floor(Math.random() * 30);
          
          for (let i = 0; i < invoiceCount; i++) {
            // Random date within the month
            const day = Math.floor(1 + Math.random() * 28);
            const invoiceDate = new Date(year, month - 1, day);
            
            // Random customer (biased towards local customers)
            const localCustomers = customers.filter(c => 
              c.address.includes(location.region) || 
              (location.region === 'Central' && Math.random() < 0.7)
            );
            
            const customer = localCustomers.length > 0 ? 
              localCustomers[Math.floor(Math.random() * localCustomers.length)] :
              customers[Math.floor(Math.random() * customers.length)];
            
            // Create invoice
            const invoice = await prisma.invoice.create({
              data: {
                organizationId: organization.id,
                branchId: location.id,
                customerId: customer.id,
                invoiceNumber: `INV-${invoiceNumber++}`,
                invoiceDate,
                dueDate: new Date(invoiceDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
                status: Math.random() < 0.95 ? 'PAID' : 'PENDING', // 95% paid
                subtotal: 0, // Will be updated after line items
                taxAmount: 0,
                totalAmount: 0,
                currency: 'UGX',
                exchangeRate: 1,
                paymentTerms: 30,
                notes: `Generated sales data for ${month}/${year}`,
              },
            });
            
            // Add 1-8 line items per invoice
            const lineItemCount = 1 + Math.floor(Math.random() * 7);
            let subtotal = 0;
            
            for (let j = 0; j < lineItemCount; j++) {
              const product = products[Math.floor(Math.random() * products.length)];
              const locationMultiplier = locationMultipliers[location.region] || 1;
              
              // Base quantity varies by product type
              let baseQuantity;
              if (product.sku.startsWith('FB')) { // Food & Beverages
                baseQuantity = 10 + Math.random() * 50;
              } else if (product.sku.startsWith('HH')) { // Household
                baseQuantity = 5 + Math.random() * 25;
              } else if (product.sku.startsWith('PC')) { // Personal Care
                baseQuantity = 3 + Math.random() * 15;
              } else { // Electronics
                baseQuantity = 1 + Math.random() * 8;
              }
              
              const quantity = generateSalesData(
                product, 
                baseQuantity, 
                month, 
                year, 
                locationMultiplier
              );
              
              const unitPrice = product.unitPrice * (0.9 + Math.random() * 0.2); // ±10% price variation
              const lineTotal = quantity * unitPrice;
              
              await prisma.invoiceLine.create({
                data: {
                  invoiceId: invoice.id,
                  productId: product.id,
                  quantity,
                  unitPrice,
                  lineTotal,
                  taxRate: 0.18,
                  taxAmount: lineTotal * 0.18,
                  description: product.name,
                },
              });
              
              subtotal += lineTotal;
            }
            
            // Update invoice totals
            const taxAmount = subtotal * 0.18;
            const totalAmount = subtotal + taxAmount;
            
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                subtotal,
                taxAmount,
                totalAmount,
              },
            });
          }
        }
      }
    }
    
    console.log('✅ Generated 24 months of historical sales data');
    
    // 7. Create sample forecast scenarios
    console.log('🔮 Creating sample forecast scenarios...');
    
    const scenarios = [
      {
        name: 'Conservative Growth',
        description: 'Conservative forecast based on historical trends',
        assumptions: 'Assumes 5% annual growth with seasonal adjustments',
        isBaseline: true,
      },
      {
        name: 'Optimistic Expansion', 
        description: 'Aggressive growth scenario with market expansion',
        assumptions: 'Assumes 15% growth with new market penetration',
        isBaseline: false,
      },
      {
        name: 'Economic Downturn',
        description: 'Conservative scenario accounting for economic challenges',
        assumptions: 'Assumes -5% growth due to economic headwinds',
        isBaseline: false,
      },
    ];
    
    const forecastScenarios = [];
    for (const scenarioData of scenarios) {
      const scenario = await prisma.forecastScenario.create({
        data: {
          ...scenarioData,
          organizationId: organization.id,
          status: 'ACTIVE',
        },
      });
      forecastScenarios.push(scenario);
      console.log(`✅ Created forecast scenario: ${scenario.name}`);
    }
    
    // 8. Create sample demand forecasts using our basic model
    console.log('📊 Creating sample demand forecasts...');
    
    const forecastMethods = ['MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'LINEAR_REGRESSION'];
    const sampleProducts = products.slice(0, 8); // First 8 products
    const mainWarehouse = locations.find(l => l.type === 'WAREHOUSE');
    
    for (const product of sampleProducts) {
      for (let i = 0; i < 2; i++) { // 2 forecasts per product
        const method = forecastMethods[Math.floor(Math.random() * forecastMethods.length)];
        const periodStart = new Date('2025-01-01');
        const periodEnd = new Date('2025-12-31');
        
        // Generate realistic forecast based on product history
        const baseMonthlyForecast = 100 + Math.random() * 500;
        const confidenceLevel = 0.85 + Math.random() * 0.1; // 85-95%
        
        await prisma.demandForecast.create({
          data: {
            organizationId: organization.id,
            productId: product.id,
            warehouseId: mainWarehouse?.id,
            periodStart,
            periodEnd,
            forecastMethod: method,
            forecastQuantity: Math.round(baseMonthlyForecast * 12), // Annual forecast
            confidenceLower: Math.round(baseMonthlyForecast * 12 * 0.85),
            confidenceUpper: Math.round(baseMonthlyForecast * 12 * 1.15),
            accuracy: i === 1 ? (0.75 + Math.random() * 0.2) : null, // Some have accuracy data
            notes: `Sample ${method} forecast for ${product.name} generated by demo seeder`,
          },
        });
        
        console.log(`✅ Created forecast for ${product.sku} using ${method}`);
      }
    }
    
    // 9. Create demo user for testing
    console.log('👤 Creating demo users...');
    
    const demoUsers = [
      {
        email: 'demo.manager@ugandapremium.co.ug',
        name: 'Demo Manager',
        role: 'MANAGER',
      },
      {
        email: 'demo.planner@ugandapremium.co.ug', 
        name: 'Demo Planner',
        role: 'EMPLOYEE',
      },
    ];
    
    for (const userData of demoUsers) {
      try {
        await prisma.user.create({
          data: {
            ...userData,
            password: 'hashed_demo_password', // In real app, this would be properly hashed
            status: 'ACTIVE',
            organizationId: organization.id,
          },
        });
        console.log(`✅ Created demo user: ${userData.email}`);
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore unique constraint errors
          throw error;
        }
        console.log(`⚠️ User ${userData.email} already exists, skipping...`);
      }
    }
    
    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Organization: ${organization.name}`);
    console.log(`   Products: ${products.length} items across ${PRODUCT_CATEGORIES.length} categories`);
    console.log(`   Locations: ${locations.length} (branches and warehouses)`);
    console.log(`   Customer Segments: ${customerSegments.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Historical Data: 24 months (2023-2024) of realistic sales data`);
    console.log(`   Forecast Scenarios: ${forecastScenarios.length}`);
    console.log(`   Sample Forecasts: ${sampleProducts.length * 2} forecasts using different methods`);
    console.log(`\n🧪 Test the Enhanced Forecasting System:`);
    console.log(`   1. Organization Slug: ${organization.slug}`);
    console.log(`   2. Login: demo.manager@ugandapremium.co.ug`);
    console.log(`   3. API Endpoint: /api/${organization.slug}/planning/forecasts`);
    console.log(`   4. Sample Product IDs: ${sampleProducts.slice(0, 3).map(p => p.id).join(', ')}`);
    console.log(`\n🌍 Configurable Localization Features Included (Demo: Uganda):`);
    console.log(`   - Seasonal patterns (harvest seasons, holidays)`);
    console.log(`   - Regional demand variations (Central, Eastern, Western, Northern)`);
    console.log(`   - Local holidays and events impact on sales`);
    console.log(`   - Currency in UGX with realistic pricing`);
    console.log(`   - Local business context (matooke, coffee, regional preferences)`);
    console.log(`   - System supports any country through localization service`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Additional utility functions for testing
 */

async function cleanupDemoData() {
  console.log('🧹 Cleaning up existing demo data...');
  
  try {
    // Find demo organization
    const demoOrg = await prisma.organization.findUnique({
      where: { slug: DEMO_ORG.slug },
    });
    
    if (!demoOrg) {
      console.log('No demo data found to clean up.');
      return;
    }
    
    // Delete all related data (Prisma will handle cascading deletes)
    await prisma.organization.delete({
      where: { id: demoOrg.id },
    });
    
    console.log('✅ Demo data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up demo data:', error);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    cleanupDemoData();
  } else {
    seedDemoData();
  }
}

module.exports = {
  seedDemoData,
  cleanupDemoData,
  DEMO_ORG,
  PRODUCT_CATEGORIES,
  LOCATIONS,
  CUSTOMER_SEGMENTS,
};