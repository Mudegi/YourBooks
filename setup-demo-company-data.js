/**
 * Check and Setup Demo Data for "Demo Company Inc."
 * 
 * This script checks if "Demo Company Inc." exists in the database
 * and creates comprehensive demo data for testing the enhanced
 * forecasting system with US-based business context.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDemoCompany() {
  console.log('🔍 Checking for Demo Company Inc...\n');
  
  try {
    // Search for Demo Company Inc
    const demoCompanies = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'Demo Company Inc' } },
          { name: { contains: 'Demo Company' } },
          { slug: { contains: 'demo-company' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        homeCountry: true,
        baseCurrency: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (demoCompanies.length === 0) {
      console.log('❌ No Demo Company Inc found in database');
      console.log('📋 Available organizations:');
      
      const allOrgs = await prisma.organization.findMany({
        select: { name: true, slug: true },
        take: 10,
      });
      
      allOrgs.forEach((org, index) => {
        console.log(`   ${index + 1}. ${org.name} (${org.slug})`);
      });
      
      console.log('\n💡 Would you like to:');
      console.log('   1. Create "Demo Company Inc" organization');
      console.log('   2. Use existing organization for demo data');
      
      return null;
    }

    // Found demo company(ies)
    console.log(`✅ Found ${demoCompanies.length} Demo Company organization(s):`);
    demoCompanies.forEach((org, index) => {
      console.log(`\n   ${index + 1}. ${org.name}`);
      console.log(`      Slug: ${org.slug}`);
      console.log(`      Country: ${org.homeCountry || 'Not set'}`);
      console.log(`      Currency: ${org.baseCurrency || 'Not set'}`);
      console.log(`      Status: ${org.isActive ? 'Active' : 'Inactive'}`);
      console.log(`      Created: ${org.createdAt.toISOString().split('T')[0]}`);
    });

    return demoCompanies[0]; // Return the first one
    
  } catch (error) {
    console.error('❌ Error checking demo company:', error);
    throw error;
  }
}

// US-focused product catalog for Demo Company Inc
const DEMO_COMPANY_PRODUCTS = [
  // Office Supplies Category
  {
    category: 'Office Supplies',
    seasonal: false,
    peakMonths: [8, 9], // Back to school
    products: [
      { sku: 'OFF001', name: 'A4 Paper (500 sheets)', basePrice: 12.99, category: 'Paper Products' },
      { sku: 'OFF002', name: 'Ballpoint Pens (12-pack)', basePrice: 8.99, category: 'Writing Supplies' },
      { sku: 'OFF003', name: 'Stapler Heavy Duty', basePrice: 24.99, category: 'Office Equipment' },
      { sku: 'OFF004', name: 'File Folders (25-pack)', basePrice: 15.99, category: 'Filing Supplies' },
      { sku: 'OFF005', name: 'Highlighter Set', basePrice: 11.99, category: 'Writing Supplies' },
    ]
  },
  // Technology Category
  {
    category: 'Technology',
    seasonal: true,
    peakMonths: [11, 12, 1], // Holiday season
    products: [
      { sku: 'TECH001', name: 'USB Cable 6ft', basePrice: 14.99, category: 'Accessories' },
      { sku: 'TECH002', name: 'Wireless Mouse', basePrice: 29.99, category: 'Computer Peripherals' },
      { sku: 'TECH003', name: 'Bluetooth Speaker', basePrice: 79.99, category: 'Audio Equipment' },
      { sku: 'TECH004', name: 'Phone Case Universal', basePrice: 19.99, category: 'Mobile Accessories' },
      { sku: 'TECH005', name: 'Power Bank 10000mAh', basePrice: 39.99, category: 'Power Solutions' },
    ]
  },
  // Health & Wellness Category
  {
    category: 'Health & Wellness',
    seasonal: true,
    peakMonths: [1, 2, 3], // New Year fitness resolutions
    products: [
      { sku: 'HW001', name: 'Hand Sanitizer 8oz', basePrice: 4.99, category: 'Personal Hygiene' },
      { sku: 'HW002', name: 'Face Masks (50-pack)', basePrice: 24.99, category: 'Safety Equipment' },
      { sku: 'HW003', name: 'Vitamin C Tablets', basePrice: 18.99, category: 'Supplements' },
      { sku: 'HW004', name: 'Fitness Tracker Basic', basePrice: 89.99, category: 'Fitness Equipment' },
    ]
  },
  // Home & Garden Category
  {
    category: 'Home & Garden',
    seasonal: true,
    peakMonths: [4, 5, 6, 7], // Spring/Summer
    products: [
      { sku: 'HG001', name: 'LED Light Bulb (4-pack)', basePrice: 16.99, category: 'Lighting' },
      { sku: 'HG002', name: 'Garden Hose 50ft', basePrice: 34.99, category: 'Garden Equipment' },
      { sku: 'HG003', name: 'Storage Containers Set', basePrice: 28.99, category: 'Organization' },
      { sku: 'HG004', name: 'Air Freshener (6-pack)', basePrice: 12.99, category: 'Home Care' },
    ]
  }
];

// US regions and locations
const DEMO_COMPANY_LOCATIONS = [
  {
    name: 'Demo Company HQ',
    type: 'BRANCH',
    code: 'NYC-HQ',
    address: '123 Business Ave, New York, NY 10001',
    region: 'Northeast',
    isHeadquarters: true,
  },
  {
    name: 'Demo Warehouse East',
    type: 'WAREHOUSE',
    code: 'NYC-WH1',
    address: '456 Industrial Blvd, Newark, NJ 07102',
    region: 'Northeast',
    isHeadquarters: false,
  },
  {
    name: 'Demo Company West',
    type: 'BRANCH',
    code: 'LAX-BR1',
    address: '789 Commerce St, Los Angeles, CA 90210',
    region: 'West',
    isHeadquarters: false,
  },
  {
    name: 'Demo Company South',
    type: 'BRANCH',
    code: 'ATL-BR1',
    address: '321 Trade Center Dr, Atlanta, GA 30303',
    region: 'Southeast',
    isHeadquarters: false,
  },
  {
    name: 'Demo Company Midwest',
    type: 'BRANCH',
    code: 'CHI-BR1',
    address: '654 Market Plaza, Chicago, IL 60601',
    region: 'Midwest',
    isHeadquarters: false,
  },
];

// US customer segments
const DEMO_COMPANY_CUSTOMER_SEGMENTS = [
  {
    name: 'Small Business',
    description: 'Small businesses and startups',
    discountRate: 0.08,
    paymentTerms: 30,
  },
  {
    name: 'Enterprise',
    description: 'Large enterprises and corporations',
    discountRate: 0.15,
    paymentTerms: 45,
  },
  {
    name: 'Government',
    description: 'Government agencies and institutions',
    discountRate: 0.12,
    paymentTerms: 60,
  },
  {
    name: 'Educational',
    description: 'Schools, universities, and educational institutions',
    discountRate: 0.20,
    paymentTerms: 30,
  },
];

// US business events affecting demand
const US_BUSINESS_EVENTS = [
  { month: 1, day: 1, name: 'New Year', impact: 1.3 },
  { month: 2, day: 14, name: 'Valentine\'s Day', impact: 1.1 },
  { month: 3, day: 17, name: 'St. Patrick\'s Day', impact: 1.05 },
  { month: 7, day: 4, name: 'Independence Day', impact: 1.4 },
  { month: 9, day: 1, name: 'Labor Day', impact: 1.2 },
  { month: 10, day: 31, name: 'Halloween', impact: 1.15 },
  { month: 11, day: 24, name: 'Thanksgiving', impact: 1.6 },
  { month: 12, day: 25, name: 'Christmas', impact: 1.5 },
  
  // Business seasons
  { month: 8, day: 15, name: 'Back to School Season', impact: 1.25 },
  { month: 11, day: 25, name: 'Black Friday', impact: 1.8 },
  { month: 12, day: 26, name: 'Post-Holiday Returns', impact: 0.8 },
];

/**
 * Generate US-focused sales data with business patterns
 */
function generateUSBusinessData(product, baseQuantity, month, year, locationMultiplier = 1) {
  let quantity = baseQuantity;
  
  // Apply seasonal patterns
  const category = DEMO_COMPANY_PRODUCTS.find(cat => 
    cat.products.some(p => p.sku === product.sku)
  );
  
  if (category && category.seasonal && category.peakMonths.includes(month)) {
    quantity *= (1.15 + Math.random() * 0.25); // 15-40% increase in peak months
  }
  
  // Apply US business events
  const event = US_BUSINESS_EVENTS.find(e => e.month === month);
  if (event) {
    quantity *= event.impact;
  }
  
  // Apply location-based multiplier (US regional differences)
  quantity *= locationMultiplier;
  
  // Add random variation (±15%)
  quantity *= (0.85 + Math.random() * 0.3);
  
  // Apply growth trend (3-7% annual growth typical for US business)
  const monthsFromStart = (year - 2023) * 12 + month;
  const growthRate = 0.03 + Math.random() * 0.04; // 3-7% annual
  quantity *= Math.pow(1 + growthRate/12, monthsFromStart);
  
  return Math.max(1, Math.round(quantity));
}

/**
 * Create demo customers for US market
 */
async function createUSCustomers(organizationId, customerSegments) {
  const customers = [];
  
  const customerData = [
    // Small Business
    { name: 'Startup Solutions Inc', segment: 'Small Business', location: 'New York', contact: 'john@startupsolutions.com' },
    { name: 'Local Print Shop', segment: 'Small Business', location: 'Los Angeles', contact: 'mary@localprintshop.com' },
    { name: 'Creative Agency LLC', segment: 'Small Business', location: 'Chicago', contact: 'david@creativeagency.com' },
    { name: 'Tech Consulting Co', segment: 'Small Business', location: 'Atlanta', contact: 'sarah@techconsulting.com' },
    
    // Enterprise
    { name: 'Global Manufacturing Corp', segment: 'Enterprise', location: 'New York', contact: 'procurement@globalmanuf.com' },
    { name: 'Fortune 500 Services', segment: 'Enterprise', location: 'Los Angeles', contact: 'supplies@fortune500.com' },
    { name: 'International Bank Corp', segment: 'Enterprise', location: 'Chicago', contact: 'admin@intlbank.com' },
    
    // Government
    { name: 'City of New York', segment: 'Government', location: 'New York', contact: 'purchasing@nyc.gov' },
    { name: 'State of California', segment: 'Government', location: 'Los Angeles', contact: 'procurement@ca.gov' },
    { name: 'Federal Agency NYC', segment: 'Government', location: 'New York', contact: 'supplies@federal.gov' },
    
    // Educational
    { name: 'Columbia University', segment: 'Educational', location: 'New York', contact: 'procurement@columbia.edu' },
    { name: 'UCLA Extension', segment: 'Educational', location: 'Los Angeles', contact: 'supplies@ucla.edu' },
    { name: 'Chicago Public Schools', segment: 'Educational', location: 'Chicago', contact: 'purchasing@cps.edu' },
    { name: 'Emory University', segment: 'Educational', location: 'Atlanta', contact: 'procurement@emory.edu' },
  ];
  
  for (const custData of customerData) {
    const segment = customerSegments.find(s => s.name === custData.segment);
    
    // Check if customer already exists (by email or company name)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        organizationId,
        OR: [
          { email: custData.contact },
          { companyName: custData.name },
        ],
      },
    });
    
    if (existingCustomer) {
      console.log(`   ⚠️  ${custData.name} already exists, skipping`);
      customers.push(existingCustomer);
      continue;
    }
    
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        companyName: custData.name,
        firstName: custData.name.includes('University') || custData.name.includes('Inc') ? 'Business' : 'John',
        lastName: custData.name.includes('University') || custData.name.includes('Inc') ? 'Contact' : 'Doe',
        email: custData.contact,
        phone: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        billingAddress: { address: `${custData.location}, USA`, country: 'US' },
        region: custData.segment, // Store segment as region
        isActive: true,
        customerNumber: `CUST${String(customers.length + 1001).padStart(4, '0')}`, // Start from 1001 to avoid conflicts
        notes: `Customer segment: ${custData.segment}. ${segment.description}`,
        paymentTerms: segment.paymentTerms,
      },
    });
    
    customers.push(customer);
    console.log(`   ✅ ${custData.name}`);
  }
  
  return customers;
}

/**
 * Create comprehensive demo data for Demo Company Inc
 */
async function createDemoCompanyData(organization) {
  console.log(`\n🚀 Creating comprehensive demo data for ${organization.name}...`);
  
  // Keep existing organization settings (respecting current country/currency)
  const updatedOrg = await prisma.organization.update({
    where: { id: organization.id },
    data: {
      address: organization.address || '123 Business Avenue, Kampala, Uganda',
      phone: organization.phone || '+256-700-123-456',
      email: organization.email || 'info@democompany.com',
    },
  });

  console.log(`✅ Updated organization contact details (preserving ${organization.baseCurrency} currency and ${organization.homeCountry} location)`);

  // 1. Customer segments (will be stored as metadata in customer records)
  console.log('👥 Customer segments will be stored as region/notes in customer records');
  const customerSegments = DEMO_COMPANY_CUSTOMER_SEGMENTS; // Use for reference

  // 2. Create locations (branches and warehouses)
  console.log('🏢 Creating branches and warehouses...');
  const locations = [];
  
  // First create branches (check for existing ones first)
  const branches = DEMO_COMPANY_LOCATIONS.filter(l => l.type === 'BRANCH');
  for (const locationData of branches) {
    // Check if branch already exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        organizationId: organization.id,
        code: locationData.code,
      },
    });
    
    if (existingBranch) {
      console.log(`   ⚠️  BRANCH: ${locationData.name} already exists, skipping`);
      locations.push({ ...existingBranch, type: 'BRANCH', region: locationData.region });
      continue;
    }
    
    const branch = await prisma.branch.create({
      data: {
        organizationId: organization.id,
        name: locationData.name,
        code: locationData.code,
        address: locationData.address,
        phone: `+1-555-${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
        isActive: true,
        isHeadquarters: locationData.isHeadquarters,
        country: 'US',
      },
    });
    locations.push({ ...branch, type: 'BRANCH', region: locationData.region });
    console.log(`   ✅ BRANCH: ${branch.name}`);
  }
  
  // Then create warehouses (using InventoryWarehouse)
  const warehouses = DEMO_COMPANY_LOCATIONS.filter(l => l.type === 'WAREHOUSE');
  for (const locationData of warehouses) {
    // Check if warehouse already exists
    const existingWarehouse = await prisma.inventoryWarehouse.findFirst({
      where: {
        organizationId: organization.id,
        code: locationData.code,
      },
    });
    
    if (existingWarehouse) {
      console.log(`   ⚠️  WAREHOUSE: ${locationData.name} already exists, skipping`);
      locations.push({ ...existingWarehouse, type: 'WAREHOUSE', region: locationData.region });
      continue;
    }
    
    const warehouse = await prisma.inventoryWarehouse.create({
      data: {
        organizationId: organization.id,
        name: locationData.name,
        code: locationData.code,
        address: locationData.address,
        isActive: true,
        type: 'GENERAL',
        branchId: locations.find(l => l.region === locationData.region && l.type === 'BRANCH')?.id,
      },
    });
    locations.push({ ...warehouse, type: 'WAREHOUSE', region: locationData.region });
    console.log(`   ✅ WAREHOUSE: ${warehouse.name}`);
  }

  // 3. Create products
  console.log('📦 Creating product catalog...');
  const products = [];
  for (const category of DEMO_COMPANY_PRODUCTS) {
    for (const productData of category.products) {
      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          organizationId: organization.id,
          sku: productData.sku,
        },
      });
      
      if (existingProduct) {
        console.log(`   ⚠️  ${productData.sku} - ${productData.name} already exists, skipping`);
        products.push({
          ...existingProduct,
          seasonal: category.seasonal,
          peakMonths: category.peakMonths,
        });
        continue;
      }
      
      const product = await prisma.product.create({
        data: {
          organizationId: organization.id,
          name: productData.name,
          sku: productData.sku,
          description: `High-quality ${productData.name} for business and consumer use`,
          productType: 'INVENTORY', // All demo products are inventory items
          category: productData.category,
          purchasePrice: productData.basePrice * 0.6, // 40% margin
          sellingPrice: productData.basePrice,
          reorderLevel: 25 + Math.random() * 75,
          reorderQuantity: 100 + Math.random() * 200,
          isActive: true,
          trackInventory: true,
          taxable: true,
          defaultTaxRate: 8.75, // NYC sales tax as percentage
        },
      });
      products.push({
        ...product,
        seasonal: category.seasonal,
        peakMonths: category.peakMonths,
      });
      console.log(`   ✅ ${product.sku} - ${product.name}`);
    }
  }

  // 4. Create customers
  console.log('🤝 Creating customers...');
  const customers = await createUSCustomers(organization.id, customerSegments);
  console.log(`   ✅ Created ${customers.length} customers across all segments`);

  // 5. Generate 24 months of sales data
  console.log('📈 Generating 24 months of US business sales data...');
  
  let invoiceNumber = 10001;
  
  // Check if we already have invoice data for recent months
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      organizationId: organization.id,
      invoiceDate: {
        gte: new Date('2023-01-01'),
      },
    },
    select: { 
      invoiceDate: true,
      invoiceNumber: true 
    },
  });
  
  if (existingInvoices.length > 0) {
    console.log(`   ⚠️  Found ${existingInvoices.length} existing invoices. Adding new data from current point.`);
    // Get the highest invoice number to continue sequence
    const maxInvoiceNum = existingInvoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''));
      return num > max ? num : max;
    }, 10000);
    invoiceNumber = maxInvoiceNum + 1;
  }
  
  // US regional multipliers
  const locationMultipliers = {
    'Northeast': 1.3,  // High cost of living, higher prices
    'West': 1.2,       // Tech hub, good economy
    'Southeast': 1.0,  // Average
    'Midwest': 0.9,    // Lower cost of living
  };
  const totalInvoicesCreated = [];
  
  for (let year = 2023; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2025 && month > 12) break;
      
      console.log(`   Generating ${year}-${month.toString().padStart(2, '0')}...`);
      
      // Generate 20-60 invoices per month per location
      for (const location of locations.filter(l => l.type === 'BRANCH')) {
        const invoiceCount = 20 + Math.floor(Math.random() * 40);
        
        for (let i = 0; i < invoiceCount; i++) {
          // Random date within month
          const day = Math.floor(1 + Math.random() * 28);
          const invoiceDate = new Date(year, month - 1, day);
          
          // Select customer (bias toward local customers)
          const localCustomers = customers.filter(c => {
            if (!c.billingAddress || typeof c.billingAddress !== 'object') return false;
            const address = c.billingAddress.address || '';
            return address.includes(location.region === 'Northeast' ? 'New York' : 
                                   location.region === 'West' ? 'Los Angeles' :
                                   location.region === 'Southeast' ? 'Atlanta' : 'Chicago');
          });
          
          const customer = localCustomers.length > 0 && Math.random() < 0.7 ?
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
              status: Math.random() < 0.92 ? 'PAID' : 'SENT', // 92% paid rate
              subtotal: 0,
              taxAmount: 0,
              total: 0,
              amountDue: 0,
              currency: organization.baseCurrency,
              exchangeRate: 1,
              notes: `Business sales data for ${month}/${year}`,
            },
          });
          
          // Add line items (1-6 items per invoice)
          const lineItemCount = 1 + Math.floor(Math.random() * 5);
          let subtotal = 0;
          
          for (let j = 0; j < lineItemCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const locationMultiplier = locationMultipliers[location.region] || 1;
            
            // Base quantity varies by product category
            let baseQuantity;
            if (product.sku.startsWith('OFF')) { // Office Supplies
              baseQuantity = 2 + Math.random() * 15;
            } else if (product.sku.startsWith('TECH')) { // Technology
              baseQuantity = 1 + Math.random() * 8;
            } else if (product.sku.startsWith('HW')) { // Health & Wellness
              baseQuantity = 3 + Math.random() * 20;
            } else { // Home & Garden
              baseQuantity = 2 + Math.random() * 12;
            }
            
            const quantity = generateUSBusinessData(
              product,
              baseQuantity,
              month,
              year,
              locationMultiplier
            );
            
            const unitPrice = product.sellingPrice * (0.95 + Math.random() * 0.1); // ±5% price variation
            const lineTotal = quantity * unitPrice;
            
            await prisma.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                productId: product.id,
                description: product.name,
                quantity,
                unitPrice,
                taxRate: 8.75,
                taxAmount: lineTotal * 0.0875,
                total: lineTotal + (lineTotal * 0.0875),
              },
            });
            
            subtotal += lineTotal;
          }
          
          // Update invoice totals
          const taxAmount = subtotal * 0.0875;
          const total = subtotal + taxAmount;
          const amountDue = total; // For unpaid invoices, amount due equals total
          
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              subtotal,
              taxAmount,
              total,
              amountDue: invoice.status === 'PAID' ? 0 : amountDue, // Paid invoices have no amount due
            },
          });
          
          totalInvoicesCreated.push(invoice);
        }
      }
    }
  }

  console.log(`   ✅ Generated ${totalInvoicesCreated.length} invoices with realistic US patterns`);

  // 6. Create sample forecasts
  console.log('🔮 Creating sample forecasts...');
  const forecastMethods = ['MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'LINEAR_REGRESSION'];
  const sampleProducts = products.slice(0, 6);
  const mainWarehouse = locations.find(l => l.type === 'WAREHOUSE');
  
  for (const product of sampleProducts) {
    const method = forecastMethods[Math.floor(Math.random() * forecastMethods.length)];
    const periodStart = new Date('2025-01-01');
    const periodEnd = new Date('2025-12-31');
    
    // Generate realistic forecast based on product category
    let baseMonthlyForecast;
    if (product.sku.startsWith('OFF')) {
      baseMonthlyForecast = 150 + Math.random() * 300; // Office supplies steady demand
    } else if (product.sku.startsWith('TECH')) {
      baseMonthlyForecast = 80 + Math.random() * 200; // Tech products variable
    } else if (product.sku.startsWith('HW')) {
      baseMonthlyForecast = 200 + Math.random() * 400; // Health & wellness consistent
    } else {
      baseMonthlyForecast = 100 + Math.random() * 250; // Home & garden seasonal
    }
    
    await prisma.demandForecast.create({
      data: {
        organizationId: organization.id,
        productId: product.id,
        warehouseId: mainWarehouse?.id,
        forecastPeriod: '2025',
        periodStart,
        periodEnd,
        forecastMethod: method,
        forecastedDemand: Math.round(baseMonthlyForecast * 12),
        confidenceLevel: 85 + Math.random() * 10, // 85-95% confidence
        notes: `Sample ${method} forecast for US business context - ${product.name}`,
      },
    });
    
    console.log(`   ✅ Forecast for ${product.sku} using ${method}`);
  }

  console.log('\n🎉 Demo Company Inc data creation completed successfully!');
  
  // 8. Create Safety Stock demo data
  console.log('🛡️ Creating Safety Stock demo data...');
  const safetyStockCount = await createSafetyStockDemoData(organization.id, products, mainWarehouse);
  console.log(`   ✅ Created ${safetyStockCount} safety stock rules`);
  
  return {
    organization: updatedOrg,
    products: products.length,
    customers: customers.length,
    invoices: totalInvoicesCreated.length,
    locations: locations.length,
    forecasts: sampleProducts.length,
    safetyStock: safetyStockCount,
  };
}

/**
 * Create Safety Stock demo data with realistic scenarios
 */
async function createSafetyStockDemoData(organizationId, products, mainWarehouse) {
  const safetyStockData = [];
  
  // Safety Stock scenarios for different product types
  const scenarios = [
    {
      // High-volume office supplies - Statistical method
      pattern: (product) => product.sku.startsWith('OFF'),
      method: 'STATISTICAL',
      serviceLevel: 95,
      leadTimeDays: 7,
      baseQty: 150,
      notes: 'Office supplies with statistical safety stock based on demand variability'
    },
    {
      // Technology products - Lead time based (longer lead times)
      pattern: (product) => product.sku.startsWith('TECH'),
      method: 'BASED_ON_LEAD_TIME',
      serviceLevel: 92,
      leadTimeDays: 21,
      baseQty: 25,
      notes: 'Technology products with lead time variability from suppliers'
    },
    {
      // Health & Wellness - Percentage of demand (steady consumption)
      pattern: (product) => product.sku.startsWith('HW'),
      method: 'PERCENTAGE_OF_DEMAND',
      serviceLevel: 98,
      leadTimeDays: 14,
      baseQty: 100,
      notes: 'Health & wellness products with percentage-based safety stock'
    },
    {
      // Home & Garden - Fixed safety stock (seasonal)
      pattern: (product) => product.sku.startsWith('HG'),
      method: 'FIXED',
      serviceLevel: 90,
      leadTimeDays: 10,
      baseQty: 75,
      notes: 'Home & garden products with fixed safety stock for seasonal demand'
    }
  ];

  // Create current inventory levels first
  const inventoryItems = [];
  
  for (const product of products) {
    // Create initial inventory for each product
    const baseInventory = 200 + Math.random() * 800; // 200-1000 units
    
    // Check if inventory item already exists
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: {
        productId: product.id,
        warehouseLocation: mainWarehouse?.name || "Main",
      },
    });

    if (!existingInventory) {
      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          warehouseLocation: mainWarehouse?.name || "Main",
          quantityOnHand: Math.round(baseInventory),
          quantityReserved: Math.round(baseInventory * 0.1), // 10% reserved
          quantityAvailable: Math.round(baseInventory * 0.9), // Available = OnHand - Reserved
          averageCost: product.purchasePrice || 10,
          totalValue: Math.round((baseInventory * (product.purchasePrice || 10)) * 100) / 100,
        },
      });
      inventoryItems.push(inventoryItem);
    }

    // Find matching scenario for this product
    const scenario = scenarios.find(s => s.pattern(product));
    if (!scenario) continue;

    // Add some randomization to quantities
    const randomMultiplier = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
    const safetyStockQty = Math.round(scenario.baseQty * randomMultiplier);

    // Check if safety stock already exists
    const existingSafetyStock = await prisma.safetyStock.findFirst({
      where: {
        organizationId,
        productId: product.id,
        warehouseId: mainWarehouse?.id || null,
        isActive: true,
      },
    });

    if (!existingSafetyStock) {
      const safetyStock = await prisma.safetyStock.create({
        data: {
          organizationId,
          productId: product.id,
          warehouseId: mainWarehouse?.id || null,
          safetyStockQty,
          calculationMethod: scenario.method,
          serviceLevel: scenario.serviceLevel,
          leadTimeDays: scenario.leadTimeDays,
          reviewPeriodDays: 30,
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: null, // Ongoing
          notes: scenario.notes,
          isActive: true,
        },
      });
      safetyStockData.push(safetyStock);
      console.log(`   ✅ ${product.sku}: ${safetyStockQty} units (${scenario.method})`);
    }
  }

  // Create some purchase order history for lead time analysis
  await createPurchaseOrderHistory(organizationId, products, mainWarehouse);

  return safetyStockData.length;
}

/**
 * Create purchase order history to provide lead time data
 */
async function createPurchaseOrderHistory(organizationId, products, mainWarehouse) {
  console.log('📦 Creating purchase order history for lead time analysis...');
  
  // Create a sample vendor
  let vendor = await prisma.vendor.findFirst({
    where: { organizationId, companyName: 'Demo Supplier Co.' },
  });
  
  if (!vendor) {
    // Generate unique vendor number
    const vendorCount = await prisma.vendor.count({ where: { organizationId } });
    const vendorNumber = `V${String(vendorCount + 1).padStart(4, '0')}`;
    
    vendor = await prisma.vendor.create({
      data: {
        organizationId,
        vendorNumber,
        companyName: 'Demo Supplier Co.',
        contactName: 'John Anderson',
        email: 'orders@demosupplier.com',
        phone: '+1-555-0199',
        paymentTerms: 30,
        billingAddress: {
          street: '789 Industrial Blvd',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'US'
        },
        isActive: true,
      },
    });
  }

  // Create 6 months of purchase order history
  const startDate = new Date('2024-06-01');
  const endDate = new Date('2024-12-01');
  
  for (let month = 0; month < 6; month++) {
    const orderDate = new Date(startDate);
    orderDate.setMonth(startDate.getMonth() + month);
    
    // Create 2-3 POs per month
    for (let i = 0; i < 2 + Math.random(); i++) {
      const poDate = new Date(orderDate);
      poDate.setDate(poDate.getDate() + Math.random() * 28);
      
      // Expected delivery date with realistic lead times (5-25 days)
      const expectedDate = new Date(poDate);
      expectedDate.setDate(expectedDate.getDate() + 5 + Math.random() * 20);
      
      const poNumber = `PO-${poDate.getFullYear()}-${String(poDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`;
      
      // Check if PO already exists
      const existingPO = await prisma.purchaseOrder.findFirst({
        where: { organizationId, poNumber },
      });

      if (!existingPO) {
        // Add 3-5 random products to calculate totals first
        const selectedProducts = products
          .sort(() => 0.5 - Math.random())
          .slice(0, 3 + Math.random() * 2);

        let subtotal = 0;
        const poItems = [];
        
        for (const product of selectedProducts) {
          const quantity = 50 + Math.random() * 200; // 50-250 units
          const unitPrice = product.purchasePrice || 10;
          const total = quantity * unitPrice;
          subtotal += total;
          
          poItems.push({
            productId: product.id,
            description: product.name,
            quantity: Math.round(quantity),
            unitPrice,
            taxRate: 0,
            total: Math.round(total * 100) / 100,
          });
        }
        
        const taxAmount = subtotal * 0.08; // 8% tax
        const totalAmount = subtotal + taxAmount;

        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            organizationId,
            vendorId: vendor.id,
            poNumber,
            poDate,
            expectedDate,
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            total: Math.round(totalAmount * 100) / 100,
            status: 'RECEIVED', // Mark as received for analysis
            notes: 'Demo purchase order for safety stock lead time analysis',
            items: {
              create: poItems
            }
          },
        });
      }
    }
  }
  
  console.log('   ✅ Purchase order history created for lead time analysis');
}

/**
 * Main function
 */
async function main() {
  try {
    const demoCompany = await checkDemoCompany();
    
    if (!demoCompany) {
      console.log('\n💡 To create "Demo Company Inc" organization:');
      console.log('   1. Use your admin panel to create the organization');
      console.log('   2. Or run this script after creating it manually');
      return;
    }

    console.log(`\n🎯 Found Demo Company: ${demoCompany.name}`);
    
    // Check if it already has data
    const existingData = await Promise.all([
      prisma.product.count({ where: { organizationId: demoCompany.id } }),
      prisma.customer.count({ where: { organizationId: demoCompany.id } }),
      prisma.invoice.count({ where: { organizationId: demoCompany.id } }),
    ]);
    
    const [productCount, customerCount, invoiceCount] = existingData;
    
    console.log('\n📊 Current Data Status:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Invoices: ${invoiceCount}`);
    
    if (productCount > 0 || customerCount > 0 || invoiceCount > 0) {
      console.log('\n⚠️  Organization already has data. This will add more demo data.');
      console.log('   To start fresh, clean up existing data first.');
    }
    
    const result = await createDemoCompanyData(demoCompany);
    
    console.log('\n📈 Demo Data Summary:');
    console.log(`   Organization: ${result.organization.name}`);
    console.log(`   Country: ${result.organization.homeCountry} (${result.organization.baseCurrency})`);
    console.log(`   Products: ${result.products} items across 4 categories`);
    console.log(`   Customers: ${result.customers} across 4 segments`);
    console.log(`   Historical Data: ${result.invoices} invoices (24 months)`);
    console.log(`   Locations: ${result.locations} (branches and warehouses)`);
    console.log(`   Sample Forecasts: ${result.forecasts} forecasts`);
    console.log(`   Safety Stock Rules: ${result.safetyStock} with different calculation methods`);
    
    console.log('\n🧪 Testing the Enhanced Planning System:');
    console.log(`   Organization Slug: ${result.organization.slug}`);
    console.log(`   Forecasting API: /api/${result.organization.slug}/planning/forecasts`);
    console.log(`   Safety Stock API: /api/planning/safety-stock/overview?orgId=${result.organization.slug}`);
    console.log(`   Test Commands:`);
    console.log(`     curl "/api/${result.organization.slug}/planning/forecasts?action=methods"`);
    console.log(`     curl "/api/planning/safety-stock/overview?orgId=${result.organization.slug}"`);
    
    console.log('\n🌟 US Business Features Included:');
    console.log('   ✅ US holidays and business calendar');
    console.log('   ✅ Regional variations (Northeast, West, Southeast, Midwest)');
    console.log('   ✅ Business customer segments (Small Business, Enterprise, Government, Educational)');
    console.log('   ✅ Seasonal patterns (Back to School, Holiday Shopping, etc.)');
    console.log(`   ✅ ${organization.baseCurrency} currency with local tax rates`);
    console.log(`   ✅ Realistic ${organization.homeCountry} business addresses and phone numbers`);
    console.log(`   ✅ 24 months of sales data with ${organization.homeCountry} market patterns`);
    console.log('   ✅ Safety stock rules with multiple calculation methods');
    console.log('   ✅ Purchase order history for lead time analysis');
    console.log('   ✅ Current inventory levels for stock coverage analysis');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDemoCompany,
  createDemoCompanyData,
  DEMO_COMPANY_PRODUCTS,
  DEMO_COMPANY_LOCATIONS,
};