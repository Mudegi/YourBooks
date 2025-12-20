/**
 * API: Cost Variances Management
 * POST /api/[orgSlug]/costing/variances - Record cost variance
 * GET /api/[orgSlug]/costing/variances - List cost variances
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
    if (!hasPermission(payload.role, Permission.MANAGE_COST_VARIANCES)) {
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
      varianceType,
      standardAmount,
      actualAmount,
      varianceAmount,
      date,
      transactionId,
      referenceType,
      referenceId,
      notes,
    } = body;

    // Validation
    if (!productId || !varianceType || standardAmount === undefined || actualAmount === undefined || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, varianceType, standardAmount, actualAmount, date' },
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

    // Calculate variance if not provided
    const calculatedVariance = varianceAmount !== undefined ? varianceAmount : actualAmount - standardAmount;

    // Create cost variance
    const costVariance = await prisma.costVariance.create({
      data: {
        organizationId: organization.id,
        productId,
        varianceType,
        standardAmount,
        actualAmount,
        varianceAmount: calculatedVariance,
        date: new Date(date),
        transactionId,
        referenceType,
        referenceId,
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
      data: costVariance,
    });
  } catch (error: any) {
    console.error('Error creating cost variance:', error);
    return NextResponse.json(
      { error: 'Failed to create cost variance', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_COST_VARIANCES)) {
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
    const varianceType = searchParams.get('varianceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (productId) {
      where.productId = productId;
    }

    if (varianceType) {
      where.varianceType = varianceType;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const costVariances = await prisma.costVariance.findMany({
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
        date: 'desc',
      },
    });

    // Calculate summary statistics
    const summary = {
      totalVariance: costVariances.reduce((sum, v) => sum + v.varianceAmount, 0),
      favorableVariances: costVariances.filter(v => v.varianceAmount < 0).length,
      unfavorableVariances: costVariances.filter(v => v.varianceAmount > 0).length,
      byType: {} as Record<string, number>,
    };

    costVariances.forEach(v => {
      if (!summary.byType[v.varianceType]) {
        summary.byType[v.varianceType] = 0;
      }
      summary.byType[v.varianceType] += v.varianceAmount;
    });

    return NextResponse.json({
      success: true,
      data: costVariances,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching cost variances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost variances', details: error.message },
      { status: 500 }
    );
  }
}
