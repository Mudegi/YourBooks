/**
 * API: Landed Costs Management
 * POST /api/[orgSlug]/costing/landed-costs - Create landed cost
 * GET /api/[orgSlug]/costing/landed-costs - List landed costs
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
    if (!hasPermission(payload.role, Permission.MANAGE_LANDED_COSTS)) {
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
      referenceType,
      referenceId,
      date,
      freightCost = 0,
      insuranceCost = 0,
      customsCost = 0,
      handlingCost = 0,
      otherCosts = 0,
      allocationMethod,
      allocations,
      notes,
    } = body;

    // Validation
    if (!referenceType || !referenceId || !date || !allocationMethod || !allocations || allocations.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: referenceType, referenceId, date, allocationMethod, allocations' },
        { status: 400 }
      );
    }

    // Calculate total landed cost
    const totalCost = freightCost + insuranceCost + customsCost + handlingCost + otherCosts;

    // Create landed cost with allocations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create landed cost record
      const landedCost = await tx.landedCost.create({
        data: {
          organizationId: organization.id,
          referenceType,
          referenceId,
          date: new Date(date),
          freightCost,
          insuranceCost,
          customsCost,
          handlingCost,
          otherCosts,
          totalCost,
          allocationMethod,
          notes,
        },
      });

      // Create allocation items
      const allocationItems = await Promise.all(
        allocations.map((item: any) =>
          tx.landedCostAllocationItem.create({
            data: {
              landedCostId: landedCost.id,
              productId: item.productId,
              quantity: item.quantity,
              weight: item.weight,
              volume: item.volume,
              value: item.value,
              allocatedCost: item.allocatedCost,
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
          })
        )
      );

      return {
        landedCost,
        allocations: allocationItems,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating landed cost:', error);
    return NextResponse.json(
      { error: 'Failed to create landed cost', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_LANDED_COSTS)) {
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
    const referenceType = searchParams.get('referenceType');
    const referenceId = searchParams.get('referenceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (referenceType) {
      where.referenceType = referenceType;
    }

    if (referenceId) {
      where.referenceId = referenceId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const landedCosts = await prisma.landedCost.findMany({
      where,
      include: {
        allocations: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: landedCosts,
    });
  } catch (error: any) {
    console.error('Error fetching landed costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landed costs', details: error.message },
      { status: 500 }
    );
  }
}
