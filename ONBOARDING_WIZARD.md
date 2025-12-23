# Multi-Step Onboarding Wizard

## Overview
The onboarding wizard guides new users through essential setup steps after registration. It collects company information, sets up Chart of Accounts based on industry, and captures initial bank account details.

## Features
- **3-Step Process**: Company Details → Industry Setup → Bank Account
- **Progress Tracking**: Visual progress bar showing current step
- **Industry-Specific Setup**: Automatically creates Chart of Accounts based on selected industry
- **Access Control**: Users cannot access dashboard until onboarding is complete
- **Validation**: Each step validates required fields before proceeding

## User Flow

### Step 1: Company Details
Collects essential business information:
- **Company Name**: Official business name
- **Base Currency**: Default currency (USD, EUR, GBP, UGX, KES, TZS, ZAR)
- **Fiscal Year Start**: Month when financial year begins (1-12)

**API Endpoint**: `POST /api/onboarding/company-details`

### Step 2: Industry Selection
User selects their industry from 10 predefined options:
- Retail & E-commerce 🛍️
- Manufacturing 🏭
- Professional Services 💼
- Hospitality & Tourism 🏨
- Healthcare 🏥
- Construction 🏗️
- Technology 💻
- Education 🎓
- Non-Profit ❤️
- Other 📊

**Chart of Accounts Seeding**: Based on industry selection, the system automatically creates:
- **Base Accounts** (30+ accounts): Common accounts for all industries
  - Assets (1000-1999): Cash, Receivables, Inventory, Equipment, etc.
  - Liabilities (2000-2999): Payables, Taxes, Loans, etc.
  - Equity (3000-3999): Capital, Retained Earnings, Drawings
  - Revenue (4000-4999): Sales, Services, Other Income
  - Expenses (5000-9999): COGS, Salaries, Rent, Utilities, etc.

- **Industry-Specific Accounts**: Additional accounts tailored to industry
  - Retail: Merchandise Inventory, Retail Sales, Purchase Returns
  - Manufacturing: Raw Materials, WIP, Finished Goods, Direct Labor, Overhead
  - Services: Unbilled Revenue, Deferred Revenue, Consulting Revenue
  - And more for each industry...

**API Endpoint**: `POST /api/onboarding/seed-coa`

### Step 3: Initial Bank Account
Captures primary bank account information:
- **Bank Name**: Name of the financial institution
- **Account Number**: Bank account number
- **Opening Balance**: Current balance in base currency

**Journal Entry Creation**: If opening balance > 0, system creates:
- Debit: Cash and Cash Equivalents (Account 1000)
- Credit: Owner's Capital (Account 3000)

**Onboarding Completion**: Sets `organization.onboardingCompleted = true`

**API Endpoint**: `POST /api/onboarding/complete`

## Technical Implementation

### Database Schema Changes
```prisma
model Organization {
  // ... existing fields
  onboardingCompleted Boolean  @default(false)
  industry            String?
}
```

### Components Created
1. **`src/app/(auth)/onboarding/page.tsx`**
   - Client-side React component
   - Multi-step form with validation
   - Progress indicator
   - Responsive design

### API Routes Created
1. **`src/app/api/onboarding/company-details/route.ts`**
   - Updates organization name, currency, fiscal year
   - Validates month range (1-12)

2. **`src/app/api/onboarding/seed-coa/route.ts`**
   - Saves industry selection
   - Creates Chart of Accounts based on industry template
   - Prevents duplicate account creation
   - Returns count of accounts created

3. **`src/app/api/onboarding/complete/route.ts`**
   - Creates bank account record
   - Creates opening balance journal entry if balance > 0
   - Marks onboarding as complete
   - Returns organization and bank account data

### Middleware Protection
Updated `src/middleware.ts`:
- Added `/onboarding` to allowed routes
- Added `/api/onboarding/*` to allowed API routes
- Session info passed in headers for API calls

### Layout Protection
Updated `src/app/(dashboard)/[orgSlug]/layout.tsx`:
- Checks `organization.onboardingCompleted` on session fetch
- Redirects to `/onboarding` if not completed
- Prevents dashboard access until onboarding done

### Registration Flow
Updated `src/app/(auth)/register/page.tsx`:
- Redirects new users to `/onboarding` instead of dashboard
- New organizations created with `onboardingCompleted: false`

## Security Considerations

### Authentication
- All API routes verify user session
- Only authenticated users can access onboarding
- Token validation via JWT

### Authorization
- Users can only update their own organization
- Organization ID retrieved from user's session
- Prevents cross-organization data modification

### Data Validation
- Server-side validation on all inputs
- Required field checks
- Numeric range validation (fiscal year, balance)
- Duplicate account prevention

## UI/UX Features

### Visual Design
- Clean, modern interface
- Gradient background
- Progress bar with step indicators
- Icon-based industry selection
- Responsive grid layout

### User Guidance
- Clear step titles and descriptions
- Help text for each field
- Currency symbols shown
- Error messages displayed inline
- Loading states during API calls

### Keyboard Shortcuts
- Escape key to close (future mobile menu)
- Tab navigation through forms
- Enter to submit

### Accessibility
- Semantic HTML
- ARIA labels
- Focus management
- Color contrast compliance

## Chart of Accounts Templates

### Account Code Ranges
- **1000-1999**: Assets
- **2000-2999**: Liabilities
- **3000-3999**: Equity
- **4000-4999**: Revenue
- **5000-9999**: Expenses

### Base Accounts (All Industries)
- Cash and Cash Equivalents (1000)
- Accounts Receivable (1100)
- Inventory (1200)
- Equipment (1500)
- Accounts Payable (2000)
- Owner's Capital (3000)
- Sales Revenue (4000)
- Cost of Goods Sold (5000)
- Salaries and Wages (6000)
- And 20+ more...

### Industry-Specific Examples

**Manufacturing**:
- Raw Materials (1210)
- Work in Progress (1220)
- Finished Goods (1230)
- Manufacturing Equipment (1700)
- Direct Labor (5100)
- Manufacturing Overhead (5200)

**Healthcare**:
- Patient Services Revenue (4300)
- Medical Supplies (6800)
- Pharmaceuticals (6810)

**Technology**:
- Software License Revenue (4500)
- Subscription Revenue (4510)
- R&D Expense (6900)
- Software Development (6910)

## Testing Checklist

### Step 1 Testing
- [ ] Company name validation (required)
- [ ] Currency selection (dropdown works)
- [ ] Fiscal year month (1-12 range)
- [ ] Data saves to organization table
- [ ] Progress advances to Step 2

### Step 2 Testing
- [ ] All 10 industries display
- [ ] Industry selection highlights
- [ ] Chart of Accounts created
- [ ] Correct number of accounts for each industry
- [ ] No duplicate accounts on re-run
- [ ] organizationId correctly set
- [ ] Progress advances to Step 3

### Step 3 Testing
- [ ] Bank name validation (required)
- [ ] Account number validation (required)
- [ ] Opening balance validation (non-negative)
- [ ] Bank account record created
- [ ] Journal entry created (if balance > 0)
- [ ] onboardingCompleted set to true
- [ ] Redirect to dashboard works

### Access Control Testing
- [ ] Unauthenticated users redirected to login
- [ ] Users with incomplete onboarding redirected to wizard
- [ ] Users with complete onboarding access dashboard
- [ ] Direct navigation to /onboarding blocked after completion

### Edge Cases
- [ ] Refresh during onboarding (data persists)
- [ ] Browser back button (step tracking)
- [ ] Zero opening balance (no journal entry)
- [ ] Negative opening balance (validation error)
- [ ] Missing required fields (error messages)
- [ ] Network errors (error handling)

## Future Enhancements

### Phase 2
- [ ] Add more industries
- [ ] Custom Chart of Accounts upload
- [ ] Multiple bank accounts in Step 3
- [ ] Skip bank account (add later)
- [ ] Email verification before onboarding

### Phase 3
- [ ] Guided tour after onboarding
- [ ] Sample transactions creation
- [ ] Video tutorials per step
- [ ] Multi-currency setup
- [ ] Import existing data

### Phase 4
- [ ] AI-powered industry detection
- [ ] Smart account recommendations
- [ ] Integration with bank APIs
- [ ] Automated tax setup
- [ ] Compliance checklist

## Troubleshooting

### Onboarding Loop
**Issue**: User stuck in onboarding redirect loop
**Solution**: Check database `organization.onboardingCompleted` value

### Chart of Accounts Not Created
**Issue**: Accounts don't appear after Step 2
**Solution**: Check API response for errors, verify organizationId

### Journal Entry Missing
**Issue**: Opening balance not recorded
**Solution**: Verify balance > 0, check journal entry creation logs

### Redirect After Completion
**Issue**: Not redirecting to dashboard
**Solution**: Verify orgSlug available, check session data

## API Response Examples

### Step 1 Success
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp",
    "baseCurrency": "USD",
    "fiscalYearStart": 1
  }
}
```

### Step 2 Success
```json
{
  "success": true,
  "message": "Successfully created 35 accounts for retail industry",
  "accountsCreated": 35
}
```

### Step 3 Success
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "organization": {
      "id": "org_123",
      "onboardingCompleted": true
    },
    "bankAccount": {
      "id": "bank_456",
      "accountName": "Chase Checking",
      "currentBalance": 10000
    }
  }
}
```

## Migration Commands

### Apply Onboarding Fields
```bash
npx prisma migrate dev --name add_onboarding_fields
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

## Files Modified/Created

### New Files
- `src/app/(auth)/onboarding/page.tsx` - Onboarding wizard UI
- `src/app/api/onboarding/company-details/route.ts` - Step 1 API
- `src/app/api/onboarding/seed-coa/route.ts` - Step 2 API
- `src/app/api/onboarding/complete/route.ts` - Step 3 API
- `ONBOARDING_WIZARD.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added onboardingCompleted and industry fields
- `src/middleware.ts` - Added onboarding route protection
- `src/app/(dashboard)/[orgSlug]/layout.tsx` - Added onboarding check
- `src/app/(auth)/register/page.tsx` - Changed redirect to onboarding

### Migrations
- `20251220092843_add_onboarding_fields` - Database migration

## Support
For issues or questions about the onboarding wizard, contact the development team or open an issue in the repository.
