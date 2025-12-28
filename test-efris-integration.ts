/**
 * Test EFRIS Integration with Tax Exemptions
 * Validates the integration between TaxExemptionService and EFRISIntegration
 */

import { TaxExemptionService } from './src/lib/tax/tax-exemption-service';
import { EFRISIntegration, EFRISTransaction } from './src/lib/tax/efris-integration';

export async function testEFRISIntegration(organizationId: string) {
  console.log('Testing EFRIS Integration with Tax Exemptions...\n');

  // Test 1: Transaction with valid customer exemption
  console.log('Test 1: Customer exemption transaction');
  const customerTransaction: EFRISTransaction = {
    invoiceNumber: 'INV-2024-001',
    transactionDate: new Date(),
    customerId: 'customer-123',
    amount: 1000000,
    taxAmount: 0 // Exempt
  };

  try {
    const payload1 = await EFRISIntegration.prepareEFRISPayload(
      organizationId,
      customerTransaction
    );

    console.log('EFRIS Payload:', JSON.stringify(payload1, null, 2));

    const validation1 = EFRISIntegration.validateEFRISCompliance(payload1);
    console.log('Validation Result:', validation1);

  } catch (error) {
    console.error('Test 1 failed:', error);
  }

  // Test 2: Transaction with vendor exemption
  console.log('\nTest 2: Vendor exemption transaction');
  const vendorTransaction: EFRISTransaction = {
    invoiceNumber: 'INV-2024-002',
    transactionDate: new Date(),
    vendorId: 'vendor-456',
    amount: 500000,
    taxAmount: 0,
    exemptionDetails: {
      exemptionId: 'exempt-001',
      reason: 'MEDICAL',
      certificateNumber: 'MED-2024-001'
    }
  };

  try {
    const payload2 = await EFRISIntegration.prepareEFRISPayload(
      organizationId,
      vendorTransaction
    );

    console.log('EFRIS Payload:', JSON.stringify(payload2, null, 2));

    const validation2 = EFRISIntegration.validateEFRISCompliance(payload2);
    console.log('Validation Result:', validation2);

  } catch (error) {
    console.error('Test 2 failed:', error);
  }

  // Test 3: Regular taxable transaction
  console.log('\nTest 3: Regular taxable transaction');
  const taxableTransaction: EFRISTransaction = {
    invoiceNumber: 'INV-2024-003',
    transactionDate: new Date(),
    customerId: 'customer-789',
    amount: 200000,
    taxAmount: 36000 // 18% VAT
  };

  try {
    const payload3 = await EFRISIntegration.prepareEFRISPayload(
      organizationId,
      taxableTransaction
    );

    console.log('EFRIS Payload:', JSON.stringify(payload3, null, 2));

    const validation3 = EFRISIntegration.validateEFRISCompliance(payload3);
    console.log('Validation Result:', validation3);

  } catch (error) {
    console.error('Test 3 failed:', error);
  }

  console.log('\nEFRIS Integration test completed.');
}

// Run test if this file is executed directly
if (require.main === module) {
  testEFRISIntegration('org-123').catch(console.error);
}