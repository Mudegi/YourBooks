import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, PermissionSections, PermissionActions } from '@/lib/rbac';
import { InvoiceService } from '@/services/accounts-receivable/invoice.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const res = await requirePermission(request, { orgSlug: params.orgSlug }, PermissionSections.INVOICES, PermissionActions.VIEW);
    if (!res.ok) return res.response;
    let organizationId = res.organizationId;
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.invoiceDate.lte = new Date(endDate);
      }
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
          },
        },
        items: {
          orderBy: {
            sortOrder: 'asc',
          },
          include: {
            taxLines: true,
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const body = await request.json();
    const res2 = await requirePermission(request, { orgSlug: params.orgSlug }, PermissionSections.INVOICES, body?.approve === true ? PermissionActions.APPROVE : PermissionActions.EDIT);
    if (!res2.ok) return res2.response;
    let organizationId = res2.organizationId;
    const userId = res2.userId;

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

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // body already parsed above

    // Validate required fields
    if (!body.customerId || !body.invoiceDate || !body.dueDate || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: body.customerId,
        organizationId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Use InvoiceService to create invoice with GL posting
    const invoice = await InvoiceService.createInvoice({
      organizationId,
      customerId: body.customerId,
      invoiceDate: new Date(body.invoiceDate),
      dueDate: new Date(body.dueDate),
      notes: body.notes,
      items: body.items.map((item: any, index: number) => ({
        lineNumber: index + 1,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        taxLines: item.taxLines || [],
        accountCode: item.accountCode || '4000', // Default to Sales Revenue
      })),
      createdById: userId,
    });

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
