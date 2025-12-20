# 🚀 YourBooks ERP - Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed locally
- [ ] Git installed
- [ ] VS Code (recommended)

## Setup in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd YourBooks
npm install
```

### Step 2: Create the Database (1 min)

Open PowerShell and create the database:
```powershell
psql -U postgres
```

Inside psql:
```sql
CREATE DATABASE yourbooks_dev;
\q
```

**Note:** Make sure your local PostgreSQL server is running (usually started automatically on Windows).

### Step 3: Verify Database Connection (30 sec)

Your `.env` file already has:
```
DATABASE_URL="postgresql://postgres:kian256@localhost:5432/yourbooks_dev?schema=public"
```

If your PostgreSQL password is different, update it in `.env`.

### Step 4: Initialize Database (2 min)
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Seed with demo data
npm run prisma:seed
```

### Step 5: Start Development Server (30 sec)
```bash
npm run dev
```

## 🎉 You're Ready!

Open your browser:
- **Application**: http://localhost:3000
- **Database GUI**: Run `npm run prisma:studio` → http://localhost:5555

### Demo Login Credentials
```
Email: admin@example.com
Password: password123
Organization: demo-company
```

---

## What You Can Do Now

### 1. Explore Prisma Studio
```bash
npm run prisma:studio
```

Browse your database visually:
- See the Chart of Accounts (35 accounts created)
- View demo customer, vendor, product
- Explore the schema relationships

### 2. Test the Core Service

Create a test file: `test-double-entry.ts`

```typescript
import DoubleEntryService from './src/services/accounting/double-entry.service';

async function testDoubleEntry() {
  // This will work - balanced entries
  const result = DoubleEntryService.validateBalance([
    { accountId: '1', entryType: 'DEBIT', amount: 1000 },
    { accountId: '2', entryType: 'CREDIT', amount: 1000 },
  ]);
  console.log('Balanced:', result); // true

  // This will fail - unbalanced
  const result2 = DoubleEntryService.validateBalance([
    { accountId: '1', entryType: 'DEBIT', amount: 1000 },
    { accountId: '2', entryType: 'CREDIT', amount: 500 },
  ]);
  console.log('Unbalanced:', result2); // false
}

testDoubleEntry();
```

Run it:
```bash
npx tsx test-double-entry.ts
```

### 3. Explore the Seeded Data

In Prisma Studio, check:
- **Organization**: "Demo Company Inc."
- **User**: admin@example.com (with ADMIN role)
- **Chart of Accounts**: 35+ accounts organized by type
- **Customer**: Acme Corporation
- **Vendor**: Office Supplies Inc.
- **Product**: Standard Widget (with 100 units in stock)
- **Bank Account**: Main Checking ($10,000 opening balance)

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server

# Database
npm run prisma:studio          # Open database GUI
npm run prisma:migrate         # Run migrations
npm run prisma:seed            # Seed demo data
npm run prisma:generate        # Generate Prisma Client

# Code Quality
npm run lint                   # Run ESLint
npm run type-check             # TypeScript check
npm test                       # Run tests

# Database Management (psql)
psql -U postgres               # Connect to PostgreSQL
psql -U postgres -d yourbooks_dev  # Connect to app database
\dt                            # List tables (in psql)
\q                             # Quit psql
```

---

## Project Structure Quick Reference

```
YourBooks/
├── prisma/
│   ├── schema.prisma          # ⭐ Database schema
│   └── seed.ts                # Demo data
│
├── src/
│   ├── app/                   # Next.js routes (build UI here)
│   ├── components/            # React components (build UI here)
│   ├── services/              # ⭐ Business logic
│   │   ├── accounting/
│   │   │   └── double-entry.service.ts  # Core accounting
│   │   └── accounts-receivable/
│   │       └── invoice.service.ts       # Invoice creation
│   ├── lib/                   # Utilities
│   │   └── prisma.ts          # ⭐ Database client
│   └── types/                 # TypeScript types
│
├── .env                       # Your environment config
├── package.json               # Dependencies & scripts
├── README.md                  # Project overview
├── IMPLEMENTATION_GUIDE.md    # ⭐ Full development plan
└── PROJECT_SUMMARY.md         # What's been built
```

---

## Next Steps

### Option 1: Build Authentication (Recommended First)
1. Create authentication middleware
2. Build login/register pages
3. Implement JWT session management
4. Add RBAC checks

### Option 2: Build First Module (General Ledger)
1. Create Chart of Accounts list page
2. Add account creation form
3. Build journal entry form
4. Display account balances

### Option 3: Study the Architecture
1. Read [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
2. Review [DIAGRAMS.md](DIAGRAMS.md)
3. Explore service files in `src/services/`
4. Check Prisma schema comments

---

## Troubleshooting

### Database Connection Failed
```powershell
# Test PostgreSQL connection
psql -U postgres -c "SELECT version();"

# Check your DATABASE_URL in .env matches your PostgreSQL credentials
# Update .env if needed with correct password
```

### psql command not found
1. Add PostgreSQL `bin` folder to Windows PATH
2. Default location: `C:\Program Files\PostgreSQL\16\bin`
3. Restart PowerShell after adding to PATH

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Port 3000 Already in Use
```bash
# Kill the process
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### Cannot Find Module Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Development Workflow

### Daily Workflow:
1. Ensure PostgreSQL is running (Windows: Services app → PostgreSQL)
2. Start dev server: `npm run dev`
3. Open Prisma Studio (optional): `npm run prisma:studio`
4. Code your features
5. Test in browser: http://localhost:3000

### After Schema Changes:
```bash
npm run prisma:migrate dev --name description_of_change
npm run prisma:generate
```

### Before Committing:
```bash
npm run lint
npm run type-check
npm test
```

---

## Learn By Example

### Example 1: Create a Journal Entry

```typescript
import DoubleEntryService from '@/services/accounting/double-entry.service';

const transaction = await DoubleEntryService.createTransaction({
  organizationId: 'your-org-id',
  transactionDate: new Date(),
  transactionType: 'JOURNAL_ENTRY',
  description: 'Pay rent for December',
  createdById: 'user-id',
  entries: [
    {
      accountId: 'rent-expense-account-id',
      entryType: 'DEBIT',
      amount: 2000,
      description: 'December rent',
    },
    {
      accountId: 'cash-account-id',
      entryType: 'CREDIT',
      amount: 2000,
      description: 'Cash payment',
    },
  ],
});
```

### Example 2: Create an Invoice

```typescript
import InvoiceService from '@/services/accounts-receivable/invoice.service';

const { invoice, glTransaction } = await InvoiceService.createInvoice({
  organizationId: 'your-org-id',
  customerId: 'customer-id',
  invoiceDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  items: [
    {
      productId: 'product-id',
      description: 'Standard Widget',
      quantity: 10,
      unitPrice: 100,
      taxRate: 8.5,
    },
  ],
  createdById: 'user-id',
});

console.log('Invoice created:', invoice.invoiceNumber);
console.log('GL Transaction:', glTransaction.transactionNumber);
```

---

## Resources

### Documentation
- 📖 [README.md](README.md) - Project overview
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Folder structure
- 📋 [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Development plan
- 📊 [DIAGRAMS.md](DIAGRAMS.md) - Visual flows
- 📝 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What's built

### External Docs
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Getting Help

### Check the Logs
```bash
# Application logs (in terminal running npm run dev)

# Database logs
docker-compose logs -f postgres

# Prisma logs
# Set in .env: DATABASE_URL with ?logging=true
```

### Database Issues
```bash
# Reset database (CAUTION: Deletes all data)
npm run prisma:migrate reset

# Reseed
npm run prisma:seed
```

---

## 🎓 Learning Path

1. ✅ **Week 1: Setup** (You are here!)
   - Install and run the project
   - Explore Prisma Studio
   - Understand the database schema

2. **Week 2: Core Concepts**
   - Study double-entry bookkeeping
   - Review the accounting services
   - Read DIAGRAMS.md

3. **Week 3: Build First Feature**
   - Follow IMPLEMENTATION_GUIDE.md Phase 3
   - Build Chart of Accounts UI
   - Create your first API route

4. **Week 4+: Continue Building**
   - Follow the 18-week implementation plan
   - Build module by module

---

## 🎉 You're All Set!

Your YourBooks ERP development environment is ready. Happy coding!

**Need help?** Check the documentation files or open an issue on GitHub.

---

**YourBooks** - Professional Accounting Made Simple
