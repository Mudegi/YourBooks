# Enterprise Features

YourBooks now supports enterprise-level features for multi-location businesses and third-party system integrations.

## Multi-Branch Support

Manage multiple business locations with branch-specific tracking and consolidated reporting.

### Branch Types
- **Headquarters** - Main corporate office
- **Office** - Branch office location
- **Warehouse** - Storage and distribution facility
- **Retail Store** - Customer-facing sales location
- **Manufacturing** - Production facility
- **Distribution Center** - Regional distribution hub
- **Service Center** - Customer service location
- **Remote** - Remote/virtual location

### Features
- Branch-specific transactions, invoices, and bills
- Assign customers and vendors to branches
- Branch-level bank accounts and inventory tracking
- Manager assignment per branch
- Branch-specific tax ID, currency, and timezone
- Consolidated organization-level reporting
- Branch filtering in all reports
- Inter-branch transfer transactions

### API Endpoints

```typescript
// Get all branches
GET /api/[orgSlug]/branches?isActive=true&type=RETAIL_STORE

// Create a branch
POST /api/[orgSlug]/branches
{
  "code": "NYC01",
  "name": "New York Store",
  "type": "RETAIL_STORE",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "US",
  "postalCode": "10001",
  "phone": "+1-212-555-0100",
  "email": "nyc@example.com",
  "managerId": "user_id",
  "isHeadquarters": false,
  "currency": "USD",
  "timezone": "America/New_York"
}

// Get branch details
GET /api/[orgSlug]/branches/[id]

// Update a branch
PATCH /api/[orgSlug]/branches/[id]

// Delete/Deactivate a branch
DELETE /api/[orgSlug]/branches/[id]
```

### Database Schema

```prisma
model Branch {
  id              String   @id @default(cuid())
  organizationId  String
  code            String   // Unique branch code
  name            String
  type            BranchType
  address         String?
  city            String?
  state           String?
  country         String?  @default("US")
  postalCode      String?
  phone           String?
  email           String?
  managerId       String?  // User ID
  isHeadquarters  Boolean  @default(false)
  isActive        Boolean  @default(true)
  openingDate     DateTime @default(now())
  closingDate     DateTime?
  taxIdNumber     String?
  currency        String   @default("USD")
  timezone        String   @default("UTC")
  metadata        Json?
  
  // Relations
  organization    Organization @relation(...)
  transactions    Transaction[]
  invoices        Invoice[]
  bills           Bill[]
  customers       Customer[]
  vendors         Vendor[]
  bankAccounts    BankAccount[]
  
  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([isActive])
}
```

## System Integrations

Connect YourBooks with external services for automated workflows and data synchronization.

### Integration Types
- **Payment Gateway** - Stripe, PayPal, Square, etc.
- **Banking** - Bank feed imports and reconciliation
- **Accounting** - QuickBooks, Xero, FreshBooks sync
- **E-commerce** - Shopify, WooCommerce, Magento
- **CRM** - Salesforce, HubSpot, Zoho
- **Inventory** - Inventory management systems
- **Payroll** - ADP, Gusto, Paychex
- **Tax Filing** - TurboTax, TaxJar
- **Reporting** - Business intelligence tools
- **Custom API** - Custom third-party APIs
- **Webhook** - Webhook-based integrations

### Features
- Encrypted API credential storage (SHA-256)
- Webhook configuration with retry logic
- Sync job scheduling and logging
- Error tracking and status monitoring
- API key management for third-party access
- Rate limiting (1000 requests/hour default)
- Scoped permissions per API key
- Integration status tracking (Active, Inactive, Error, Pending, Suspended)

### API Endpoints

```typescript
// Get all integrations
GET /api/[orgSlug]/integrations?isActive=true&type=PAYMENT_GATEWAY&status=ACTIVE

// Create an integration
POST /api/[orgSlug]/integrations
{
  "name": "Stripe Payments",
  "type": "PAYMENT_GATEWAY",
  "provider": "stripe",
  "status": "PENDING",
  "apiKey": "sk_test_...",
  "apiSecret": "...",
  "webhookUrl": "https://yourbooks.com/webhooks/stripe",
  "webhookSecret": "whsec_...",
  "config": {
    "currency": "USD",
    "captureMethod": "automatic"
  },
  "syncFrequency": "hourly"
}

// Get integration details with logs
GET /api/[orgSlug]/integrations/[id]

// Update an integration
PATCH /api/[orgSlug]/integrations/[id]

// Trigger manual sync
POST /api/[orgSlug]/integrations/[id]/sync

// Delete an integration
DELETE /api/[orgSlug]/integrations/[id]
```

### Webhook Configuration

Integrations can send webhooks to external services when events occur:

```typescript
model Webhook {
  id              String   @id
  integrationId   String
  eventType       String   // "invoice.created", "payment.received"
  url             String
  secret          String   // For signature verification
  isActive        Boolean  @default(true)
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  timeoutSeconds  Int      @default(30)
  lastTriggeredAt DateTime?
  lastSuccess     DateTime?
  lastFailure     DateTime?
  failureReason   String?
}
```

### API Key Management

Generate API keys for third-party applications to access your YourBooks data:

```typescript
model ApiKey {
  id          String    @id
  organizationId String
  name        String
  key         String    @unique  // Hashed
  prefix      String    // First 8 chars for display
  permissions String[]  // Scoped permissions
  rateLimit   Int       @default(1000)  // Per hour
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  isActive    Boolean   @default(true)
  createdBy   String    // User ID
}
```

### Webhook Event Types

Common webhook events that can be sent to external services:

- `invoice.created` - New invoice created
- `invoice.sent` - Invoice sent to customer
- `invoice.paid` - Invoice marked as paid
- `invoice.overdue` - Invoice became overdue
- `payment.received` - Payment received
- `bill.created` - New bill created
- `bill.paid` - Bill marked as paid
- `customer.created` - New customer added
- `transaction.posted` - GL transaction posted
- `bank.reconciled` - Bank account reconciled

### Integration Providers

#### Stripe Integration Example

```typescript
// Sync Stripe payments to YourBooks
async function syncStripePayments(integration: Integration) {
  const stripe = new Stripe(integration.apiKey);
  
  // Get payments since last sync
  const payments = await stripe.charges.list({
    created: { gt: lastSyncTimestamp },
    limit: 100,
  });
  
  // Create payments in YourBooks
  for (const charge of payments.data) {
    await createPayment({
      customerId: findCustomerByEmail(charge.billing_details.email),
      amount: charge.amount / 100,
      paymentDate: new Date(charge.created * 1000),
      paymentMethod: 'Credit Card',
      reference: charge.id,
      metadata: { stripe_charge_id: charge.id },
    });
  }
  
  // Log sync results
  await logSync(integration.id, {
    recordsProcessed: payments.data.length,
    recordsFailed: 0,
  });
}
```

#### QuickBooks Integration Example

```typescript
// Sync invoices to QuickBooks
async function syncToQuickBooks(integration: Integration) {
  const qbo = new QuickBooks({
    clientId: integration.apiKey,
    clientSecret: integration.apiSecret,
  });
  
  // Get unsync'd invoices
  const invoices = await getUnsyncedInvoices();
  
  for (const invoice of invoices) {
    const qbInvoice = await qbo.createInvoice({
      CustomerRef: { value: invoice.customer.qbId },
      TxnDate: invoice.invoiceDate,
      Line: invoice.items.map(item => ({
        Amount: item.total,
        Description: item.description,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: { value: item.product.qbId },
          Qty: item.quantity,
          UnitPrice: item.unitPrice,
        },
      })),
    });
    
    // Update invoice with QB ID
    await updateInvoice(invoice.id, {
      metadata: { quickbooks_id: qbInvoice.Id },
    });
  }
}
```

## UI Screenshots

### Branch Management
- View all branches with statistics
- Filter by active/inactive status
- Create and edit branches
- View branch-specific activity (transactions, customers, documents)

### Integration Management
- View all integrations with status
- Configure integration settings
- Trigger manual syncs
- View sync logs and error history
- Manage webhooks
- Popular integrations catalog

## Migration

To add enterprise features to an existing YourBooks installation:

```bash
# Update database schema
npx prisma migrate dev --name add_multi_branch_and_integration_support

# Generate Prisma Client
npx prisma generate
```

## Configuration

### Environment Variables

```env
# API Key Encryption
API_KEY_SECRET=your-secret-key-for-hashing

# Webhook Settings
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_MAX_RETRIES=3

# Rate Limiting
API_RATE_LIMIT_PER_HOUR=1000
```

## Security Considerations

1. **API Credentials**: All API keys and secrets are hashed before storage using SHA-256
2. **Webhook Signatures**: Webhook payloads should be verified using HMAC signatures
3. **Rate Limiting**: API keys have configurable rate limits (default 1000/hour)
4. **Scoped Permissions**: API keys can have limited permissions (read-only, write, admin)
5. **Audit Logging**: All integration sync operations are logged with timestamps
6. **Encryption at Rest**: Consider encrypting sensitive integration data at the database level
7. **HTTPS Only**: All webhook URLs must use HTTPS in production

## Future Enhancements

- [ ] Real-time sync with websockets
- [ ] OAuth 2.0 integration flow
- [ ] Integration marketplace
- [ ] Custom field mapping
- [ ] Data transformation rules
- [ ] Integration templates
- [ ] Sync conflict resolution
- [ ] Batch sync operations
- [ ] Integration monitoring dashboard
- [ ] Automated error recovery
