# COA Generator - Integration Checklist

## ✅ Pre-Integration Checklist

Before integrating the COA Generator into your application:

- [ ] **Database Migration Complete** - Ensure `ChartOfAccount` table exists with required fields
- [ ] **Prisma Client Updated** - Run `npx prisma generate` to update client
- [ ] **Dependencies Installed** - All required packages are installed
- [ ] **Environment Variables Set** - Database URL configured
- [ ] **Test Database Available** - For running integration tests

---

## 🚀 Quick Integration Steps

### Step 1: Verify Files are in Place

```bash
# Check that all files exist
ls src/lib/coa-generator.ts
ls src/lib/onboarding-coa.ts
ls src/app/api/orgs/[orgSlug]/coa/generate/route.ts
ls src/tests/test-coa-generator.ts
```

**Expected:** All files should exist ✓

---

### Step 2: Run Tests

```bash
# Run the test suite
npx ts-node src/tests/test-coa-generator.ts
```

**Expected Output:**
```
═══════════════════════════════════════════════════════
     Chart of Accounts Generator - Test Suite
═══════════════════════════════════════════════════════
...
Total: 9/9 tests passed
```

**If tests fail:**
- Check database connection
- Verify Prisma client is generated
- Check schema has all required fields

---

### Step 3: Test API Endpoints

```bash
# Start your development server
npm run dev

# Test the API endpoints
curl http://localhost:3000/api/orgs/demo-company/coa/generate?action=industries
```

**Expected:** JSON response with industry list

---

### Step 4: Integrate into Onboarding

#### Option A: Direct Integration (Simple)

In your organization creation API route:

```typescript
import { generateChartOfAccounts } from '@/lib/coa-generator';

// After creating organization
const coaResult = await generateChartOfAccounts({
  organizationId: newOrg.id,
  industryType: formData.industry,
  baseCurrency: newOrg.baseCurrency,
});

if (!coaResult.success) {
  // Handle error - maybe delete organization and retry
  throw new Error(`COA generation failed: ${coaResult.error}`);
}
```

#### Option B: Transaction-Based (Recommended)

Use the helper function for complete transaction safety:

```typescript
import { completeOnboardingWithCOA } from '@/lib/onboarding-coa';

const result = await completeOnboardingWithCOA(
  {
    name: formData.organizationName,
    slug: formData.organizationSlug,
    baseCurrency: formData.currency,
    industryType: formData.industry,
  },
  userId
);

// Organization and COA are both created in single transaction
```

---

## 📋 Integration Points

### 1. Onboarding Wizard UI

Add industry selection step:

```tsx
// In your onboarding wizard
const [selectedIndustry, setSelectedIndustry] = useState('');
const [industries, setIndustries] = useState([]);

// Fetch available industries
useEffect(() => {
  fetch(`/api/orgs/${orgSlug}/coa/generate?action=industries`)
    .then(res => res.json())
    .then(data => setIndustries(data.data));
}, []);

// Render selection
<select onChange={(e) => setSelectedIndustry(e.target.value)}>
  {industries.map(ind => (
    <option key={ind.value} value={ind.value}>
      {ind.label} ({ind.accountCount} accounts)
    </option>
  ))}
</select>
```

### 2. Organization Settings

Allow COA generation for existing organizations (if needed):

```tsx
// In organization settings
<button onClick={async () => {
  const check = await fetch(`/api/orgs/${orgSlug}/coa/generate?action=check`)
    .then(r => r.json());
  
  if (check.data.canGenerate) {
    // Show confirmation dialog
    // Then generate COA
  } else {
    toast.error(check.data.reason);
  }
}}>
  Generate Chart of Accounts
</button>
```

### 3. Admin Panel

Add preview functionality:

```tsx
// Preview accounts before generating
const [preview, setPreview] = useState(null);

async function handlePreview(industry) {
  const res = await fetch(
    `/api/orgs/${orgSlug}/coa/generate?action=preview&industry=${industry}`
  );
  const data = await res.json();
  setPreview(data.data);
}

// Show preview modal with account list
```

---

## 🧪 Testing Your Integration

### Manual Test Flow

1. **Create New Organization**
   ```bash
   # POST to your organization creation endpoint
   curl -X POST http://localhost:3000/api/organizations \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Company",
       "slug": "test-company",
       "industry": "RETAIL",
       "currency": "USD"
     }'
   ```

2. **Verify COA Generated**
   ```bash
   # GET chart of accounts
   curl http://localhost:3000/api/orgs/test-company/chart-of-accounts
   ```

3. **Check Account Codes**
   ```sql
   -- In your database
   SELECT code, name, "accountType" 
   FROM "ChartOfAccount" 
   WHERE "organizationId" = 'org_id_here'
   ORDER BY code;
   ```

4. **Verify Account Counts**
   ```sql
   SELECT "accountType", COUNT(*) 
   FROM "ChartOfAccount" 
   WHERE "organizationId" = 'org_id_here'
   GROUP BY "accountType";
   ```

---

## 🔧 Configuration Options

### Environment Variables

No additional environment variables needed - uses existing Prisma connection.

### Customization

To customize accounts, edit `src/lib/coa-generator.ts`:

```typescript
// Add new base accounts
const BASE_ACCOUNTS: AccountTemplate[] = [
  // Your custom accounts here
  {
    code: '1050',
    name: 'Custom Account',
    accountType: AccountType.ASSET,
    accountSubType: 'Current Assets',
  },
  // ... existing accounts
];

// Add new industry
const INDUSTRY_ACCOUNTS: Record<IndustryType, AccountTemplate[]> = {
  MY_INDUSTRY: [
    // Industry-specific accounts
  ],
};
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Issue: "Organization not found"
**Solution:** Verify organization ID/slug is correct

#### Issue: "Organization already has X accounts"
**Solution:** COA already generated. This is expected. Use `canGenerateCOA()` to check first.

#### Issue: TypeScript errors about 'industry' field
**Solution:** Run `npx prisma generate` to update Prisma client

#### Issue: Transaction timeout
**Solution:** Check database performance and connection pool

#### Issue: "Invalid industry type"
**Solution:** Use one of the valid industry codes:
- GENERAL, RETAIL, MANUFACTURING, SERVICES, CONSTRUCTION, 
- HOSPITALITY, HEALTHCARE, TECHNOLOGY, REAL_ESTATE, NONPROFIT

---

## 📊 Monitoring & Logging

### Add Logging

```typescript
// In your integration
import { generateChartOfAccounts } from '@/lib/coa-generator';

const result = await generateChartOfAccounts({
  organizationId: org.id,
  industryType: industry,
  baseCurrency: 'USD',
});

// Log the result
console.log(`COA Generation for ${org.name}:`, {
  success: result.success,
  accountsCreated: result.accountsCreated,
  industry: industry,
  timestamp: new Date().toISOString(),
});

// Optional: Save to audit log
await prisma.auditLog.create({
  data: {
    organizationId: org.id,
    action: 'COA_GENERATED',
    details: {
      industry,
      accountCount: result.accountsCreated,
    },
  },
});
```

### Track Metrics

```typescript
// Track generation success rate
const metrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  averageTime: 0,
};

const startTime = Date.now();
const result = await generateChartOfAccounts(options);
const duration = Date.now() - startTime;

metrics.attempts++;
if (result.success) {
  metrics.successes++;
} else {
  metrics.failures++;
}
metrics.averageTime = (metrics.averageTime + duration) / 2;
```

---

## 🎯 Integration Success Criteria

Your integration is successful when:

- [ ] **Tests Pass** - All 9 tests in test suite pass
- [ ] **API Works** - All 4 API endpoints respond correctly
- [ ] **Accounts Created** - Correct number of accounts for each industry
- [ ] **Codes Valid** - All account codes follow standards (1000s, 2000s, etc.)
- [ ] **Transactions Safe** - No partial account creation on errors
- [ ] **UI Integrated** - Industry selection in onboarding
- [ ] **Error Handling** - Proper error messages shown to users
- [ ] **Documentation** - Team knows how to use the system

---

## 📝 Post-Integration Tasks

### 1. Update Documentation

Add to your internal docs:
- How to select industries during onboarding
- What happens when COA is generated
- How to handle errors
- Where to find generated accounts

### 2. Train Team

Ensure team understands:
- Industry types available
- Account code structure
- When COA is generated
- How to troubleshoot issues

### 3. Monitor Production

After deployment:
- Track COA generation success rate
- Monitor for any errors
- Collect user feedback on industry templates
- Plan for future enhancements

---

## 🔄 Maintenance

### Regular Tasks

- [ ] **Review Account Templates** - Update as business needs change
- [ ] **Add New Industries** - As new customer segments emerge
- [ ] **Update Documentation** - Keep guides current
- [ ] **Monitor Performance** - Track generation times
- [ ] **Handle User Feedback** - Improve templates based on usage

### Version Control

```bash
# Before making changes
git checkout -b feature/coa-enhancements

# After testing
git add src/lib/coa-generator.ts
git commit -m "feat: add new industry template for AGRICULTURE"
git push origin feature/coa-enhancements
```

---

## 🆘 Support Resources

### Documentation Files

- **Full Guide**: `COA_GENERATOR_GUIDE.md`
- **Quick Reference**: `COA_GENERATOR_QUICK_REF.md`
- **Implementation Summary**: `COA_GENERATOR_IMPLEMENTATION_SUMMARY.md`
- **Diagrams**: `COA_GENERATOR_DIAGRAMS.md`
- **This Checklist**: `COA_GENERATOR_INTEGRATION_CHECKLIST.md`

### Code Files

- **Core Logic**: `src/lib/coa-generator.ts`
- **Integration Helper**: `src/lib/onboarding-coa.ts`
- **API Route**: `src/app/api/orgs/[orgSlug]/coa/generate/route.ts`
- **Tests**: `src/tests/test-coa-generator.ts`

### Getting Help

1. Check documentation first
2. Run test suite to identify issues
3. Review error messages
4. Check database logs
5. Review Prisma schema

---

## ✨ Next Steps

After successful integration:

1. **Test in Staging** - Full end-to-end testing
2. **User Acceptance Testing** - Get feedback from test users
3. **Performance Testing** - Ensure it scales with load
4. **Deploy to Production** - With monitoring in place
5. **Gather Feedback** - Improve based on real usage
6. **Iterate** - Add new industries and features as needed

---

**Integration Status Tracker:**

```
┌────────────────────────────────────────┐
│ Integration Progress                    │
├────────────────────────────────────────┤
│ [ ] Files verified                     │
│ [ ] Tests passed                       │
│ [ ] API endpoints working              │
│ [ ] Onboarding integrated              │
│ [ ] UI updated                         │
│ [ ] Error handling added               │
│ [ ] Documentation updated              │
│ [ ] Team trained                       │
│ [ ] Staging tested                     │
│ [ ] Production deployed                │
└────────────────────────────────────────┘
```

**Good luck with your integration! 🚀**
