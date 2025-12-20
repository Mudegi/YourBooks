/**
 * API: Cost Revaluations Management
 * POST /api/[orgSlug]/costing/revaluations - Create cost revaluation
 * GET /api/[orgSlug]/costing/revaluations - List cost revaluations
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
    if (!hasPermission(payload.role, Permission.MANAGE_COST_REVALUATIONS)) {
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
      revaluationDate,
      oldCost,
      newCost,
      quantity,
      reason,
      notes,
    } = body;

    // Validation
    if (!productId || !revaluationDate || oldCost === undefined || newCost === undefined || quantity === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, revaluationDate, oldCost, newCost, quantity, reason' },
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

    // Calculate adjustment amounts
    const adjustmentAmount = (newCost - oldCost) * quantity;

    // Create cost revaluation
    const costRevaluation = await prisma.costRevaluation.create({
      data: {
        organizationId: organization.id,
        productId,
        warehouseId,
        revaluationDate: new Date(revaluationDate),
        oldCost,
        newCost,
        quantity,
        adjustmentAmount,
        reason,
        notes,
        status: 'PENDING',
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
      data: costRevaluation,
    });
  } catch (error: any) {
    console.error('Error creating cost revaluation:', error);
    return NextResponse.json(
      { error: 'Failed to create cost revaluation', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_COST_REVALUATIONS)) {
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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.revaluationDate = {};
      if (startDate) where.revaluationDate.gte = new Date(startDate);
      if (endDate) where.revaluationDate.lte = new Date(endDate);
    }

    const costRevaluations = await prisma.costRevaluation.findMany({
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
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
          },
        },
      },
      orderBy: {
        revaluationDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: costRevaluations,
    });
  } catch (error: any) {
    console.error('Error fetching cost revaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost revaluations', details: error.message },
      { status: 500 }
    );
  }
}
