import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BillService } from '@/services/accounts-payable/bill.service';
import { z } from 'zod';

// Zod schema for bill item
const billItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  accountId: z.string().min(1, 'Account is required'),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').default(0),
});

// Zod schema for bill creation
const createBillSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  billDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  billNumber: z.string().optional(),
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

/**
 * GET /api/orgs/[orgSlug]/bills
 * List all bills with optional filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate) {
      where.billDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.billDate = {
        ...where.billDate,
        lte: new Date(endDate),
      };
    }

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { billDate: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
            status: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    // Calculate summary statistics
    const stats = {
      total: bills.length,
      outstanding: bills.filter(
        (b) => b.status === 'SENT' || b.status === 'OVERDUE'
      ).length,
      outstandingAmount: bills
        .filter((b) => b.status === 'SENT' || b.status === 'OVERDUE')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      totalAmount: bills.reduce((sum, b) => sum + b.totalAmount, 0),
      paid: bills.filter((b) => b.status === 'PAID').length,
      paidAmount: bills
        .filter((b) => b.status === 'PAID')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      overdue: bills.filter((b) => b.status === 'OVERDUE').length,
      overdueAmount: bills
        .filter((b) => b.status === 'OVERDUE')
        .reduce((sum, b) => sum + b.totalAmount, 0),
    };

    return NextResponse.json({
      bills,
      stats,
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/[orgSlug]/bills
 * Create a new bill with automatic GL posting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'Organization or user not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createBillSchema.parse(body);

    // Validate vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: validatedData.vendorId,
        organizationId,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Validate all expense accounts exist
    const accountIds = validatedData.items.map((item) => item.accountId);
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        organizationId,
        isActive: true,
      },
    });

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { error: 'One or more accounts not found' },
        { status: 400 }
      );
    }

    // Create bill using BillService (handles double-entry posting)
    const bill = await BillService.createBill(
      validatedData,
      organizationId,
      userId
    );

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create bill' },
      { status: 500 }
    );
  }
}
