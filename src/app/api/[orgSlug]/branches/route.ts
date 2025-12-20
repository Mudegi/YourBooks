import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/[orgSlug]/branches - Get all branches for organization
export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { orgSlug } = params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Build query filters
    const where: any = {
      organizationId: organization.id,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (type) {
      where.type = type;
    }

    // Fetch branches
    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            transactions: true,
            invoices: true,
            bills: true,
            customers: true,
            vendors: true,
          },
        },
      },
      orderBy: [
        { isHeadquarters: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/[orgSlug]/branches - Create a new branch
export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { orgSlug } = params;
    const body = await request.json();

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    const { code, name, type } = body;
    if (!code || !name || !type) {
      return NextResponse.json(
        { error: 'Code, name, and type are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingBranch = await prisma.branch.findUnique({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code,
        },
      },
    });

    if (existingBranch) {
      return NextResponse.json(
        { error: 'Branch code already exists' },
        { status: 409 }
      );
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        organizationId: organization.id,
        code,
        name,
        type,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || 'US',
        postalCode: body.postalCode || null,
        phone: body.phone || null,
        email: body.email || null,
        managerId: body.managerId || null,
        isHeadquarters: body.isHeadquarters || false,
        isActive: body.isActive !== undefined ? body.isActive : true,
        openingDate: body.openingDate ? new Date(body.openingDate) : new Date(),
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        taxIdNumber: body.taxIdNumber || null,
        currency: body.currency || 'USD',
        timezone: body.timezone || 'UTC',
        metadata: body.metadata || null,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
