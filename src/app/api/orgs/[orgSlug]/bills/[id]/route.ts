import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BillService } from '@/services/accounts-payable/bill.service';
import { z } from 'zod';

// Zod schema for bill status update
const updateBillSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
});

/**
 * GET /api/orgs/[orgSlug]/bills/[id]
 * Get a single bill by ID with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        vendor: true,
        items: {
          orderBy: { lineNumber: 'asc' },
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                accountType: true,
              },
            },
          },
        },
        transaction: {
          include: {
            entries: {
              include: {
                account: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    accountType: true,
                  },
                },
              },
              orderBy: { debit: 'desc' },
            },
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orgs/[orgSlug]/bills/[id]
 * Update bill status (only status can be updated)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
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
    const validatedData = updateBillSchema.parse(body);

    // Check if bill exists
    const existingBill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Only allow updates for DRAFT or SENT bills
    if (existingBill.status === 'PAID' || existingBill.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot update a ${existingBill.status.toLowerCase()} bill` },
        { status: 400 }
      );
    }

    // Update bill status using BillService
    const updatedBill = await BillService.updateBillStatus(
      params.id,
      validatedData.status,
      organizationId,
      userId
    );

    return NextResponse.json(updatedBill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bill' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orgs/[orgSlug]/bills/[id]
 * Delete a bill (only DRAFT bills can be deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
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

    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        transaction: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Only allow deletion of DRAFT bills
    if (bill.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft bills can be deleted. Use void for posted bills.' },
        { status: 400 }
      );
    }

    // Delete bill and associated transaction
    await prisma.$transaction(async (tx) => {
      // Delete bill items
      await tx.billItem.deleteMany({
        where: { billId: params.id },
      });

      // Delete bill
      await tx.bill.delete({
        where: { id: params.id },
      });
          let organizationId = request.headers.get('x-organization-id');
      // Delete associated transaction and entries
          if (!organizationId) {
            const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } });
            if (!org) {
              return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
              );
            }
            organizationId = org.id;
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
