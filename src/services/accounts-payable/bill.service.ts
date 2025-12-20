import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from '../accounting/double-entry.service';

interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string; // Expense account
  taxAmount: number;
}

interface CreateBillData {
  vendorId: string;
  billDate: Date;
  dueDate: Date;
  billNumber?: string;
  items: BillItem[];
  notes?: string;
  referenceNumber?: string;
}

/**
 * BillService handles bill creation with automatic double-entry posting
 * 
 * When a bill is created:
 * - DR: Expense Account (for each line item)
 * - CR: Accounts Payable (total bill amount)
 */
export class BillService {
  /**
   * Create a new bill with automatic GL posting
   */
  static async createBill(
    data: CreateBillData,
    organizationId: string,
    userId: string
  ) {
    // Validate vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: data.vendorId,
        organizationId,
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxTotal = data.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxTotal;

    // Generate bill number if not provided
    const billNumber =
      data.billNumber || (await this.generateBillNumber(organizationId));

    // Find Accounts Payable account (LIABILITY type)
    const apAccount = await prisma.account.findFirst({
      where: {
        organizationId,
        code: { startsWith: '2000' }, // Accounts Payable typically 2000-2999
        accountType: 'LIABILITY',
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    if (!apAccount) {
      throw new Error(
        'Accounts Payable account not found. Please create a LIABILITY account with code starting with 2000.'
      );
    }

    // Prepare ledger entries
    const entries: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description: string;
    }> = [];

    // DR: Expense accounts (one entry per line item)
    for (const item of data.items) {
      const lineTotal = item.quantity * item.unitPrice + item.taxAmount;
      entries.push({
        accountId: item.accountId,
        debit: lineTotal,
        credit: 0,
        description: item.description,
      });
    }

    // CR: Accounts Payable
    entries.push({
      accountId: apAccount.id,
      debit: 0,
      credit: totalAmount,
      description: `Bill ${billNumber} - ${vendor.name}`,
    });

    // Create transaction and bill in a single database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create GL transaction using DoubleEntryService
      const transaction = await DoubleEntryService.createTransaction(
        {
          transactionDate: data.billDate,
          description: `Bill ${billNumber} - ${vendor.name}`,
          referenceType: 'BILL',
          referenceId: '', // Will be updated with bill ID
          entries,
        },
        organizationId,
        userId,
        tx
      );

      // Create bill
      const bill = await tx.bill.create({
        data: {
          billNumber,
          vendorId: data.vendorId,
          organizationId,
          billDate: data.billDate,
          dueDate: data.dueDate,
          subtotalAmount: subtotal,
          taxAmount: taxTotal,
          totalAmount,
          status: 'DRAFT',
          notes: data.notes,
          referenceNumber: data.referenceNumber,
          transactionId: transaction.id,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: data.items.map((item, index) => ({
              lineNumber: index + 1,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxAmount: item.taxAmount,
              totalAmount: item.quantity * item.unitPrice + item.taxAmount,
              accountId: item.accountId,
            })),
          },
        },
        include: {
          items: true,
          vendor: true,
          transaction: {
            include: {
              entries: {
                include: {
                  account: true,
                },
              },
            },
          },
        },
      });

      // Update transaction with bill reference
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { referenceId: bill.id },
      });

      return bill;
    });

    return result;
  }

  /**
   * Generate a unique bill number
   */
  private static async generateBillNumber(organizationId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `BILL-${currentYear}`;

    // Find the latest bill for this year
    const latestBill = await prisma.bill.findFirst({
      where: {
        organizationId,
        billNumber: { startsWith: prefix },
      },
      orderBy: { billNumber: 'desc' },
    });

    let nextNumber = 1;
    if (latestBill) {
      const match = latestBill.billNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Update bill status
   * When marked as SENT, post the GL transaction
   */
  static async updateBillStatus(
    billId: string,
    newStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    organizationId: string,
    userId: string
  ) {
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        organizationId,
      },
      include: {
        transaction: true,
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Update bill status
    const updatedBill = await prisma.$transaction(async (tx) => {
      // If changing to SENT and transaction not posted, post it
      if (
        newStatus === 'SENT' &&
        bill.transaction &&
        bill.transaction.status === 'DRAFT'
      ) {
        await tx.transaction.update({
          where: { id: bill.transaction.id },
          data: { status: 'POSTED' },
        });
      }

      return await tx.bill.update({
        where: { id: billId },
        data: {
          status: newStatus,
          updatedBy: userId,
        },
        include: {
          items: true,
          vendor: true,
          transaction: {
            include: {
              entries: {
                include: {
                  account: true,
                },
              },
            },
          },
        },
      });
    });

    return updatedBill;
  }

  /**
   * Void a bill (also voids the GL transaction)
   */
  static async voidBill(
    billId: string,
    organizationId: string,
    userId: string
  ) {
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        organizationId,
      },
      include: {
        transaction: true,
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    if (bill.status === 'PAID') {
      throw new Error('Cannot void a paid bill. Reverse the payment first.');
    }

    await prisma.$transaction(async (tx) => {
      // Void the GL transaction if it exists
      if (bill.transaction) {
        await DoubleEntryService.voidTransaction(
          bill.transaction.id,
          organizationId,
          userId,
          tx
        );
      }

      // Update bill status to CANCELLED
      await tx.bill.update({
        where: { id: billId },
        data: {
          status: 'CANCELLED',
          updatedBy: userId,
        },
      });
    });

    return true;
  }
}
