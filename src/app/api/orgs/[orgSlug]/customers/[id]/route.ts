import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validation';

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

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        invoices: {
          orderBy: {
            invoiceDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalOwed = await prisma.invoice.aggregate({
      where: {
        customerId: params.id,
        status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalPaid = await prisma.invoice.aggregate({
      where: {
        customerId: params.id,
        status: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        totalOwed: totalOwed._sum.totalAmount || 0,
        totalPaid: totalPaid._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = customerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findFirst({
        where: {
          organizationId,
          email: data.email,
          NOT: {
            id: params.id,
          },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        billingAddress: data.billingAddress,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has invoices
    if (customer._count.invoices > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing invoices. Please deactivate instead.' },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
