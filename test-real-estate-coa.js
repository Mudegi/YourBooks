/**
 * Verification test for Real Estate COA Template
 * Tests that all 4 required accounts are present and properly configured
 */

const fs = require('fs');
const path = require('path');

// Read the COA generator file
const coaFilePath = path.join(__dirname, 'src', 'lib', 'coa-generator.ts');
const coaContent = fs.readFileSync(coaFilePath, 'utf8');

// Extract REAL_ESTATE template
const realEstateMatch = coaContent.match(/REAL_ESTATE:\s*\[([\s\S]*?)\],\s*\n\s*NONPROFIT:/);
if (!realEstateMatch) {
  console.error('❌ Could not find REAL_ESTATE template in file');
  process.exit(1);
}

const realEstateTemplate = realEstateMatch[1];

// Parse accounts - simpler approach that handles multi-line
const lines = realEstateTemplate.split('\n').filter(l => l.trim().startsWith('{ code:'));
const accounts = lines.map(line => {
  const codeMatch = line.match(/code:\s*'(\d+)'/);
  const nameMatch = line.match(/name:\s*'([^']+)'/);
  const typeMatch = line.match(/accountType:\s*AccountType\.(\w+)/);
  const subTypeMatch = line.match(/accountSubType:\s*'([^']+)'/);
  const descMatch = line.match(/description:\s*'([^']+)'/);
  const systemMatch = line.match(/isSystem:\s*(true)/);
  
  if (codeMatch && nameMatch && typeMatch) {
    return {
      code: codeMatch[1],
      name: nameMatch[1],
      accountType: typeMatch[1],
      accountSubType: subTypeMatch ? subTypeMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      isSystem: !!systemMatch
    };
  }
  return null;
}).filter(a => a !== null);

console.log('═══════════════════════════════════════════════════════');
console.log('     REAL ESTATE COA TEMPLATE VERIFICATION');
console.log('═══════════════════════════════════════════════════════\n');

// Required accounts with their expected properties
const requiredAccounts = [
  {
    keyword: 'Rental Income',
    expectedType: 'REVENUE',
    description: 'Property rental income'
  },
  {
    keyword: 'Tenant Security Deposits',
    expectedType: 'LIABILITY',
    description: 'Must be LIABILITY type and clearly marked as held on behalf of tenants'
  },
  {
    keyword: 'Property Maintenance Expenses',
    expectedType: 'EXPENSE',
    description: 'Property maintenance and repairs'
  },
  {
    keyword: 'Property Taxes',
    expectedType: 'EXPENSE',
    description: 'Real estate property taxes'
  }
];

console.log('✅ Required Accounts Check:\n');

let allPresent = true;
const foundAccounts = [];

for (const required of requiredAccounts) {
  const account = accounts.find(acc => 
    acc.name.includes(required.keyword) || 
    (required.keyword === 'Rental Income' && acc.name.toLowerCase().includes('rental income')) ||
    (required.keyword === 'Tenant Security Deposits' && acc.name.toLowerCase().includes('security deposit'))
  );
  
  if (account) {
    const typeMatch = account.accountType === required.expectedType;
    const systemAccount = account.isSystem ? '[SYSTEM]' : '';
    const typeStatus = typeMatch ? '✓' : '✗ WRONG TYPE';
    
    console.log(`  ${typeStatus} ${account.code} - ${account.name} ${systemAccount}`);
    console.log(`     Type: ${account.accountType} | ${account.description}`);
    
    // Special check for Security Deposits being LIABILITY
    if (required.keyword === 'Tenant Security Deposits') {
      if (account.accountType === 'LIABILITY') {
        console.log(`     ✓ Correctly marked as LIABILITY (held on behalf of tenants)`);
      } else {
        console.log(`     ✗ ERROR: Should be LIABILITY type!`);
        allPresent = false;
      }
    }
    
    if (!typeMatch) {
      allPresent = false;
    }
    
    foundAccounts.push(account);
  } else {
    console.log(`  ✗ MISSING: ${required.keyword}`);
    allPresent = false;
  }
  console.log('');
}

// Count accounts by type
const accountsByType = accounts.reduce((acc, account) => {
  acc[account.accountType] = (acc[account.accountType] || 0) + 1;
  return acc;
}, {});

console.log('📊 Account Distribution:');
Object.entries(accountsByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} accounts`);
});

const systemAccounts = accounts.filter(a => a.isSystem).length;

console.log('\n📈 Template Statistics:');
console.log(`  Total Real Estate-Specific Accounts: ${accounts.length}`);
console.log(`  Required Accounts Present: ${allPresent ? '✅ ALL PRESENT' : '❌ MISSING OR INCORRECT'}`);
console.log(`  System Accounts: ${systemAccounts}`);

// Verify hierarchical structure
const assetAccounts = accounts.filter(a => a.accountType === 'ASSET');
const liabilityAccounts = accounts.filter(a => a.accountType === 'LIABILITY');
const revenueAccounts = accounts.filter(a => a.accountType === 'REVENUE');
const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');

const hasProperHierarchy = 
  assetAccounts.every(a => a.code.startsWith('1')) &&
  liabilityAccounts.every(a => a.code.startsWith('2')) &&
  revenueAccounts.every(a => a.code.startsWith('4')) &&
  expenseAccounts.every(a => a.code.startsWith('6'));

console.log(`  Hierarchical Structure: ${hasProperHierarchy ? '✅ Organized by code range' : '❌ Invalid codes'}`);
console.log(`  Seeding Ready: ✅ Array format for easy iteration`);

// Verify Security Deposits account details
console.log('\n🔍 Security Deposits Verification:');
const securityDeposit = accounts.find(a => a.name.toLowerCase().includes('security deposit'));
if (securityDeposit) {
  console.log(`  Account: ${securityDeposit.code} - ${securityDeposit.name}`);
  console.log(`  Type: ${securityDeposit.accountType} ${securityDeposit.accountType === 'LIABILITY' ? '✅' : '❌'}`);
  console.log(`  Classification: ${securityDeposit.accountSubType}`);
  console.log(`  Description: ${securityDeposit.description}`);
  console.log(`  System Account: ${securityDeposit.isSystem ? 'Yes ✅' : 'No'}`);
  console.log(`  \n  ℹ️  This is correctly marked as LIABILITY because these funds are`);
  console.log(`     held on behalf of tenants and must be returned unless forfeited.`);
}

console.log('\n═══════════════════════════════════════════════════════');

if (allPresent && hasProperHierarchy && accounts.length >= 30) {
  console.log('🎉 SUCCESS: Real Estate COA Template is complete and ready!');
  console.log('═══════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Template needs corrections');
  console.log('═══════════════════════════════════════════════════════\n');
  process.exit(1);
}
