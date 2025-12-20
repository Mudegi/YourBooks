import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    let organizationId = request.headers.get('x-organization-id');
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
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Fetch customers with invoice count and total owed
    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
        invoices: {
          where: {
            status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
          },
          select: {
            totalAmount: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate total owed for each customer
    const customersWithOwed = customers.map((customer) => ({
      ...customer,
      totalOwed: customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      invoices: undefined, // Remove invoices array from response
    }));

    return NextResponse.json({
      success: true,
      data: customersWithOwed,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    let organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

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

    // Check if email already exists
    if (data.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          organizationId,
          email: data.email,
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: data.name,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        billingAddress: data.billingAddress,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms || 'NET_30',
        isActive: data.isActive ?? true,
        createdById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
