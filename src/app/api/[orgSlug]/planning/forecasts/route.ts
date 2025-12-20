/**
 * API: Demand Forecasts Management
 * POST /api/[orgSlug]/planning/forecasts - Create demand forecast
 * GET /api/[orgSlug]/planning/forecasts - List demand forecasts
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
    if (!hasPermission(payload.role, Permission.MANAGE_DEMAND_FORECASTS)) {
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
      periodStart,
      periodEnd,
      forecastMethod,
      forecastQuantity,
      confidenceLower,
      confidenceUpper,
      accuracy,
      notes,
    } = body;

    // Validation
    if (!productId || !periodStart || !periodEnd || !forecastMethod || forecastQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, periodStart, periodEnd, forecastMethod, forecastQuantity' },
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

    // Create demand forecast
    const demandForecast = await prisma.demandForecast.create({
      data: {
        organizationId: organization.id,
        productId,
        warehouseId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        forecastMethod,
        forecastQuantity,
        confidenceLower,
        confidenceUpper,
        accuracy,
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
      data: demandForecast,
    });
  } catch (error: any) {
    console.error('Error creating demand forecast:', error);
    return NextResponse.json(
      { error: 'Failed to create demand forecast', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_DEMAND_FORECASTS)) {
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
    const forecastMethod = searchParams.get('forecastMethod');
    const startDate = searchParams.get('startDate');

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

    if (forecastMethod) {
      where.forecastMethod = forecastMethod;
    }

    if (startDate) {
      where.periodStart = { gte: new Date(startDate) };
    }

    const demandForecasts = await prisma.demandForecast.findMany({
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
        periodStart: 'desc',
      },
    });

    // Calculate accuracy summary
    const forecastsWithAccuracy = demandForecasts.filter(f => f.accuracy !== null);
    const avgAccuracy = forecastsWithAccuracy.length > 0
      ? forecastsWithAccuracy.reduce((sum, f) => sum + (f.accuracy || 0), 0) / forecastsWithAccuracy.length
      : null;

    return NextResponse.json({
      success: true,
      data: demandForecasts,
      summary: {
        totalForecasts: demandForecasts.length,
        averageAccuracy: avgAccuracy,
      },
    });
  } catch (error: any) {
    console.error('Error fetching demand forecasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demand forecasts', details: error.message },
      { status: 500 }
    );
  }
}
