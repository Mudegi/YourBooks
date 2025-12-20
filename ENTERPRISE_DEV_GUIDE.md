# Enterprise Features - Developer Quick Reference

## Quick Start

### 1. Apply Database Migration

```bash
# Set PowerShell execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Run migration
npm exec prisma migrate dev -- --name add_multi_branch_and_integration_support

# Generate Prisma Client
npm exec prisma generate -- 

# Restart dev server
npm run dev
```

### 2. Access New Pages

- **Branch Management**: `http://localhost:3000/demo-company/settings/branches`
- **Integration Management**: `http://localhost:3000/demo-company/settings/integrations`

## API Quick Reference

### Branches API

```typescript
// List branches
fetch('/api/demo-company/branches?isActive=true&type=RETAIL_STORE')

// Create branch
fetch('/api/demo-company/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'NYC01',
    name: 'New York Store',
    type: 'RETAIL_STORE',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'US',
    postalCode: '10001',
    phone: '+1-212-555-0100',
    email: 'nyc@example.com',
    managerId: 'user_id_here',
    currency: 'USD',
    timezone: 'America/New_York',
  })
})

// Update branch
fetch('/api/demo-company/branches/branch_id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'NYC Flagship Store' })
})

// Delete branch
fetch('/api/demo-company/branches/branch_id', { method: 'DELETE' })
```

### Integrations API

```typescript
// List integrations
fetch('/api/demo-company/integrations?status=ACTIVE')

// Create integration
fetch('/api/demo-company/integrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Stripe Payments',
    type: 'PAYMENT_GATEWAY',
    provider: 'stripe',
    apiKey: 'sk_test_xxxxx',
    apiSecret: 'optional_secret',
    webhookUrl: 'https://yourbooks.com/webhooks/stripe',
    webhookSecret: 'whsec_xxxxx',
    config: { currency: 'USD' },
    syncFrequency: 'hourly',
  })
})

// Trigger sync
fetch('/api/demo-company/integrations/integration_id/sync', {
  method: 'POST'
})

// Update integration
fetch('/api/demo-company/integrations/integration_id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'ACTIVE' })
})
```

## Database Queries (Prisma)

### Branch Queries

```typescript
// Get all active branches
const branches = await prisma.branch.findMany({
  where: {
    organizationId: org.id,
    isActive: true,
  },
  include: {
    _count: {
      select: {
        transactions: true,
        invoices: true,
        bills: true,
      }
    }
  }
})

// Get branch by code
const branch = await prisma.branch.findUnique({
  where: {
    organizationId_code: {
      organizationId: org.id,
      code: 'NYC01',
    }
  }
})

// Create branch
const branch = await prisma.branch.create({
  data: {
    organizationId: org.id,
    code: 'NYC01',
    name: 'New York Store',
    type: 'RETAIL_STORE',
    // ... other fields
  }
})

// Update branch
const branch = await prisma.branch.update({
  where: { id: branchId },
  data: { isActive: false }
})
```

### Integration Queries

```typescript
// Get all integrations
const integrations = await prisma.integration.findMany({
  where: {
    organizationId: org.id,
    status: 'ACTIVE',
  },
  include: {
    webhooks: true,
    syncLogs: {
      take: 10,
      orderBy: { startedAt: 'desc' }
    }
  }
})

// Create integration
const integration = await prisma.integration.create({
  data: {
    organizationId: org.id,
    name: 'Stripe',
    type: 'PAYMENT_GATEWAY',
    provider: 'stripe',
    status: 'PENDING',
    apiKey: hashedApiKey,
    // ... other fields
  }
})

// Create sync log
const log = await prisma.integrationLog.create({
  data: {
    integrationId: integration.id,
    action: 'MANUAL_SYNC',
    status: 'PENDING',
    recordsProcessed: 0,
    recordsFailed: 0,
    startedAt: new Date(),
  }
})
```

### Branch-Enabled Queries

```typescript
// Create invoice with branch
const invoice = await prisma.invoice.create({
  data: {
    organizationId: org.id,
    branchId: 'branch_id_here',  // NEW FIELD
    customerId: customer.id,
    // ... other fields
  }
})

// Get transactions by branch
const transactions = await prisma.transaction.findMany({
  where: {
    organizationId: org.id,
    branchId: 'branch_id_here',
  }
})

// Get customers by branch
const customers = await prisma.customer.findMany({
  where: {
    organizationId: org.id,
    branchId: 'branch_id_here',
  }
})
```

## Enums

### BranchType
```typescript
enum BranchType {
  HEADQUARTERS
  OFFICE
  WAREHOUSE
  RETAIL_STORE
  MANUFACTURING
  DISTRIBUTION_CENTER
  SERVICE_CENTER
  REMOTE
}
```

### IntegrationType
```typescript
enum IntegrationType {
  PAYMENT_GATEWAY
  BANKING
  ACCOUNTING
  E_COMMERCE
  CRM
  INVENTORY
  PAYROLL
  TAX_FILING
  REPORTING
  CUSTOM_API
  WEBHOOK
}
```

### IntegrationStatus
```typescript
enum IntegrationStatus {
  ACTIVE
  INACTIVE
  ERROR
  PENDING
  SUSPENDED
}
```

## Component Examples

### Branch Selector Component (To Be Created)

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Branch {
  id: string;
  code: string;
  name: string;
}

export function BranchSelector({ 
  orgSlug, 
  value, 
  onChange 
}: { 
  orgSlug: string;
  value?: string;
  onChange: (branchId: string | null) => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    fetch(`/api/${orgSlug}/branches?isActive=true`)
      .then(res => res.json())
      .then(data => setBranches(data));
  }, [orgSlug]);

  return (
    <select 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value || null)}
      className="border rounded px-3 py-2"
    >
      <option value="">All Branches</option>
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.code} - {branch.name}
        </option>
      ))}
    </select>
  );
}
```

### Using Branch Selector in Forms

```typescript
// In invoice form
const [formData, setFormData] = useState({
  customerId: '',
  branchId: null,  // NEW FIELD
  invoiceDate: new Date(),
  // ... other fields
});

// In JSX
<BranchSelector
  orgSlug={orgSlug}
  value={formData.branchId}
  onChange={(branchId) => setFormData({ ...formData, branchId })}
/>
```

## Testing Checklist

### Branch Management
- [ ] Create headquarters branch
- [ ] Create retail store branch
- [ ] List all branches (verify statistics)
- [ ] Filter by active/inactive
- [ ] Update branch information
- [ ] Deactivate branch
- [ ] Verify branch appears in dropdowns
- [ ] Create transaction with branch assigned

### Integration Management
- [ ] Create test integration (type: PAYMENT_GATEWAY)
- [ ] Verify API key is hashed
- [ ] Update integration status
- [ ] Trigger manual sync
- [ ] View sync logs
- [ ] Create integration with webhooks
- [ ] Deactivate integration
- [ ] Delete integration

### Branch-Enabled Transactions
- [ ] Create invoice with branch
- [ ] Create bill with branch
- [ ] Assign customer to branch
- [ ] Assign vendor to branch
- [ ] Create bank account for branch
- [ ] Filter reports by branch

## Common Issues & Solutions

### Issue: PowerShell Execution Policy Error
```
Solution: Run this before npx commands:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

### Issue: Branch Code Already Exists
```
Solution: Each branch must have a unique code per organization.
Check existing codes before creating new branches.
```

### Issue: Cannot Delete Branch
```
Solution: Branches with transactions are soft-deleted (deactivated).
Use PATCH to update isActive to false instead of DELETE.
```

### Issue: API Credentials Not Hashing
```
Solution: Ensure crypto module is imported:
import { createHash } from 'crypto';

Hash before storing:
const hashedKey = createHash('sha256').update(apiKey).digest('hex');
```

## Performance Tips

### Use Indexes Efficiently
```typescript
// Indexes are automatically created for:
// - Branch: [organizationId], [branchId], [isActive]
// - Integration: [organizationId], [integrationId], [status]

// Optimize queries by using indexed fields in WHERE clauses
await prisma.branch.findMany({
  where: { 
    organizationId: org.id,  // Uses index
    isActive: true,           // Uses index
  }
})
```

### Paginate Large Results
```typescript
// For integrations with many sync logs
const integrations = await prisma.integration.findMany({
  where: { organizationId: org.id },
  include: {
    syncLogs: {
      take: 10,              // Limit results
      orderBy: { startedAt: 'desc' },
      skip: page * 10,       // For pagination
    }
  }
})
```

### Use Transactions for Sync Operations
```typescript
// Wrap sync operations in Prisma transaction
await prisma.$transaction(async (tx) => {
  // Update records
  const updated = await tx.invoice.updateMany({...});
  
  // Create log
  await tx.integrationLog.create({
    data: {
      integrationId,
      recordsProcessed: updated.count,
      // ...
    }
  });
});
```

## Security Best Practices

1. **Never Return Raw API Keys**
   ```typescript
   // BAD
   return integration;
   
   // GOOD
   const { apiKey, apiSecret, ...safe } = integration;
   return safe;
   ```

2. **Always Hash Credentials**
   ```typescript
   const hashedKey = createHash('sha256').update(apiKey).digest('hex');
   ```

3. **Validate Webhook Signatures**
   ```typescript
   const expectedSignature = createHmac('sha256', webhookSecret)
     .update(payload)
     .digest('hex');
   
   if (signature !== expectedSignature) {
     throw new Error('Invalid signature');
   }
   ```

4. **Enforce Rate Limits**
   ```typescript
   const apiKey = await prisma.apiKey.findUnique({
     where: { key: hashedKey }
   });
   
   // Check rate limit before processing
   if (requestCount > apiKey.rateLimit) {
     throw new Error('Rate limit exceeded');
   }
   ```

## File Locations Reference

```
Database:
├── prisma/schema.prisma                    # Branch + Integration models

API Routes:
├── src/app/api/[orgSlug]/branches/
│   ├── route.ts                            # GET, POST
│   └── [id]/route.ts                       # GET, PATCH, DELETE
├── src/app/api/[orgSlug]/integrations/
│   ├── route.ts                            # GET, POST
│   ├── [id]/route.ts                       # GET, PATCH, DELETE
│   └── [id]/sync/route.ts                  # POST

UI Pages:
├── src/app/(dashboard)/[orgSlug]/settings/
│   ├── branches/page.tsx                   # Branch management UI
│   └── integrations/page.tsx               # Integration management UI

Documentation:
├── ENTERPRISE_FEATURES.md                  # Comprehensive guide
├── ENTERPRISE_IMPLEMENTATION_SUMMARY.md    # Implementation details
└── ENTERPRISE_DEV_GUIDE.md                 # This file
```

## Next Development Tasks

Priority order for completing Phase 15:

1. **Branch Selection Component** (2 hours)
   - Create reusable BranchSelector component
   - Add to Invoice form
   - Add to Bill form
   - Add to Transaction form

2. **Branch Filtering in Reports** (3 hours)
   - Add branch filter to Balance Sheet
   - Add branch filter to P&L
   - Add branch filter to Cash Flow
   - Add branch filter to Trial Balance
   - Add branch filter to Aged Receivables/Payables

3. **Webhook Middleware** (4 hours)
   - Create webhook handler middleware
   - Implement signature verification
   - Add retry logic
   - Create webhook log entries
   - Error handling and alerting

4. **API Key Authentication** (3 hours)
   - Create API key middleware
   - Implement rate limiting
   - Add permission checking
   - Track last used timestamp
   - Create API key management UI

5. **Provider Adapters** (6 hours)
   - Stripe payment sync adapter
   - QuickBooks invoice sync adapter
   - Generic webhook sender
   - Error handling per provider
   - Sync scheduling system

**Total Estimated Time**: 18 hours to complete Phase 15

---

**Last Updated**: December 18, 2025
