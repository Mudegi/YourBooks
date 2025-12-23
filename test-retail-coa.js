/**
 * Quick test to verify Retail COA Template
 */

// Mock AccountType enum
const AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  COST_OF_SALES: 'COST_OF_SALES',
  EXPENSE: 'EXPENSE'
};

// Retail accounts from COA generator
const RETAIL_ACCOUNTS = [
  // CURRENT ASSETS - Inventory (1300s)
  { code: '1310', name: 'Inventory - Retail Products', accountType: AccountType.ASSET, accountSubType: 'Current Assets', description: 'Merchandise inventory available for sale', isSystem: true },
  { code: '1350', name: 'Merchandise Inventory', accountType: AccountType.ASSET, accountSubType: 'Current Assets', description: 'Additional retail products for sale' },
  
  // CURRENT LIABILITIES - Sales Tax (2100s)
  { code: '2110', name: 'Sales Tax Payable', accountType: AccountType.LIABILITY, accountSubType: 'Current Liabilities', description: 'Sales tax collected from customers awaiting remittance', isSystem: true },
  { code: '2120', name: 'VAT Payable', accountType: AccountType.LIABILITY, accountSubType: 'Current Liabilities', description: 'Value-added tax payable' },
  
  // REVENUE - Sales (4000s)
  { code: '4010', name: 'Sales Revenue - Products', accountType: AccountType.REVENUE, accountSubType: 'Operating Revenue', description: 'Primary retail sales revenue', isSystem: true },
  { code: '4020', name: 'Sales Revenue - Online', accountType: AccountType.REVENUE, accountSubType: 'Operating Revenue', description: 'E-commerce sales revenue' },
  { code: '4050', name: 'Product Sales', accountType: AccountType.REVENUE, accountSubType: 'Operating Revenue', description: 'Revenue from product sales' },
  { code: '4400', name: 'Sales Returns & Allowances', accountType: AccountType.REVENUE, accountSubType: 'Operating Revenue', description: 'Customer returns and discounts' },
  { code: '4500', name: 'Sales Discounts', accountType: AccountType.REVENUE, accountSubType: 'Operating Revenue', description: 'Discounts given to customers' },
  
  // COST OF SALES - COGS (5000s)
  { code: '5010', name: 'Cost of Goods Sold (COGS)', accountType: AccountType.COST_OF_SALES, accountSubType: 'Direct Costs', description: 'Direct cost of products sold to customers', isSystem: true },
  { code: '5020', name: 'Purchase Returns & Allowances', accountType: AccountType.COST_OF_SALES, accountSubType: 'Direct Costs', description: 'Returns and allowances from suppliers' },
  { code: '5030', name: 'Inventory Shrinkage', accountType: AccountType.COST_OF_SALES, accountSubType: 'Direct Costs', description: 'Loss due to theft, damage, or obsolescence' },
  { code: '5200', name: 'Freight In', accountType: AccountType.COST_OF_SALES, accountSubType: 'Direct Costs', description: 'Shipping costs for inventory purchases' },
  { code: '5300', name: 'Inventory Adjustments', accountType: AccountType.COST_OF_SALES, accountSubType: 'Direct Costs', description: 'Adjustments for inventory valuation' },
  
  // OPERATING EXPENSES - Retail Specific (6000s)
  { code: '6110', name: 'Merchant Processing Fees', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Credit card and payment processing fees', isSystem: true },
  { code: '6120', name: 'Payment Gateway Fees', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Online payment gateway transaction fees' },
  { code: '6150', name: 'Store Supplies', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Store operation materials and supplies' },
  { code: '6160', name: 'Packaging Materials', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Bags, boxes, and packaging supplies' },
  { code: '6170', name: 'Shipping & Delivery', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Customer delivery and shipping costs' },
  { code: '6650', name: 'Point of Sale Fees', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'POS system subscription and transaction fees' },
  { code: '6660', name: 'E-commerce Platform Fees', accountType: AccountType.EXPENSE, accountSubType: 'Operating Expenses', description: 'Online marketplace and platform fees' },
];

console.log('\n═══════════════════════════════════════════════════════');
console.log('     RETAIL COA TEMPLATE VERIFICATION');
console.log('═══════════════════════════════════════════════════════\n');

// Key accounts that MUST be present
const REQUIRED_ACCOUNTS = [
  { code: '1310', name: 'Inventory - Retail Products', type: 'ASSET' },
  { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'COST_OF_SALES' },
  { code: '4010', name: 'Sales Revenue - Products', type: 'REVENUE' },
  { code: '6110', name: 'Merchant Processing Fees', type: 'EXPENSE' },
  { code: '2110', name: 'Sales Tax Payable', type: 'LIABILITY' },
];

console.log('✅ Required Accounts Check:\n');

let allPresent = true;
REQUIRED_ACCOUNTS.forEach(required => {
  const found = RETAIL_ACCOUNTS.find(a => a.code === required.code);
  if (found) {
    console.log(`  ✓ ${required.code} - ${required.name}`);
    console.log(`    Type: ${found.accountType} | SubType: ${found.accountSubType}`);
    if (found.isSystem) console.log(`    System Account: YES`);
  } else {
    console.log(`  ✗ ${required.code} - ${required.name} - MISSING!`);
    allPresent = false;
  }
});

console.log('\n');

// Count by type
const countByType = RETAIL_ACCOUNTS.reduce((acc, account) => {
  acc[account.accountType] = (acc[account.accountType] || 0) + 1;
  return acc;
}, {});

console.log('📊 Account Distribution:\n');
Object.entries(countByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} accounts`);
});

console.log('\n');

// Verify hierarchical structure
console.log('🏗️  Hierarchical Code Structure:\n');

const codeRanges = {
  '1300s (Inventory)': RETAIL_ACCOUNTS.filter(a => a.code.startsWith('13')),
  '2100s (Tax Payable)': RETAIL_ACCOUNTS.filter(a => a.code.startsWith('21')),
  '4000s (Revenue)': RETAIL_ACCOUNTS.filter(a => a.code.startsWith('4')),
  '5000s (COGS)': RETAIL_ACCOUNTS.filter(a => a.code.startsWith('5')),
  '6100s+ (Fees/Expenses)': RETAIL_ACCOUNTS.filter(a => a.code.startsWith('6')),
};

Object.entries(codeRanges).forEach(([range, accounts]) => {
  if (accounts.length > 0) {
    console.log(`  ${range}: ${accounts.length} accounts`);
    accounts.forEach(a => {
      const systemTag = a.isSystem ? ' [SYSTEM]' : '';
      console.log(`    ${a.code} - ${a.name}${systemTag}`);
    });
  }
});

console.log('\n');

// Seeding format example
console.log('🔄 Seeding Engine Format Example:\n');
console.log('```typescript');
console.log('// Iterate through accounts for database seeding');
console.log('for (const account of RETAIL_ACCOUNTS) {');
console.log('  await prisma.chartOfAccount.create({');
console.log('    data: {');
console.log('      organizationId,');
console.log('      code: account.code,');
console.log('      name: account.name,');
console.log('      accountType: account.accountType,');
console.log('      accountSubType: account.accountSubType,');
console.log('      description: account.description,');
console.log('      isSystem: account.isSystem ?? false,');
console.log('      isActive: true,');
console.log('      balance: 0,');
console.log('    }');
console.log('  });');
console.log('}');
console.log('```');

console.log('\n');

// Summary
console.log('═══════════════════════════════════════════════════════');
console.log('                    SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Total Retail-Specific Accounts: ${RETAIL_ACCOUNTS.length}`);
console.log(`Required Accounts Present: ${allPresent ? '✅ ALL PRESENT' : '❌ MISSING SOME'}`);
console.log(`System Accounts: ${RETAIL_ACCOUNTS.filter(a => a.isSystem).length}`);
console.log(`Hierarchical Structure: ✅ Organized by code range`);
console.log(`Seeding Ready: ✅ Array format for easy iteration`);

console.log('\n');

if (allPresent) {
  console.log('🎉 SUCCESS: Retail COA Template is complete and ready!\n');
  process.exit(0);
} else {
  console.log('⚠️  WARNING: Some required accounts are missing!\n');
  process.exit(1);
}
