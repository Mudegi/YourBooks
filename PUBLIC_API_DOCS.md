# YourBooks Public API Documentation

## Overview

YourBooks provides a RESTful API for external systems to access your accounting data. This enables integrations with tax authority systems (like EFRIS), business intelligence tools, e-commerce platforms, and custom applications.

**Base URL**: `https://yourbooks.com/api/public/v1`

**Authentication**: API Key (Bearer token)

**Rate Limit**: 1000 requests/hour (configurable per key)

## Authentication

### Obtaining an API Key

1. Log in to YourBooks
2. Navigate to Settings → Integrations → API Keys
3. Click "Create API Key"
4. Provide a name and select permissions
5. **Save the key immediately** - it will only be shown once

### Using API Keys

Include the API key in the `Authorization` header of every request:

```bash
Authorization: Bearer ybk_your_api_key_here
```

### Example Request

```bash
curl -X GET "https://yourbooks.com/api/public/v1/invoices" \
  -H "Authorization: Bearer ybk_abc123def456..."
```

## Endpoints

### Invoices

#### List Invoices

```
GET /api/public/v1/invoices
```

**Query Parameters**:
- `status` (string): Filter by status (DRAFT, SENT, PAID, OVERDUE, etc.)
- `fromDate` (date): Start date (YYYY-MM-DD)
- `toDate` (date): End date (YYYY-MM-DD)
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (max: 100, default: 50)

**Required Permission**: `invoices:read`

**Response**:
```json
{
  "data": [
    {
      "id": "inv_123",
      "invoiceNumber": "INV-2025-0001",
      "invoiceDate": "2025-12-18T00:00:00Z",
      "dueDate": "2026-01-18T00:00:00Z",
      "status": "SENT",
      "currency": "USD",
      "exchangeRate": 1,
      "subtotal": 1000,
      "taxAmount": 180,
      "discountAmount": 0,
      "total": 1180,
      "amountPaid": 0,
      "amountDue": 1180,
      "customer": {
        "id": "cust_456",
        "customerNumber": "CUST-0001",
        "companyName": "Acme Corp",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@acme.com",
        "phone": "+1-555-0100",
        "taxIdNumber": "123456789",
        "billingAddress": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zip": "10001",
          "country": "US"
        }
      },
      "items": [
        {
          "id": "item_789",
          "description": "Web Development Services",
          "quantity": 1,
          "unitPrice": 1000,
          "discount": 0,
          "taxRate": 18,
          "taxAmount": 180,
          "total": 1180,
          "product": {
            "id": "prod_101",
            "name": "Web Development",
            "sku": "WEB-DEV-001",
            "description": "Custom web development"
          }
        }
      ],
      "metadata": null,
      "createdAt": "2025-12-18T10:00:00Z",
      "updatedAt": "2025-12-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

**Example**:
```bash
# Get all paid invoices in December 2025
curl -X GET "https://yourbooks.com/api/public/v1/invoices?status=PAID&fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer ybk_abc123..."
```

#### Get Single Invoice

```
GET /api/public/v1/invoices/{id}
```

**Required Permission**: `invoices:read`

**Response**: Same as invoice object in list response

**Example**:
```bash
curl -X GET "https://yourbooks.com/api/public/v1/invoices/inv_123" \
  -H "Authorization: Bearer ybk_abc123..."
```

### Transactions

#### List Transactions

```
GET /api/public/v1/transactions
```

**Query Parameters**:
- `fromDate` (date): Start date (YYYY-MM-DD)
- `toDate` (date): End date (YYYY-MM-DD)
- `type` (string): Transaction type (JOURNAL, INVOICE, PAYMENT, etc.)
- `status` (string): Status (DRAFT, POSTED, VOID)
- `page` (integer): Page number
- `limit` (integer): Results per page (max: 100)

**Required Permission**: `transactions:read`

**Response**:
```json
{
  "data": [
    {
      "id": "txn_123",
      "transactionNumber": "TXN-2025-0001",
      "transactionDate": "2025-12-18T00:00:00Z",
      "transactionType": "INVOICE",
      "referenceType": "Invoice",
      "referenceId": "inv_123",
      "description": "Invoice INV-2025-0001",
      "status": "POSTED",
      "ledgerEntries": [
        {
          "id": "entry_456",
          "entryType": "DEBIT",
          "amount": 1180,
          "account": {
            "id": "acc_789",
            "code": "1200",
            "name": "Accounts Receivable",
            "accountType": "ASSET"
          }
        },
        {
          "id": "entry_457",
          "entryType": "CREDIT",
          "amount": 1000,
          "account": {
            "id": "acc_790",
            "code": "4000",
            "name": "Sales Revenue",
            "accountType": "REVENUE"
          }
        },
        {
          "id": "entry_458",
          "entryType": "CREDIT",
          "amount": 180,
          "account": {
            "id": "acc_791",
            "code": "2300",
            "name": "Sales Tax Payable",
            "accountType": "LIABILITY"
          }
        }
      ],
      "createdAt": "2025-12-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

**Example**:
```bash
# Get all posted transactions in December 2025
curl -X GET "https://yourbooks.com/api/public/v1/transactions?status=POSTED&fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer ybk_abc123..."
```

## Webhook Events

When you configure webhooks in your integration settings, YourBooks will send HTTP POST requests to your specified URL when events occur.

### Webhook Payload Format

```json
{
  "event": "invoice.created",
  "timestamp": "2025-12-18T10:30:00Z",
  "organizationId": "org_123",
  "data": {
    "id": "inv_456",
    "invoiceNumber": "INV-2025-0001",
    // ... full invoice object
  }
}
```

### Webhook Headers

```
Content-Type: application/json
X-Webhook-Signature: sha256_hmac_signature
X-Webhook-Event: invoice.created
X-Webhook-Timestamp: 2025-12-18T10:30:00Z
User-Agent: YourBooks-Webhook/1.0
```

### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Express.js example
app.post('/webhooks/yourbooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your_webhook_secret';
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { event, data } = req.body;
  
  if (event === 'invoice.created') {
    // Handle invoice creation
    console.log('New invoice:', data.invoiceNumber);
  }
  
  res.json({ success: true });
});
```

### Available Events

- `invoice.created` - New invoice created
- `invoice.sent` - Invoice sent to customer
- `invoice.paid` - Invoice marked as paid
- `invoice.overdue` - Invoice became overdue
- `invoice.voided` - Invoice voided/cancelled
- `payment.received` - Payment received from customer
- `bill.created` - New bill created
- `bill.paid` - Bill marked as paid
- `customer.created` - New customer added
- `vendor.created` - New vendor added
- `transaction.posted` - GL transaction posted
- `bank.reconciled` - Bank account reconciled

### Webhook Retry Logic

- If your endpoint returns non-2xx status, YourBooks will retry
- Retry schedule: 1s, 2s, 4s (exponential backoff)
- Maximum 3 retry attempts
- After 50 failed webhooks in 24 hours, webhook is automatically disabled

## API Permissions

When creating an API key, you can grant specific permissions:

### Available Permissions

- `*` - Full access (all permissions)
- `invoices:read` - Read invoices
- `invoices:write` - Create/update invoices
- `transactions:read` - Read GL transactions
- `customers:read` - Read customer data
- `customers:write` - Create/update customers
- `vendors:read` - Read vendor data
- `vendors:write` - Create/update vendors
- `reports:read` - Access financial reports
- `bills:read` - Read bills
- `bills:write` - Create/update bills
- `payments:read` - Read payments
- `payments:write` - Record payments

### Permission Examples

```json
// Read-only access to invoices and customers
{
  "name": "EFRIS Integration",
  "permissions": ["invoices:read", "customers:read"]
}

// Full access to invoices
{
  "name": "E-commerce Platform",
  "permissions": ["invoices:read", "invoices:write", "customers:write"]
}

// Full system access
{
  "name": "Admin API Key",
  "permissions": ["*"]
}
```

## Rate Limiting

### Default Limits

- **1000 requests per hour** per API key (configurable)
- Rate limit resets every hour
- Limit tracked by API key, not IP address

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 2025-12-18T11:00:00Z
```

### Exceeding Rate Limit

When rate limit is exceeded, you'll receive:

**Status**: 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "limit": 1000,
  "reset": "2025-12-18T11:00:00Z"
}
```

### Best Practices

1. Cache responses when possible
2. Use webhooks instead of polling
3. Implement exponential backoff on errors
4. Request rate limit increase if needed

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Code Examples

### Python

```python
import requests

API_KEY = "ybk_your_api_key"
BASE_URL = "https://yourbooks.com/api/public/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get invoices
response = requests.get(
    f"{BASE_URL}/invoices",
    headers=headers,
    params={"status": "SENT", "limit": 10}
)

invoices = response.json()
for invoice in invoices["data"]:
    print(f"{invoice['invoiceNumber']}: ${invoice['total']}")
```

### Node.js

```javascript
const axios = require('axios');

const API_KEY = 'ybk_your_api_key';
const BASE_URL = 'https://yourbooks.com/api/public/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Get invoices
async function getInvoices() {
  try {
    const response = await api.get('/invoices', {
      params: {
        status: 'SENT',
        limit: 10
      }
    });
    
    const invoices = response.data.data;
    invoices.forEach(invoice => {
      console.log(`${invoice.invoiceNumber}: $${invoice.total}`);
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getInvoices();
```

### PHP

```php
<?php

$apiKey = 'ybk_your_api_key';
$baseUrl = 'https://yourbooks.com/api/public/v1';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/invoices?status=SENT&limit=10');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    foreach ($data['data'] as $invoice) {
        echo $invoice['invoiceNumber'] . ': $' . $invoice['total'] . "\n";
    }
} else {
    echo "Error: " . $response . "\n";
}
```

## Testing

### Sandbox Environment

Use sandbox credentials for testing:

- **Base URL**: `https://yourbooks.com/api/public/v1` (same URL, different org)
- **Test API Key**: Generate in your test organization
- **Test Data**: Create test invoices/transactions in your test org

### Postman Collection

Import our Postman collection for easy testing:

[Download YourBooks API Collection](https://yourbooks.com/api/postman-collection.json)

### cURL Examples

```bash
# List invoices
curl -X GET "https://yourbooks.com/api/public/v1/invoices?limit=10" \
  -H "Authorization: Bearer ybk_abc123..."

# Get specific invoice
curl -X GET "https://yourbooks.com/api/public/v1/invoices/inv_123" \
  -H "Authorization: Bearer ybk_abc123..."

# Get transactions with date filter
curl -X GET "https://yourbooks.com/api/public/v1/transactions?fromDate=2025-12-01&toDate=2025-12-31&status=POSTED" \
  -H "Authorization: Bearer ybk_abc123..."
```

## Support

### Documentation
- Integration Guide: `/ENTERPRISE_FEATURES.md`
- EFRIS Integration: `/EFRIS_INTEGRATION.md`
- Developer Guide: `/ENTERPRISE_DEV_GUIDE.md`

### API Status
- Status Page: https://status.yourbooks.com
- API Changelog: https://yourbooks.com/changelog

### Contact
- Email: api@yourbooks.com
- Support Portal: https://support.yourbooks.com
- Community Forum: https://community.yourbooks.com

## Changelog

### v1.0.0 (2025-12-18)
- Initial public API release
- Invoice and transaction endpoints
- API key authentication
- Webhook support
- Rate limiting
