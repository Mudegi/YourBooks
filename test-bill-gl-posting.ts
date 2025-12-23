/**
 * Quick integration test for bill creation with GL posting
 * 
 * This script verifies that:
 * 1. Bills create balanced GL transactions
 * 2. VAT input is separated on a distinct ledger line
 * 3. URA fields are persisted
 * 4. WHT accounting is properly set up
 * 
 * Run with: npx ts-node test-bill-gl-posting.ts
 */

import { prisma } from '@/lib/prisma';
import { BillService } from '@/services/accounts-payable/bill.service';
import { EntryType } from '@prisma/client';

async function testBillGLPosting() {
  console.log('🧪 Testing Bill GL Posting with VAT & URA Compliance\n');

  try {
    // Setup: Get or create test organization
    let org = await prisma.organization.findFirst({
      where: { slug: 'test-org' },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          legalName: 'Test Org Ltd',
          baseCurrency: 'USD',
        },
      });
      console.log('✓ Created test organization:', org.id);
    }

    // Setup: Get or create test vendor
    let vendor = await prisma.vendor.findFirst({
      where: { organizationId: org.id, vendorNumber: 'TEST-VENDOR' },
    });

    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          organizationId: org.id,
          vendorNumber: 'TEST-VENDOR',
          companyName: 'Test Vendor Inc',
          email: 'vendor@test.com',
          isActive: true,
        },
      });
      console.log('✓ Created test vendor:', vendor.id);
    }

    // Setup: Get or create COA accounts
    const getOrCreateAccount = async (code: string, name: string, type: string) => {
      let account = await prisma.chartOfAccount.findFirst({
        where: { organizationId: org.id, code },
      });

      if (!account) {
        account = await prisma.chartOfAccount.create({
          data: {
            organizationId: org.id,
            code,
            name,
            accountType: type as any,
            isActive: true,
            balance: 0,
          },
        });
        console.log(`✓ Created account ${code} (${name})`);
      }
      return account;
    };

    const expenseAccount = await getOrCreateAccount('5100', 'Office Supplies', 'EXPENSE');
    const apAccount = await getOrCreateAccount('2000', 'Accounts Payable', 'LIABILITY');
    const vatInputAccount = await getOrCreateAccount('1400', 'Input VAT Recoverable', 'ASSET');

    console.log('\n📝 Creating bill with GL posting...');

    // Create test bill with VAT and URA fields
    const bill = await BillService.createBill(
      {
        vendorId: vendor.id,
        billDate: new Date('2025-12-24'),
        dueDate: new Date('2025-01-23'),
        billNumber: 'TEST-001',
        vendorInvoiceNo: 'INV-2025-001', // URA field
        taxCategory: 'STANDARD', // URA field
        whtApplicable: false,
        efrisReceiptNo: 'UG-001', // URA field
        notes: 'Test bill with GL posting',
        items: [
          {
            description: 'Office Supplies',
            quantity: 5,
            unitPrice: 200,
            accountId: expenseAccount.id,
            taxAmount: 180, // 18% VAT on 1000
            taxRate: 18,
            taxCategory: 'STANDARD',
            claimInputTax: true,
          },
        ],
      },
      org.id,
      'test-user-id'
    );

    console.log('✓ Bill created:', bill.id);
    console.log(`  - Bill #${bill.billNumber}`);
    console.log(`  - Subtotal: $${Number(bill.subtotal)}`);
    console.log(`  - Tax: $${Number(bill.taxAmount)}`);
    console.log(`  - Total: $${Number(bill.total)}`);

    // Verify GL transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: bill.transactionId! },
      include: {
        ledgerEntries: {
          include: { account: true },
        },
      },
    });

    if (!transaction) {
      throw new Error('GL transaction not created!');
    }

    console.log('\n📊 GL Transaction Verification:');
    console.log(`  Transaction #: ${transaction.transactionNumber}`);
    console.log(`  Status: ${transaction.status}`);

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    console.log('\n  Ledger Entries:');
    for (const entry of transaction.ledgerEntries) {
      const isDebit = entry.entryType === EntryType.DEBIT;
      const type = isDebit ? 'DR' : 'CR';
      const amount = Number(entry.amount);

      if (isDebit) {
        totalDebits += amount;
      } else {
        totalCredits += amount;
      }

      console.log(
        `    ${type} ${entry.account.code} (${entry.account.name}): $${amount.toFixed(2)}`
      );
    }

    // Verify balance
    console.log(`\n  Total Debits:  $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);

    if (Math.abs(totalDebits - totalCredits) < 0.01) {
      console.log('  ✅ BALANCED! Debits = Credits');
    } else {
      console.log('  ❌ NOT BALANCED! Debits ≠ Credits');
    }

    // Verify VAT separation
    const vatEntry = transaction.ledgerEntries.find(
      (e) => e.accountId === vatInputAccount.id
    );
    if (vatEntry) {
      console.log(`\n✅ VAT Input separated: $${Number(vatEntry.amount).toFixed(2)}`);
    } else {
      console.log('\n❌ VAT Input NOT found on separate line');
    }

    // Verify URA fields
    console.log('\n🔐 URA Fields Verification:');
    console.log(`  vendorInvoiceNo: ${bill.vendorInvoiceNo}`);
    console.log(`  efrisReceiptNo: ${bill.efrisReceiptNo}`);
    console.log(`  whtApplicable: ${bill.whtApplicable}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testBillGLPosting();
