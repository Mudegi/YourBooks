# YourBooks - Quick Setup Guide

Follow these steps to get the application running:

## Prerequisites
- Node.js 18+ installed
- Docker installed (for PostgreSQL)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start PostgreSQL Database
```bash
docker-compose up -d
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the `.env` file with your settings:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yourbooks"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
REDIS_URL="redis://localhost:6379"
MTN_MOMO_API_KEY="your-momo-key"
MTN_MOMO_USER="your-momo-user"
MTN_MOMO_COLLECTION_URL="https://sandbox.momodeveloper.mtn.com/collection"
MTN_MOMO_WEBHOOK_SECRET="your-webhook-secret"
SENDGRID_API_KEY="your-sendgrid-key"
NOTIFY_FROM_EMAIL="no-reply@yourbooks.local"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_FROM="+15551234567"
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

### 5. Seed Demo Data
```bash
npx prisma db seed
```

This creates:
- Demo organization: "Demo Company Inc." (slug: demo-company)
- Admin user: admin@example.com / password123
- 35 Chart of Accounts entries
- Sample customer, vendor, and product

### 6. Start Development Server
```bash
npm run dev
```

### 7. Access the Application
Open http://localhost:3000

**Login with:**
- Email: `admin@example.com`
- Password: `password123`

## Available Features

### ✅ Currently Working
1. **Authentication**
   - User registration with automatic organization creation
   - Login/logout with JWT sessions
   - Session management

2. **Dashboard**
   - Overview stats (Revenue, Expenses, Profit, etc.)
   - Quick actions
   - Recent activity

3. **Chart of Accounts**
   - View all accounts
   - Search and filter by type
   - Create new accounts
   - Edit existing accounts
   - Delete unused accounts
   - Balance display

4. **Journal Entries**
   - Create multi-line transactions
   - Real-time debit/credit balance validation
   - Automatic double-entry bookkeeping
   - View all posted transactions
   - Void transactions

### 🚧 Coming Soon
- Customers management
- Invoices with automatic GL posting
- Vendors and Bills
- Payments tracking
- Banking and Reconciliation
- Financial Reports (Balance Sheet, P&L, Cash Flow)
- Inventory management

## Useful Commands

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

### Development
```bash
# Start dev server
npm run dev

# Start recurring scheduler (enqueues)
npm run scheduler

# Start recurring worker (processes jobs)
npm run scheduler:worker

# Start notifications worker (email/SMS queue)
npm run notifications:worker

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Docker
```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f

# Reset database container
docker-compose down -v
docker-compose up -d
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   └── api/                 # API routes
├── components/              # Reusable UI components
├── lib/                     # Utilities and helpers
└── services/                # Business logic services
```

## Testing the Application

### 1. Test Authentication
- Register a new user at `/register`
- Login with demo credentials
- Verify dashboard loads

### 2. Test Chart of Accounts
- Navigate to General Ledger → Chart of Accounts
- Search for "Cash"
- Filter by "ASSET" type
- Click "New Account" to create one
- Try editing an existing account

### 3. Test Journal Entries
- Navigate to General Ledger → New Entry
- Add at least 2 entry lines
- Select accounts from dropdowns
- Enter amounts for debits and credits
- Verify balance validation (Debits must equal Credits)
- Submit the transaction
- View the posted transaction in the list

### 4. Test Double-Entry Validation
- Try creating an unbalanced transaction
- Verify you cannot submit unless Debits = Credits
- Check that account balances update after posting

## Troubleshooting

### Database Connection Issues
If you see "Can't reach database server":
1. Check Docker is running: `docker ps`
2. Restart PostgreSQL: `docker-compose restart`
3. Verify DATABASE_URL in `.env`

### Port Already in Use
If port 3000 is busy:
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Prisma Client Issues
If you see Prisma errors:
```bash
npx prisma generate
npx prisma migrate reset
```

### Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Chart of Accounts
- `GET /api/orgs/[orgSlug]/chart-of-accounts` - List accounts
- `POST /api/orgs/[orgSlug]/chart-of-accounts` - Create account
- `GET /api/orgs/[orgSlug]/chart-of-accounts/[id]` - Get account details
- `PUT /api/orgs/[orgSlug]/chart-of-accounts/[id]` - Update account
- `DELETE /api/orgs/[orgSlug]/chart-of-accounts/[id]` - Delete account

### Transactions
- `GET /api/orgs/[orgSlug]/transactions` - List transactions
- `POST /api/orgs/[orgSlug]/transactions` - Create transaction
- `GET /api/orgs/[orgSlug]/transactions/[id]` - Get transaction
- `DELETE /api/orgs/[orgSlug]/transactions/[id]` - Void transaction

## Next Steps

1. Create your organization's Chart of Accounts
2. Post some journal entries to test double-entry bookkeeping
3. Explore the codebase to understand the architecture
4. Start building additional features (Customers, Invoices, etc.)

## Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review the ARCHITECTURE.md file
3. Check STATUS.md for current progress

Enjoy building with YourBooks! 🚀
