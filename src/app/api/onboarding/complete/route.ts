import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DoubleEntryService } from '@/services/accounting/double-entry.service';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bankName, accountNumber, openingBalance } = body;

    // Validation
    if (!bankName || !accountNumber) {
      return NextResponse.json(
        { error: 'Bank name and account number are required' },
        { status: 400 }
      );
    }

    if (openingBalance < 0) {
      return NextResponse.json(
        { error: 'Opening balance cannot be negative' },
        { status: 400 }
      );
    }

    // Get user's organization
    const userOrg = await prisma.organizationUser.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = userOrg.organizationId;
    const organization = userOrg.organization;

    // Get or create Cash account from Chart of Accounts
    let cashAccount = await prisma.chartOfAccount.findFirst({
      where: {
        organizationId,
        code: '1000', // Cash and Cash Equivalents
      },
    });

    if (!cashAccount) {
      // Create default cash account if it doesn't exist
      cashAccount = await prisma.chartOfAccount.create({
        data: {
          organizationId,
          code: '1000',
          name: 'Cash and Cash Equivalents',
          accountType: 'ASSET',
          accountSubType: 'Current Assets',
          isActive: true,
        },
      });
    }

    // Create bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        organizationId,
        accountName: bankName,
        accountNumber,
        bankName,
        accountType: 'CHECKING', // Default to checking account
        currency: organization.baseCurrency || 'USD',
        currentBalance: openingBalance,
        isActive: true,
      },
    });

    // If there's an opening balance, create an opening balance transaction
    if (openingBalance > 0) {
      const ownerCapitalAccountId = await getOwnerCapitalAccountId(organizationId, userId);
      
      // Use DoubleEntryService to create transaction with proper transaction number
      await DoubleEntryService.createTransaction({
        organizationId,
        transactionDate: new Date(),
        transactionType: 'JOURNAL_ENTRY',
        description: `Opening balance for ${bankName}`,
        entries: [
          // Debit: Cash Account
          {
            accountId: cashAccount.id,
            entryType: 'DEBIT',
            amount: openingBalance,
            description: `Opening balance - ${bankName}`,
          },
          // Credit: Owner's Capital
          {
            accountId: ownerCapitalAccountId,
            entryType: 'CREDIT',
            amount: openingBalance,
            description: `Opening balance - ${bankName}`,
          },
        ],
        createdById: userId,
      });
    }

    // Mark onboarding as complete
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        organization: updatedOrg,
        bankAccount,
      },
    });
  } catch (error: any) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get or create Owner's Capital account
async function getOwnerCapitalAccountId(organizationId: string, userId: string): Promise<string> {
  let capitalAccount = await prisma.chartOfAccount.findFirst({
    where: {
      organizationId,
      code: '3000', // Owner's Capital
    },
  });

  if (!capitalAccount) {
    capitalAccount = await prisma.chartOfAccount.create({
      data: {
        organizationId,
        code: '3000',
        name: 'Owner\'s Capital',
        accountType: 'EQUITY',
        accountSubType: 'Equity',
        isActive: true,
      },
    });
  }

  return capitalAccount.id;
}
