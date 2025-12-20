import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for vendor validation
const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  taxId: z.string().optional().nullable(),
  
  contactPerson: z.string().optional().nullable(),
  contactEmail: z.string().email('Invalid contact email').optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  
  billingAddress: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().optional().nullable(),
  billingPostalCode: z.string().optional().nullable(),
  billingCountry: z.string().optional().nullable(),
  
  paymentTerms: z.enum([
    'DUE_ON_RECEIPT',
    'NET_15',
    'NET_30',
    'NET_60',
    'NET_90'
  ]).default('NET_30'),
  
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/orgs/[orgSlug]/vendors
 * List all vendors with optional search and filters
 */
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bills: true },
        },
        bills: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    // Calculate totalOwed for each vendor (bills with SENT or OVERDUE status)
    const vendorsWithTotals = vendors.map((vendor) => {
      const totalOwed = vendor.bills
        .filter((bill) => bill.status === 'SENT' || bill.status === 'OVERDUE')
        .reduce((sum, bill) => sum + bill.totalAmount, 0);

      const totalPaid = vendor.bills
        .filter((bill) => bill.status === 'PAID')
        .reduce((sum, bill) => sum + bill.totalAmount, 0);

      return {
        ...vendor,
        totalOwed,
        totalPaid,
      };
    });

    return NextResponse.json({
      vendors: vendorsWithTotals,
      count: vendors.length,
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/[orgSlug]/vendors
 * Create a new vendor
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
    const validatedData = vendorSchema.parse(body);

    // Check if email is unique (if provided)
    if (validatedData.email) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          organizationId,
          email: validatedData.email,
        },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: 'A vendor with this email already exists' },
          { status: 400 }
        );
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
