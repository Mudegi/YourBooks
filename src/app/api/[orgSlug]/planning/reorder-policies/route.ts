/**
 * API: Reorder Policies Management
 * POST /api/[orgSlug]/planning/reorder-policies - Create reorder policy
 * GET /api/[orgSlug]/planning/reorder-policies - List reorder policies
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
    if (!hasPermission(payload.role, Permission.MANAGE_REORDER_POLICIES)) {
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
      warehouseId,
      policyType,
      reorderPoint,
      minQuantity,
      maxQuantity,
      orderQuantity,
      leadTimeDays,
      reviewPeriodDays,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (!productId || !policyType) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, policyType' },
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

    // Create reorder policy
    const reorderPolicy = await prisma.reorderPolicy.create({
      data: {
        organizationId: organization.id,
        productId,
        warehouseId,
        policyType,
        reorderPoint,
        minQuantity,
        maxQuantity,
        orderQuantity,
        leadTimeDays,
        reviewPeriodDays,
        isActive,
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
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: reorderPolicy,
    });
  } catch (error: any) {
    console.error('Error creating reorder policy:', error);
    return NextResponse.json(
      { error: 'Failed to create reorder policy', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_REORDER_POLICIES)) {
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
    const warehouseId = searchParams.get('warehouseId');
    const policyType = searchParams.get('policyType');
    const isActive = searchParams.get('isActive');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (policyType) {
      where.policyType = policyType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const reorderPolicies = await prisma.reorderPolicy.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reorderPolicies,
    });
  } catch (error: any) {
    console.error('Error fetching reorder policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reorder policies', details: error.message },
      { status: 500 }
    );
  }
}
