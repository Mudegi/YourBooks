/**
 * API: Standard Costs Management
 * POST /api/[orgSlug]/costing/standard-costs - Create standard cost
 * GET /api/[orgSlug]/costing/standard-costs - List standard costs
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
    if (!hasPermission(payload.role, Permission.MANAGE_STANDARD_COSTS)) {
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
      costingMethod,
      materialCost,
      laborCost,
      overheadCost,
      effectiveFrom,
      effectiveTo,
      notes,
    } = body;

    // Validation
    if (!productId || !costingMethod || materialCost === undefined || laborCost === undefined || overheadCost === undefined || !effectiveFrom) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, costingMethod, materialCost, laborCost, overheadCost, effectiveFrom' },
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

    // Calculate total cost
    const totalCost = materialCost + laborCost + overheadCost;

    // Create standard cost
    const standardCost = await prisma.standardCost.create({
      data: {
        organizationId: organization.id,
        productId,
        costingMethod,
        materialCost,
        laborCost,
        overheadCost,
        totalCost,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: standardCost,
    });
  } catch (error: any) {
    console.error('Error creating standard cost:', error);
    return NextResponse.json(
      { error: 'Failed to create standard cost', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_STANDARD_COSTS)) {
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
    const costingMethod = searchParams.get('costingMethod');
    const effectiveDate = searchParams.get('effectiveDate');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (productId) {
      where.productId = productId;
    }

    if (costingMethod) {
      where.costingMethod = costingMethod;
    }

    if (effectiveDate) {
      const date = new Date(effectiveDate);
      where.effectiveFrom = { lte: date };
      where.OR = [
        { effectiveTo: { gte: date } },
        { effectiveTo: null },
      ];
    }

    const standardCosts = await prisma.standardCost.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: standardCosts,
    });
  } catch (error: any) {
    console.error('Error fetching standard costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standard costs', details: error.message },
      { status: 500 }
    );
  }
}
