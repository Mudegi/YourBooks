# Journal Entries List - Quick Reference

## File Locations

### Core Service
- **Service**: `src/services/accounting/journal-list.service.ts`
- **UI Component**: `src/app/(dashboard)/[orgSlug]/general-ledger/journal-entries/list/page.tsx`

### API Endpoints
- **List**: `src/app/api/orgs/[orgSlug]/journal-entries/route.ts`
- **Reverse**: `src/app/api/orgs/[orgSlug]/journal-entries/[id]/reverse/route.ts`
- **Bulk Approve**: `src/app/api/orgs/[orgSlug]/journal-entries/bulk-approve/route.ts`
- **Export**: `src/app/api/orgs/[orgSlug]/journal-entries/export/route.ts`

### Localization
- **Provider**: `src/lib/localization/localization-provider.ts`
- **Uganda Driver**: `src/lib/localization/drivers/uganda-driver.ts`
- **Kenya Driver**: `src/lib/localization/drivers/kenya-driver.ts`

---

## API Quick Reference

### Get Journal Entries
```http
GET /api/orgs/{orgSlug}/journal-entries?page=1&limit=50

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 50, max: 200)
- startDate: Filter start date (ISO 8601)
- endDate: Filter end date (ISO 8601)
- branchId: Filter by branch
- transactionType: JOURNAL_ENTRY, INVOICE, BILL, etc.
- status: DRAFT, POSTED, VOIDED, CANCELLED
- createdBy: User ID
- search: Full-text search
- minAmount: Minimum amount
- maxAmount: Maximum amount
```

### Reverse Entry
```http
POST /api/orgs/{orgSlug}/journal-entries/{id}/reverse

Body:
{
  "reason": "Correction of account classification error"
}
```

### Bulk Approve
```http
POST /api/orgs/{orgSlug}/journal-entries/bulk-approve

Body:
{
  "entryIds": ["entry-id-1", "entry-id-2", ...]
}
```

### Export to Excel
```http
GET /api/orgs/{orgSlug}/journal-entries/export?format=excel&startDate=2026-01-01

Query Parameters: Same as List endpoint
```

---

## Service Methods

### JournalListService

```typescript
// Get journal entries with filters
const result = await journalListService.getJournalEntries(
  organizationId,
  {
    accountingPeriod: { startDate: new Date(), endDate: new Date() },
    branchId: 'branch-id',
    status: 'POSTED',
    search: 'keyword'
  },
  { page: 1, limit: 50 }
);

// Create reverse entry
const reverseId = await journalListService.createReverseEntry(
  organizationId,
  originalEntryId,
  userId,
  'Reason for reversal'
);

// Bulk approve
const { successful, failed } = await journalListService.bulkApproveEntries(
  organizationId,
  ['id1', 'id2', 'id3'],
  approverId
);
```

---

## UI Components

### Filter States
```typescript
const [filters, setFilters] = useState<JournalEntryFilters>({
  accountingPeriod: { startDate: '2026-01-01', endDate: '2026-12-31' },
  branchId: 'kampala-branch',
  transactionType: 'JOURNAL_ENTRY',
  status: 'DRAFT',
  amountRange: { min: 0, max: 1000000 },
  createdBy: 'user-id',
  search: 'search term'
});
```

### Actions
```typescript
// Select entries
toggleEntrySelection(entryId);
selectAllEntries();

// Bulk approve
handleBulkApprove();

// Reverse entry
handleReverseEntry(entryId);

// Export
handleExportToExcel();
```

---

## Localization Metadata

### Get Entry Metadata
```typescript
const metadata = await localizationProvider.getEntryMetadata({
  organizationId: 'org-id',
  country: 'UG',
  language: 'en'
});

// Returns:
{
  complianceFlags: {
    vatTracking: { required: true, uraCompliance: true },
    witholdingTax: { tracking: true, rates: [0.06, 0.1, 0.15] }
  },
  displayRules: {
    currencyFormat: 'en-UG',
    dateFormat: 'dd/MM/yyyy',
    amountPrecision: 2
  },
  validationRules: {
    requiredFields: ['transactionDate', 'description', 'amount', 'taxAmount'],
    balanceCheckRequired: true,
    attachmentRules: { required: true }
  },
  auditTrailRequirements: {
    trackAllChanges: true,
    retentionPeriod: 6,
    immutableAfterPosting: true
  }
}
```

### Validate Compliance
```typescript
const validation = await localizationProvider.validateJournalEntryCompliance(
  { organizationId, country: 'UG' },
  entryData
);

// Returns:
{
  isCompliant: false,
  errors: ['Missing required field: taxAmount'],
  warnings: ['Recommended to attach supporting documents'],
  recommendations: []
}
```

---

## Country-Specific Rules

### Uganda (UG)
```typescript
complianceFlags: {
  vatTracking: { required: true, uraCompliance: true, efrisIntegration: true },
  witholdingTax: { tracking: true, rates: [0.06, 0.1, 0.15] },
  foreignExchange: { trackingRequired: true, bankOfUgandaRates: true }
}
retentionPeriod: 6 years
approvalThresholds: { level1: 1000000, level2: 5000000 } // UGX
```

### Kenya (KE)
```typescript
complianceFlags: {
  vatTracking: { required: true, kraCompliance: true, etimsIntegration: true },
  witholdingTax: { tracking: true, rates: [0.05, 0.1, 0.2, 0.3] }
}
retentionPeriod: 5 years
```

### United States (US)
```typescript
complianceFlags: {
  gaapCompliance: { required: true, fasb: true, auditTrail: true },
  taxCompliance: { irs: true, stateCompliance: true }
}
retentionPeriod: 7 years
approvalThresholds: { level1: 10000, level2: 50000 } // USD
```

---

## Common Patterns

### Filtering by Period
```typescript
// Current month
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

setFilters({
  accountingPeriod: {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
});
```

### Finding Unbalanced Entries
```typescript
// Filter client-side for unbalanced entries
const unbalancedEntries = entries.filter(entry => !entry.metadata.isBalanced);
```

### High-Value Transactions
```typescript
setFilters({
  amountRange: {
    min: 5000000, // 5M UGX or equivalent
    max: Number.MAX_SAFE_INTEGER
  }
});
```

### Pending Approvals
```typescript
setFilters({
  status: 'DRAFT',
  createdBy: 'junior-accountant-id'
});
```

---

## Permissions Required

### View Journal Entries
```typescript
Section: GENERAL_LEDGER
Action: VIEW
```

### Create/Edit Journal Entries
```typescript
Section: GENERAL_LEDGER
Action: EDIT
```

### Approve Journal Entries
```typescript
Section: GENERAL_LEDGER
Action: EDIT // or APPROVE if separate permission exists
```

### Reverse Journal Entries
```typescript
Section: GENERAL_LEDGER
Action: EDIT
```

---

## Error Handling

### Common Errors

**Entry Not Found**
```typescript
{
  success: false,
  error: 'Journal entry not found',
  status: 404
}
```

**Cannot Reverse Voided Entry**
```typescript
{
  success: false,
  error: 'Cannot reverse a voided transaction',
  status: 400
}
```

**Unbalanced Entry**
```typescript
{
  isCompliant: false,
  errors: ['Journal entry is not balanced (Debits ≠ Credits)']
}
```

**Missing Required Fields**
```typescript
{
  isCompliant: false,
  errors: [
    'Missing required field: taxAmount',
    'Missing required field: description'
  ]
}
```

---

## Performance Tips

1. **Use Pagination**: Don't load all entries at once
   ```typescript
   { page: 1, limit: 50 } // Optimal for most screens
   ```

2. **Index Your Queries**: Ensure database indexes on:
   - `organizationId + transactionDate`
   - `organizationId + status`
   - `branchId`

3. **Cache Organization Settings**: Reduce repeated API calls
   ```typescript
   const { organization } = useOrganization(); // Cached
   ```

4. **Limit Export Size**: For large datasets, use date filters
   ```typescript
   // Export specific month only
   const filters = { 
     accountingPeriod: { startDate, endDate } 
   };
   ```

---

## Testing Commands

### Unit Tests
```bash
npm test src/services/accounting/journal-list.service.test.ts
npm test src/lib/localization/localization-provider.test.ts
```

### Integration Tests
```bash
npm test src/app/api/orgs/[orgSlug]/journal-entries/route.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- --grep "Journal Entries List"
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Entries not loading | Check RBAC permissions, verify organizationId |
| Foreign currency not showing | Set `showForeignCurrency: true` in display rules |
| Bulk approve fails | Ensure entries are DRAFT and balanced |
| Export timing out | Reduce date range or add pagination |
| Balance check failing | Verify Decimal precision in database |
| Localization not applying | Check organization.homeCountry is set |

---

## Dependencies

```json
{
  "@prisma/client": "^5.x",
  "next": "^14.x",
  "react": "^18.x",
  "lucide-react": "^0.x",
  "xlsx": "^0.x"
}
```

---

## Related Documentation

- [Full Implementation Guide](JOURNAL_ENTRIES_LIST_IMPLEMENTATION.md)
- [Localization Guide](src/lib/localization/README.md)
- [RBAC Documentation](src/lib/rbac.ts)
- [Architecture Overview](ARCHITECTURE.md)