# EFRIS Integration Guide

## Overview

This guide explains how to integrate YourBooks with EFRIS (Electronic Fiscal Receipting and Invoicing Solution) or similar tax authority systems that require real-time invoice reporting.

EFRIS is used in Uganda and other countries for electronic fiscal receipting. When you create an invoice in YourBooks, it automatically sends the invoice data to the tax authority system for validation and fiscal receipt generation.

## Integration Architecture

```
YourBooks → Webhook → EFRIS API
         ↑             ↓
         └─── FDN/QR Code Response
```

### Flow:
1. User creates invoice in YourBooks
2. YourBooks emits `invoice.created` webhook event
3. Webhook middleware sends invoice data to EFRIS
4. EFRIS validates and returns Fiscal Document Number (FDN)
5. YourBooks stores FDN in invoice metadata
6. Customer receives invoice with FDN and QR code

## Setup Instructions

### Step 1: Register with EFRIS

1. Register your business with URA (Uganda Revenue Authority)
2. Obtain EFRIS credentials:
   - Private Key
   - TIN (Tax Identification Number)
   - Device Number
   - API Endpoint URL

### Step 2: Create Integration in YourBooks

```typescript
// POST /api/demo-company/integrations
{
  "name": "EFRIS Tax Authority",
  "type": "TAX_FILING",
  "provider": "efris",
  "apiKey": "your_private_key",
  "config": {
    "tin": "1234567890",
    "deviceNumber": "DEV001",
    "apiUrl": "https://efris.ura.go.ug/api/v1",
    "environment": "production" // or "sandbox"
  },
  "isActive": true
}
```

### Step 3: Configure Webhook for Invoice Events

```typescript
// The webhook will be automatically triggered when invoices are created
// Configure in your integration settings:

{
  "eventType": "invoice.created",
  "url": "https://efris.ura.go.ug/api/v1/invoice",
  "secret": "your_webhook_secret",
  "maxRetries": 3,
  "timeoutSeconds": 30
}
```

### Step 4: Enable Automatic Webhook Emission

The webhook will be automatically sent when you create an invoice. The webhook payload includes:

```json
{
  "event": "invoice.created",
  "timestamp": "2025-12-18T10:30:00Z",
  "organizationId": "org_123",
  "data": {
    "id": "inv_456",
    "invoiceNumber": "INV-2025-0001",
    "invoiceDate": "2025-12-18",
    "dueDate": "2026-01-18",
    "currency": "UGX",
    "total": 1180000,
    "taxAmount": 180000,
    "customer": {
      "name": "Acme Corp",
      "tin": "9876543210",
      "email": "billing@acme.com",
      "phone": "+256700000000",
      "address": "Kampala, Uganda"
    },
    "items": [
      {
        "description": "Web Development Services",
        "quantity": 1,
        "unitPrice": 1000000,
        "taxRate": 18,
        "taxAmount": 180000,
        "total": 1180000
      }
    ]
  }
}
```

## EFRIS API Implementation Example

### Invoice Submission Service

```typescript
// src/services/efris-service.ts

import { createSign } from 'crypto';

interface EFRISInvoice {
  sellerDetails: {
    tin: string;
    legalName: string;
    businessName: string;
    address: string;
    phoneNumber: string;
    emailAddress: string;
  };
  buyerDetails: {
    buyerTin: string;
    buyerLegalName: string;
    buyerBusinessName: string;
    buyerAddress: string;
    buyerPhoneNumber: string;
    buyerEmailAddress: string;
  };
  basicInformation: {
    invoiceNo: string;
    invoiceDate: string;
    invoiceType: string; // "1" for normal invoice
    currency: string;
    exchangeRate: number;
  };
  goodsDetails: Array<{
    item: string;
    itemCode: string;
    qty: number;
    unitOfMeasure: string;
    unitPrice: number;
    total: number;
    taxRate: number;
    tax: number;
    discountTotal: number;
    discountTaxRate: number;
  }>;
  taxDetails: Array<{
    taxCategory: string;
    netAmount: number;
    taxRate: number;
    taxAmount: number;
    grossAmount: number;
  }>;
  summary: {
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
  };
}

export class EFRISService {
  private privateKey: string;
  private tin: string;
  private deviceNumber: string;
  private apiUrl: string;

  constructor(integration: any) {
    this.privateKey = integration.apiKey;
    this.tin = integration.config.tin;
    this.deviceNumber = integration.config.deviceNumber;
    this.apiUrl = integration.config.apiUrl;
  }

  // Submit invoice to EFRIS
  async submitInvoice(invoice: any): Promise<{
    success: boolean;
    fdn?: string;
    qrCode?: string;
    error?: string;
  }> {
    try {
      // Transform YourBooks invoice to EFRIS format
      const efrisInvoice = this.transformToEFRISFormat(invoice);

      // Sign the request
      const signature = this.signRequest(efrisInvoice);

      // Send to EFRIS API
      const response = await fetch(`${this.apiUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TIN': this.tin,
          'X-Device-Number': this.deviceNumber,
          'X-Signature': signature,
        },
        body: JSON.stringify(efrisInvoice),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        return {
          success: true,
          fdn: result.fiscalDocumentNumber,
          qrCode: result.qrCode,
        };
      } else {
        return {
          success: false,
          error: result.message || 'EFRIS submission failed',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Transform invoice to EFRIS format
  private transformToEFRISFormat(invoice: any): EFRISInvoice {
    return {
      sellerDetails: {
        tin: this.tin,
        legalName: invoice.organization.legalName,
        businessName: invoice.organization.name,
        address: invoice.organization.address,
        phoneNumber: invoice.organization.phone,
        emailAddress: invoice.organization.email,
      },
      buyerDetails: {
        buyerTin: invoice.customer.taxIdNumber || '',
        buyerLegalName: invoice.customer.companyName || `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        buyerBusinessName: invoice.customer.companyName || '',
        buyerAddress: this.formatAddress(invoice.customer.billingAddress),
        buyerPhoneNumber: invoice.customer.phone || '',
        buyerEmailAddress: invoice.customer.email,
      },
      basicInformation: {
        invoiceNo: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        invoiceType: '1', // Normal invoice
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate || 1,
      },
      goodsDetails: invoice.items.map((item: any, index: number) => ({
        item: item.description,
        itemCode: item.product?.sku || `ITEM${index + 1}`,
        qty: item.quantity,
        unitOfMeasure: 'EA', // Each
        unitPrice: item.unitPrice,
        total: item.total,
        taxRate: item.taxRate,
        tax: item.taxAmount,
        discountTotal: item.discount || 0,
        discountTaxRate: 0,
      })),
      taxDetails: [
        {
          taxCategory: 'VAT', // Or 'EXEMPT', 'ZERO_RATED'
          netAmount: invoice.subtotal,
          taxRate: 18, // Uganda VAT rate
          taxAmount: invoice.taxAmount,
          grossAmount: invoice.total,
        },
      ],
      summary: {
        netAmount: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        grossAmount: invoice.total,
      },
    };
  }

  // Sign request with private key
  private signRequest(data: any): string {
    const dataString = JSON.stringify(data);
    const sign = createSign('SHA256');
    sign.update(dataString);
    sign.end();
    return sign.sign(this.privateKey, 'base64');
  }

  // Format address from JSON
  private formatAddress(address: any): string {
    if (!address) return '';
    return `${address.street}, ${address.city}, ${address.state}, ${address.country}`;
  }

  // Verify EFRIS signature (for responses)
  async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    const verify = createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }
}
```

### Update Invoice Service to Emit Webhooks

```typescript
// src/services/invoice-service.ts

import { emitInvoiceCreated, emitInvoiceSent } from '@/lib/webhooks';

export async function createInvoice(data: any): Promise<Invoice> {
  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      ...data,
    },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  });

  // Emit webhook event for EFRIS integration
  await emitInvoiceCreated(invoice.organizationId, invoice);

  return invoice;
}

export async function sendInvoice(invoiceId: string): Promise<Invoice> {
  // Update invoice status
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'SENT' },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  });

  // Emit webhook event
  await emitInvoiceSent(invoice.organizationId, invoice);

  // Send email to customer
  // ...

  return invoice;
}
```

### Webhook Handler for EFRIS Response

```typescript
// src/app/api/webhooks/efris/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature
    const signature = request.headers.get('X-EFRIS-Signature');
    const timestamp = request.headers.get('X-EFRIS-Timestamp');
    
    // Validate signature
    // const isValid = await verifyEFRISSignature(body, signature);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Extract EFRIS response
    const {
      invoiceNumber,
      fiscalDocumentNumber,
      qrCode,
      verificationUrl,
    } = body;

    // Find invoice
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update invoice with EFRIS data
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        metadata: {
          ...invoice.metadata,
          efris: {
            fdn: fiscalDocumentNumber,
            qrCode,
            verificationUrl,
            submittedAt: new Date().toISOString(),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EFRIS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

## Testing EFRIS Integration

### 1. Use EFRIS Sandbox Environment

```typescript
// Test with sandbox credentials
{
  "config": {
    "tin": "TEST1234567890",
    "deviceNumber": "TEST_DEV001",
    "apiUrl": "https://efris-sandbox.ura.go.ug/api/v1",
    "environment": "sandbox"
  }
}
```

### 2. Test Invoice Creation

```bash
# Create test invoice
curl -X POST http://localhost:3000/api/demo-company/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer_id",
    "invoiceDate": "2025-12-18",
    "dueDate": "2026-01-18",
    "items": [
      {
        "description": "Test Service",
        "quantity": 1,
        "unitPrice": 100000,
        "taxRate": 18
      }
    ]
  }'
```

### 3. Verify Webhook Was Sent

```bash
# Check webhook logs
GET /api/demo-company/integrations/integration_id
# Look at the syncLogs to see webhook attempts
```

### 4. Check Invoice Metadata for FDN

```bash
# Get invoice
GET /api/demo-company/invoices/invoice_id
# Check metadata.efris.fdn field
```

## Invoice Template with EFRIS Data

```html
<!-- Add to invoice PDF/print template -->
<div class="fiscal-info">
  <h3>Fiscal Information</h3>
  <p><strong>FDN:</strong> {{ invoice.metadata.efris.fdn }}</p>
  <p><strong>Verification URL:</strong> {{ invoice.metadata.efris.verificationUrl }}</p>
  <img src="data:image/png;base64,{{ invoice.metadata.efris.qrCode }}" alt="QR Code" />
  <p class="disclaimer">This is a fiscally registered invoice. Scan QR code to verify.</p>
</div>
```

## Compliance Checklist

- [ ] Business registered with URA
- [ ] EFRIS credentials obtained
- [ ] Integration configured in YourBooks
- [ ] Webhooks enabled for invoice events
- [ ] Test invoices submitted successfully
- [ ] FDN stored in invoice metadata
- [ ] QR codes displayed on invoices
- [ ] Customer copies include fiscal information
- [ ] Monthly reconciliation with EFRIS
- [ ] Backup of all FDNs maintained

## Troubleshooting

### Issue: Webhook Not Firing
**Solution**: Check integration status is ACTIVE and webhook is enabled

### Issue: EFRIS API Returns Error 400
**Solution**: Verify invoice data format matches EFRIS specification. Check TIN format, currency codes, and tax rates.

### Issue: Signature Verification Failed
**Solution**: Ensure private key is correct and signature algorithm matches EFRIS requirements (SHA256)

### Issue: Timeout Errors
**Solution**: Increase webhook timeout to 60 seconds. EFRIS API can be slow during peak hours.

### Issue: Duplicate Invoice Numbers
**Solution**: Each invoice number must be unique. YourBooks auto-generates sequential numbers.

## Support

For EFRIS-specific issues:
- URA Helpdesk: +256-800-117-000
- Email: info@ura.go.ug
- Website: https://efris.ura.go.ug

For YourBooks integration issues:
- Documentation: /ENTERPRISE_FEATURES.md
- Webhook logs: /api/[orgSlug]/integrations/[id]
- API status: Check webhook execution logs

## Additional Resources

- EFRIS API Documentation: https://efris.ura.go.ug/docs
- Uganda Tax Calculator: https://ura.go.ug/calculator
- EFRIS User Manual: https://efris.ura.go.ug/manual.pdf
