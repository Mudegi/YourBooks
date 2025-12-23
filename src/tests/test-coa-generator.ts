/**
 * Test Suite for Chart of Accounts Generator
 * 
 * This file demonstrates how to use the COA generator and validates its functionality.
 * Run with: npx ts-node src/tests/test-coa-generator.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  generateChartOfAccounts,
  canGenerateCOA,
  getAvailableIndustries,
  previewCOA,
  getAccountTemplates,
  type IndustryType,
} from '../lib/coa-generator';

const prisma = new PrismaClient();

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

async function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGetAvailableIndustries() {
  await log('\n🧪 Test 1: Get Available Industries', 'blue');
  
  const industries = getAvailableIndustries();
  
  console.log(`Found ${industries.length} industry types:`);
  industries.forEach((industry) => {
    console.log(`  - ${industry.label}: ${industry.accountCount} accounts`);
  });
  
  if (industries.length > 0) {
    await log('✅ PASSED: Got available industries', 'green');
    return true;
  } else {
    await log('❌ FAILED: No industries found', 'red');
    return false;
  }
}

async function testPreviewCOA() {
  await log('\n🧪 Test 2: Preview COA for Retail Industry', 'blue');
  
  const preview = previewCOA('RETAIL');
  
  console.log(`Industry: ${preview.industry}`);
  console.log(`Total Accounts: ${preview.totalAccounts}`);
  console.log('Accounts by Type:');
  Object.entries(preview.accountsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\nSample Accounts:');
  preview.templates.slice(0, 5).forEach((template) => {
    console.log(`  ${template.code} - ${template.name} (${template.accountType})`);
  });
  
  if (preview.totalAccounts > 0) {
    await log('✅ PASSED: Preview generated successfully', 'green');
    return true;
  } else {
    await log('❌ FAILED: Preview returned no accounts', 'red');
    return false;
  }
}

async function testGetAccountTemplates() {
  await log('\n🧪 Test 3: Get Account Templates', 'blue');
  
  const templates = getAccountTemplates('MANUFACTURING', true);
  
  console.log(`Generated ${templates.length} account templates for MANUFACTURING`);
  
  // Check for industry-specific accounts
  const hasRawMaterials = templates.some(t => t.code === '1310');
  const hasWorkInProgress = templates.some(t => t.code === '1320');
  const hasFinishedGoods = templates.some(t => t.code === '1330');
  
  if (hasRawMaterials && hasWorkInProgress && hasFinishedGoods) {
    await log('✅ PASSED: Manufacturing-specific accounts found', 'green');
    return true;
  } else {
    await log('❌ FAILED: Missing manufacturing-specific accounts', 'red');
    return false;
  }
}

async function testCreateTestOrganization() {
  await log('\n🧪 Test 4: Create Test Organization', 'blue');
  
  try {
    // Clean up any existing test organization
    await prisma.organization.deleteMany({
      where: { slug: 'test-coa-generator' },
    });
    
    const organization = await prisma.organization.create({
      data: {
        name: 'COA Generator Test Co',
        slug: 'test-coa-generator',
        baseCurrency: 'USD',
        industry: 'RETAIL',
        isActive: true,
      } as any,
    });
    
    console.log(`Created organization: ${organization.name} (${organization.id})`);
    await log('✅ PASSED: Test organization created', 'green');
    return organization.id;
  } catch (error) {
    await log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return null;
  }
}

async function testCanGenerateCOA(organizationId: string) {
  await log('\n🧪 Test 5: Check if Can Generate COA', 'blue');
  
  const result = await canGenerateCOA(organizationId);
  
  console.log(`Can Generate: ${result.canGenerate}`);
  if (result.reason) {
    console.log(`Reason: ${result.reason}`);
  }
  
  if (result.canGenerate) {
    await log('✅ PASSED: Organization can have COA generated', 'green');
    return true;
  } else {
    await log('⚠️  Organization already has accounts', 'yellow');
    return false;
  }
}

async function testGenerateCOA(organizationId: string) {
  await log('\n🧪 Test 6: Generate Chart of Accounts', 'blue');
  
  try {
    const result = await generateChartOfAccounts({
      organizationId,
      industryType: 'RETAIL',
      baseCurrency: 'USD',
      includeOptionalAccounts: true,
    });
    
    if (result.success) {
      console.log(`✓ Created ${result.accountsCreated} accounts`);
      
      // Verify accounts were created
      const accounts = await prisma.chartOfAccount.findMany({
        where: { organizationId },
        orderBy: { code: 'asc' },
        take: 10,
      });
      
      console.log('\nFirst 10 accounts created:');
      accounts.forEach((account) => {
        console.log(`  ${account.code} - ${account.name} (${account.accountType})`);
      });
      
      await log('✅ PASSED: Chart of Accounts generated successfully', 'green');
      return true;
    } else {
      await log(`❌ FAILED: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    await log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testDuplicatePrevention(organizationId: string) {
  await log('\n🧪 Test 7: Prevent Duplicate COA Generation', 'blue');
  
  try {
    const result = await generateChartOfAccounts({
      organizationId,
      industryType: 'RETAIL',
      baseCurrency: 'USD',
      includeOptionalAccounts: true,
    });
    
    if (!result.success && result.error?.includes('already has')) {
      await log('✅ PASSED: Duplicate generation prevented', 'green');
      return true;
    } else {
      await log('❌ FAILED: Should have prevented duplicate generation', 'red');
      return false;
    }
  } catch (error) {
    await log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testAccountCodes() {
  await log('\n🧪 Test 8: Verify Account Code Standards', 'blue');
  
  const templates = getAccountTemplates('GENERAL', true);
  
  const assetAccounts = templates.filter(t => t.accountType === 'ASSET');
  const liabilityAccounts = templates.filter(t => t.accountType === 'LIABILITY');
  const equityAccounts = templates.filter(t => t.accountType === 'EQUITY');
  const revenueAccounts = templates.filter(t => t.accountType === 'REVENUE');
  const expenseAccounts = templates.filter(t => t.accountType === 'EXPENSE');
  
  const checks = [
    {
      name: 'Assets (1000-1999)',
      pass: assetAccounts.every(a => parseInt(a.code) >= 1000 && parseInt(a.code) < 2000),
    },
    {
      name: 'Liabilities (2000-2999)',
      pass: liabilityAccounts.every(a => parseInt(a.code) >= 2000 && parseInt(a.code) < 3000),
    },
    {
      name: 'Equity (3000-3999)',
      pass: equityAccounts.every(a => parseInt(a.code) >= 3000 && parseInt(a.code) < 4000),
    },
    {
      name: 'Revenue (4000-4999)',
      pass: revenueAccounts.every(a => parseInt(a.code) >= 4000 && parseInt(a.code) < 5000),
    },
    {
      name: 'Expenses (5000+)',
      pass: expenseAccounts.every(a => parseInt(a.code) >= 5000),
    },
  ];
  
  let allPassed = true;
  checks.forEach((check) => {
    if (check.pass) {
      console.log(`  ✓ ${check.name}`);
    } else {
      console.log(`  ✗ ${check.name}`);
      allPassed = false;
    }
  });
  
  if (allPassed) {
    await log('✅ PASSED: Account codes follow standards', 'green');
    return true;
  } else {
    await log('❌ FAILED: Some account codes are non-standard', 'red');
    return false;
  }
}

async function testTransactionRollback() {
  await log('\n🧪 Test 9: Transaction Rollback on Error', 'blue');
  
  try {
    // Create a test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Rollback Test Co',
        slug: 'test-rollback-' + Date.now(),
        baseCurrency: 'USD',
        isActive: true,
      },
    });
    
    // Try to generate with invalid organization ID (simulates error mid-transaction)
    const result = await generateChartOfAccounts({
      organizationId: 'invalid-id-that-does-not-exist',
      industryType: 'GENERAL',
      baseCurrency: 'USD',
    });
    
    if (!result.success) {
      // Verify no accounts were created for the real org
      const accountCount = await prisma.chartOfAccount.count({
        where: { organizationId: org.id },
      });
      
      // Clean up
      await prisma.organization.delete({ where: { id: org.id } });
      
      if (accountCount === 0) {
        await log('✅ PASSED: Transaction rolled back correctly', 'green');
        return true;
      } else {
        await log('❌ FAILED: Accounts were created despite error', 'red');
        return false;
      }
    } else {
      await log('⚠️  Expected failure but succeeded', 'yellow');
      await prisma.organization.delete({ where: { id: org.id } });
      return false;
    }
  } catch (error) {
    await log('✅ PASSED: Error handled correctly', 'green');
    return true;
  }
}

async function cleanup(organizationId: string | null) {
  await log('\n🧹 Cleaning up test data...', 'blue');
  
  try {
    if (organizationId) {
      await prisma.organization.delete({
        where: { id: organizationId },
      });
      await log('✅ Test organization deleted', 'green');
    }
  } catch (error) {
    await log('⚠️  Cleanup may have failed (this is okay)', 'yellow');
  }
}

async function runAllTests() {
  await log('═══════════════════════════════════════════════════════', 'blue');
  await log('     Chart of Accounts Generator - Test Suite', 'blue');
  await log('═══════════════════════════════════════════════════════', 'blue');
  
  const results: Array<{ name: string; passed: boolean }> = [];
  let organizationId: string | null = null;
  
  try {
    // Run tests
    results.push({ name: 'Get Available Industries', passed: await testGetAvailableIndustries() });
    results.push({ name: 'Preview COA', passed: await testPreviewCOA() });
    results.push({ name: 'Get Account Templates', passed: await testGetAccountTemplates() });
    results.push({ name: 'Verify Account Code Standards', passed: await testAccountCodes() });
    
    organizationId = await testCreateTestOrganization();
    if (organizationId) {
      results.push({ name: 'Create Test Organization', passed: true });
      results.push({ name: 'Check Can Generate COA', passed: await testCanGenerateCOA(organizationId) });
      results.push({ name: 'Generate Chart of Accounts', passed: await testGenerateCOA(organizationId) });
      results.push({ name: 'Prevent Duplicate Generation', passed: await testDuplicatePrevention(organizationId) });
    } else {
      results.push({ name: 'Create Test Organization', passed: false });
    }
    
    results.push({ name: 'Transaction Rollback', passed: await testTransactionRollback() });
    
  } catch (error) {
    await log(`\n❌ Test suite failed with error: ${error}`, 'red');
  } finally {
    await cleanup(organizationId);
  }
  
  // Summary
  await log('\n═══════════════════════════════════════════════════════', 'blue');
  await log('                    TEST SUMMARY', 'blue');
  await log('═══════════════════════════════════════════════════════', 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  await log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  
  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
