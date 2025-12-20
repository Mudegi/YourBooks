# Testing YourBooks - Step-by-Step Guide

This guide will walk you through testing all the implemented features of YourBooks.

## Prerequisites

Ensure you've completed setup:
```bash
npm install
docker-compose up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

## Test 1: Authentication Flow

### 1.1 Test Login
1. Navigate to http://localhost:3000
2. Click "Sign In" button
3. Enter demo credentials:
   - Email: `admin@example.com`
   - Password: `password123`
4. **Expected:** Redirected to `/demo-company/dashboard`
5. **Verify:** Dashboard loads with stats cards

### 1.2 Test Logout
1. Click user menu in top navigation
2. Click "Logout"
3. **Expected:** Redirected to `/login`
4. **Verify:** Cannot access dashboard without login

### 1.3 Test Registration
1. Navigate to http://localhost:3000/register
2. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: +1 555-1234
   - Password: TestPass123
   - Confirm Password: TestPass123
3. Click "Create Account"
4. **Expected:** New user created, redirected to dashboard
5. **Verify:** New organization created automatically
6. **Check Database:** Run `npx prisma studio` to verify

---

## Test 2: Chart of Accounts

### 2.1 View Accounts List
1. Login as admin@example.com
2. Navigate to **General Ledger → Chart of Accounts**
3. **Expected:** See 35+ accounts from seed data
4. **Verify:** 
   - Account codes are displayed
   - Balances show (all $0 initially)
   - Type badges are colored correctly

### 2.2 Search Accounts
1. In search box, type "Cash"
2. **Expected:** Only Cash accounts appear (1000, etc.)
3. Clear search
4. Type "1000"
5. **Expected:** Accounts with code 1000 appear

### 2.3 Filter by Type
1. Select "ASSET" from type dropdown
2. **Expected:** Only asset accounts appear
3. Select "REVENUE"
4. **Expected:** Only revenue accounts appear
5. **Verify:** Summary stats update correctly

### 2.4 Create New Account
1. Click "New Account" button
2. Fill in form:
   - Code: 1100
   - Name: Petty Cash
   - Type: ASSET
   - Category: Current Assets
   - Description: Small cash for expenses
   - Leave "Active" checked
3. Click "Create Account"
4. **Expected:** Modal closes, account appears in list
5. **Verify:** New account is searchable

### 2.5 Edit Account
1. Find "Petty Cash" account
2. Click edit icon (pencil)
3. Change description to "Office petty cash"
4. Click "Update Account"
5. **Expected:** Account updated
6. **Verify:** Description changed in list

### 2.6 Try to Delete Account with Code Conflict
1. Try creating another account with code 1100
2. **Expected:** Error "Account code already exists"

### 2.7 Delete Unused Account
1. Click delete icon (trash) on Petty Cash
2. **Expected:** Account deleted (no transactions)
3. **Verify:** Account removed from list

---

## Test 3: Journal Entries

### 3.1 Create Simple Transaction
1. Navigate to **General Ledger → New Entry**
2. Set transaction date to today
3. Add description: "Opening balance - Cash"
4. Leave reference blank
5. **Entry 1:**
   - Account: 1000 - Cash
   - Type: DEBIT
   - Amount: 10000
6. **Entry 2:**
   - Account: 3000 - Equity
   - Type: CREDIT
   - Amount: 10000
7. **Expected:** Balance indicator shows "Transaction is balanced"
8. Click "Post Transaction"
9. **Expected:** Success message, redirect to transactions list

### 3.2 Test Balance Validation
1. Navigate to **General Ledger → New Entry**
2. Add entry with Debit $500
3. Add entry with Credit $300
4. **Expected:** Warning "Transaction Not Balanced"
5. **Expected:** "Post Transaction" button disabled
6. Adjust amounts to balance
7. **Expected:** Button enabled

### 3.3 Multi-Line Transaction
1. Create new journal entry
2. Description: "Monthly expenses"
3. Add 4 entries:
   - Debit: 5100 - Salaries Expense: $3000
   - Debit: 6200 - Rent Expense: $1500
   - Debit: 6300 - Utilities: $500
   - Credit: 1000 - Cash: $5000
4. **Expected:** Debits = $5000, Credits = $5000
5. Post transaction
6. **Expected:** Success

### 3.4 View Transactions List
1. Navigate to **General Ledger → Journal Entries**
2. **Expected:** See both posted transactions
3. **Verify:**
   - Transaction date displayed
   - Description shown
   - Amount totals correct
   - Ledger entries expanded
   - Account codes and names visible

### 3.5 Verify Account Balances Updated
1. Navigate to **General Ledger → Chart of Accounts**
2. Search for "Cash" (1000)
3. **Expected:** Balance shows $5,000 ($10,000 - $5,000)
4. Check Equity (3000)
5. **Expected:** Balance shows $10,000

---

## Test 4: Double-Entry Validation

### 4.1 Test Transaction Creation
1. Open database: `npx prisma studio`
2. View Transaction table
3. **Verify:** 
   - Transactions have status "POSTED"
   - TransactionDate is correct
   - Reference numbers (if provided)

### 4.2 Test Ledger Entries
1. In Prisma Studio, view LedgerEntry table
2. Find entries for Cash account
3. **Verify:**
   - Each transaction has multiple entries
   - Entry types are DEBIT or CREDIT
   - Amounts match

### 4.3 Test Balance Calculation
1. Query account balance directly:
```sql
SELECT code, name, balance 
FROM "ChartOfAccount" 
WHERE code = '1000';
```
2. **Expected:** Balance = $5,000
3. **Manual calculation:**
   - Opening: +$10,000 (DEBIT to ASSET increases)
   - Payment: -$5,000 (CREDIT to ASSET decreases)
   - Net: $5,000 ✓

---

## Test 5: Transaction Voiding

### 5.1 Void a Transaction
1. Navigate to **General Ledger → Journal Entries** (list)
2. Find "Monthly expenses" transaction
3. Click void button (trash icon)
4. Confirm void
5. **Expected:** Transaction status changes to "VOIDED"

### 5.2 Verify Reversing Entries
1. Open Prisma Studio
2. Check LedgerEntry table for voided transaction
3. **Expected:** 
   - Original entries remain
   - New reversing entries created
   - Reversing entries have opposite entry types

### 5.3 Verify Balances Restored
1. Navigate to Chart of Accounts
2. Check Cash balance
3. **Expected:** Balance back to $10,000
4. **Calculation:**
   - Opening: +$10,000
   - Payment: -$5,000
   - Void reversal: +$5,000
   - Net: $10,000 ✓

---

## Test 6: Edge Cases & Error Handling

### 6.1 Unbalanced Transaction
1. Try to post transaction with Debit ≠ Credit
2. **Expected:** Error message displayed
3. **Expected:** Button remains disabled

### 6.2 Missing Required Fields
1. Try to create account without code
2. **Expected:** Browser validation error
3. Try to create account without name
4. **Expected:** Browser validation error

### 6.3 Duplicate Account Code
1. Try to create account with existing code
2. **Expected:** Server error "Account code already exists"

### 6.4 Delete Account with Transactions
1. Try to delete Cash account (has transactions)
2. **Expected:** Error "Cannot delete account with existing transactions"

### 6.5 Empty Transaction
1. Try to post transaction with no entries
2. **Expected:** Validation error

### 6.6 Session Expiration
1. Login and wait for JWT to expire (24 hours)
2. OR manually delete auth cookie
3. Try to access dashboard
4. **Expected:** Redirected to login page

---

## Test 7: Multi-Tenancy

### 7.1 Create Second Organization
1. Register new user: test2@example.com
2. **Expected:** New organization created
3. **Verify:** URL contains different orgSlug

### 7.2 Verify Data Isolation
1. Login as test2@example.com
2. Navigate to Chart of Accounts
3. **Expected:** See only seed accounts for this org
4. **Expected:** No data from demo-company visible

### 7.3 Switch Organizations (Future Feature)
1. Currently only one org per user
2. Organization switching UI placeholder visible
3. **Note:** Multi-org per user not yet implemented

---

## Test 8: UI/UX Testing

### 8.1 Responsive Design
1. Resize browser to mobile width (< 768px)
2. **Expected:** 
   - Sidebar collapses
   - Hamburger menu appears
   - Tables remain scrollable
3. Test on actual mobile device if possible

### 8.2 Navigation
1. Test all sidebar links
2. **Expected:** Active link highlighted
3. **Expected:** Smooth navigation

### 8.3 Form Validation
1. Test all form fields for validation
2. **Expected:** Red borders on invalid fields
3. **Expected:** Clear error messages

### 8.4 Loading States
1. Observe loading spinners during data fetch
2. **Expected:** Smooth transitions
3. **Expected:** No flash of wrong content

---

## Test 9: API Testing (Optional)

### 9.1 Test Chart of Accounts API
```bash
# Get all accounts (replace with actual orgSlug)
curl http://localhost:3000/api/orgs/demo-company/chart-of-accounts \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Create account
curl -X POST http://localhost:3000/api/orgs/demo-company/chart-of-accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "code": "1150",
    "name": "Test Account",
    "type": "ASSET",
    "category": "Current Assets"
  }'
```

### 9.2 Test Transactions API
```bash
# Get all transactions
curl http://localhost:3000/api/orgs/demo-company/transactions \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Create transaction
curl -X POST http://localhost:3000/api/orgs/demo-company/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "transactionDate": "2025-12-18",
    "description": "Test transaction",
    "type": "JOURNAL",
    "entries": [
      {"accountId": "ACCOUNT_ID_1", "entryType": "DEBIT", "amount": 100},
      {"accountId": "ACCOUNT_ID_2", "entryType": "CREDIT", "amount": 100}
    ]
  }'
```

---

## Test 10: Performance Testing

### 10.1 Large Dataset
1. Create 100+ accounts via Prisma Studio or script
2. Test search/filter performance
3. **Expected:** Results within 1-2 seconds

### 10.2 Multiple Transactions
1. Create 50+ journal entries
2. Test list page pagination
3. **Expected:** Fast load times

---

## Troubleshooting Test Failures

### Database Issues
```bash
# Reset database
npx prisma migrate reset
npx prisma db seed

# View logs
docker-compose logs postgres
```

### Application Errors
1. Check browser console for errors
2. Check terminal for Next.js errors
3. Verify .env configuration

### API Failures
1. Verify you're logged in
2. Check network tab for response details
3. Verify organization exists

---

## Success Criteria

✅ All authentication flows work  
✅ Chart of Accounts CRUD operations successful  
✅ Transactions post correctly  
✅ Double-entry validation enforced  
✅ Account balances update accurately  
✅ Void functionality works  
✅ No database errors  
✅ UI is responsive  
✅ Error messages are clear  
✅ Data isolation between organizations  

---

## Next Steps After Testing

If all tests pass:
1. ✅ General Ledger module is production-ready
2. 🚀 Move to Customers & Invoices module
3. 📊 Add financial reports
4. 🏦 Implement banking features

If tests fail:
1. Note the specific failure
2. Check error logs
3. Review relevant code
4. Fix and re-test

---

## Test Data Cleanup

To start fresh:
```bash
# Reset everything
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
npx prisma db seed
```

---

**Happy Testing! 🧪**
