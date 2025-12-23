# COA Generator - Quick Reference

## 🚀 Quick Start (Copy & Paste Ready)

### 1. Generate COA for New Organization

```typescript
import { generateChartOfAccounts } from '@/lib/coa-generator';

const result = await generateChartOfAccounts({
  organizationId: 'org_abc123',
  industryType: 'RETAIL',      // See industry types below
  baseCurrency: 'USD',
  includeOptionalAccounts: true,
});

console.log(`Created ${result.accountsCreated} accounts`);
```

### 2. Use in Onboarding Flow

```typescript
import { completeOnboardingWithCOA } from '@/lib/onboarding-coa';

const result = await completeOnboardingWithCOA(
  {
    name: 'Acme Corp',
    slug: 'acme-corp',
    baseCurrency: 'USD',
    industryType: 'MANUFACTURING',
  },
  userId
);
```

### 3. API Endpoint Usage

```bash
# Generate COA
curl -X POST http://localhost:3000/api/orgs/demo-company/coa/generate \
  -H "Content-Type: application/json" \
  -d '{"industryType": "RETAIL"}'

# Check if can generate
curl http://localhost:3000/api/orgs/demo-company/coa/generate?action=check

# Preview accounts
curl http://localhost:3000/api/orgs/demo-company/coa/generate?action=preview&industry=RETAIL
```

---

## 📋 Industry Types

| Code | Label | Accounts |
|------|-------|----------|
| `GENERAL` | General Business | 33 |
| `RETAIL` | Retail & E-commerce | 54 |
| `MANUFACTURING` | Manufacturing | 41 |
| `SERVICES` | Professional Services | 39 |
| `CONSTRUCTION` | Construction | 40 |
| `HOSPITALITY` | Hospitality & Tourism | 40 |
| `HEALTHCARE` | Healthcare | 40 |
| `TECHNOLOGY` | Technology & Software | 41 |
| `REAL_ESTATE` | Real Estate | 41 |
| `NONPROFIT` | Nonprofit Organization | 44 |

---

## 🔢 Account Code Ranges

| Range | Type | Examples |
|-------|------|----------|
| **1000-1999** | Assets | Cash, Inventory, Equipment |
| **2000-2999** | Liabilities | Payables, Loans |
| **3000-3999** | Equity | Capital, Retained Earnings |
| **4000-4999** | Revenue | Sales, Service Income |
| **5000-5999** | Cost of Sales | COGS, Direct Costs |
| **6000-9999** | Expenses | Salaries, Rent, Utilities |

---

## 🛠️ Common Functions

### Check if COA can be generated
```typescript
import { canGenerateCOA } from '@/lib/coa-generator';

const { canGenerate, reason } = await canGenerateCOA(organizationId);
if (!canGenerate) {
  console.log(`Cannot generate: ${reason}`);
}
```

### Get available industries
```typescript
import { getAvailableIndustries } from '@/lib/coa-generator';

const industries = getAvailableIndustries();
// Returns: [{ value: 'RETAIL', label: 'Retail & E-commerce', accountCount: 39 }, ...]
```

### Preview accounts before creating
```typescript
import { previewCOA } from '@/lib/coa-generator';

const preview = previewCOA('MANUFACTURING');
console.log(`Will create ${preview.totalAccounts} accounts`);
console.log('Breakdown:', preview.accountsByType);
```

---

## ⚠️ Important Notes

### ✅ DO:
- Use for NEW organizations only
- Check `canGenerateCOA()` before generating
- Handle errors gracefully
- Use in onboarding flows

### ❌ DON'T:
- Generate multiple times for same org
- Skip validation
- Ignore transaction errors
- Modify system accounts after creation

---

## 🧪 Testing

```bash
# Run test suite
npx ts-node src/tests/test-coa-generator.ts

# Manual test via API
curl -X POST http://localhost:3000/api/orgs/test-org/coa/generate \
  -H "Content-Type: application/json" \
  -d '{"industryType": "GENERAL"}'
```

---

## 🔒 Transaction Safety

The generator uses Prisma transactions:
- **All-or-nothing**: Either all accounts are created, or none
- **Rollback on error**: Automatic rollback if any step fails
- **No partial setups**: Prevents "ghost" companies

---

## 📝 Response Format

### Success
```json
{
  "success": true,
  "accountsCreated": 39,
  "accounts": [
    { "id": "acc_1", "code": "1000", "name": "Cash on Hand" },
    // ...
  ]
}
```

### Error
```json
{
  "success": false,
  "accountsCreated": 0,
  "error": "Organization already has 10 accounts"
}
```

---

## 🔗 Integration Examples

### In Organization Create API
```typescript
export async function POST(req: NextRequest) {
  const data = await req.json();
  
  // Create organization
  const org = await prisma.organization.create({ data });
  
  // Generate COA
  const coaResult = await generateChartOfAccounts({
    organizationId: org.id,
    industryType: data.industry,
    baseCurrency: org.baseCurrency,
  });
  
  return NextResponse.json({
    organization: org,
    accountsCreated: coaResult.accountsCreated,
  });
}
```

### In Onboarding Wizard
```typescript
// Step: Select industry
<select onChange={(e) => setIndustry(e.target.value)}>
  <option value="RETAIL">Retail & E-commerce</option>
  <option value="MANUFACTURING">Manufacturing</option>
  <option value="SERVICES">Professional Services</option>
  {/* ... */}
</select>

// Step: Generate COA
<button onClick={async () => {
  const res = await fetch(`/api/orgs/${orgSlug}/coa/generate`, {
    method: 'POST',
    body: JSON.stringify({ industryType: industry }),
  });
  const data = await res.json();
  alert(`Created ${data.data.accountsCreated} accounts!`);
}}>
  Generate Chart of Accounts
</button>
```

---

## 📚 Full Documentation

See [COA_GENERATOR_GUIDE.md](./COA_GENERATOR_GUIDE.md) for:
- Detailed API reference
- All industry-specific accounts
- Error handling guide
- Performance benchmarks
- Customization instructions

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Organization not found" | Verify organization ID is correct |
| "Already has accounts" | Check if COA was already generated |
| "Invalid industry type" | Use one of the valid industry codes |
| Transaction timeout | Check database connection and performance |

---

**Files:**
- Core Logic: `src/lib/coa-generator.ts`
- Onboarding Helper: `src/lib/onboarding-coa.ts`
- API Route: `src/app/api/orgs/[orgSlug]/coa/generate/route.ts`
- Tests: `src/tests/test-coa-generator.ts`
- Full Guide: `COA_GENERATOR_GUIDE.md`
