/**
 * API: Non-Conformance Reports (NCR) Management
 * POST /api/[orgSlug]/quality/ncr - Create NCR
 * GET /api/[orgSlug]/quality/ncr - List NCRs
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, Permission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(payload.role, Permission.MANAGE_NCR)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      productId,
      vendorId,
      customerId,
      source,
      severity,
      description,
      quantity,
      lotNumber,
      batchNumber,
      notes,
    } = body;

    // Validation
    if (!productId || !source || !severity || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, source, severity, description' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate NCR number
    const year = new Date().getFullYear();
    const lastNCR = await prisma.nonConformanceReport.findFirst({
      where: {
        organizationId: organization.id,
        ncrNumber: {
          startsWith: `NCR-${year}`,
        },
      },
      orderBy: {
        ncrNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastNCR) {
      const match = lastNCR.ncrNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const ncrNumber = `NCR-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create NCR
    const ncr = await prisma.nonConformanceReport.create({
      data: {
        organizationId: organization.id,
        productId,
        vendorId,
        customerId,
        ncrNumber,
        source,
        severity,
        description,
        quantity,
        lotNumber,
        batchNumber,
        status: 'OPEN',
        detectedById: payload.userId,
        detectedAt: new Date(),
        notes,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        detectedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: ncr,
    });
  } catch (error: any) {
    console.error('Error creating NCR:', error);
    return NextResponse.json(
      { error: 'Failed to create NCR', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(payload.role, Permission.VIEW_NCR)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const source = searchParams.get('source');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (productId) {
      where.productId = productId;
    }

    if (source) {
      where.source = source;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    const ncrs = await prisma.nonConformanceReport.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        detectedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        detectedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: ncrs,
    });
  } catch (error: any) {
    console.error('Error fetching NCRs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NCRs', details: error.message },
      { status: 500 }
    );
  }
}
