/**
 * API: Tax Exemptions Management
 * POST /api/[orgSlug]/tax/exemptions - Create tax exemption
 * GET /api/[orgSlug]/tax/exemptions - List tax exemptions
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
    if (!hasPermission(payload.role, Permission.MANAGE_TAX_EXEMPTIONS)) {
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
      jurisdictionId,
      entityType,
      entityId,
      exemptionType,
      certificateNumber,
      issuedBy,
      issuedDate,
      validFrom,
      validTo,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (!jurisdictionId || !entityType || !entityId || !exemptionType || !validFrom) {
      return NextResponse.json(
        { error: 'Missing required fields: jurisdictionId, entityType, entityId, exemptionType, validFrom' },
        { status: 400 }
      );
    }

    // Verify jurisdiction exists
    const jurisdiction = await prisma.taxJurisdiction.findUnique({
      where: { id: jurisdictionId },
    });

    if (!jurisdiction) {
      return NextResponse.json({ error: 'Tax jurisdiction not found' }, { status: 404 });
    }

    // Create tax exemption
    const taxExemption = await prisma.taxExemption.create({
      data: {
        organizationId: organization.id,
        jurisdictionId,
        entityType,
        entityId,
        exemptionType,
        certificateNumber,
        issuedBy,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null,
        isActive,
        notes,
      },
      include: {
        jurisdiction: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: taxExemption,
    });
  } catch (error: any) {
    console.error('Error creating tax exemption:', error);
    return NextResponse.json(
      { error: 'Failed to create tax exemption', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_TAX_EXEMPTIONS)) {
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
    const jurisdictionId = searchParams.get('jurisdictionId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const isActive = searchParams.get('isActive');
    const validDate = searchParams.get('validDate');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (jurisdictionId) {
      where.jurisdictionId = jurisdictionId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (validDate) {
      const date = new Date(validDate);
      where.validFrom = { lte: date };
      where.OR = [
        { validTo: { gte: date } },
        { validTo: null },
      ];
    }

    const taxExemptions = await prisma.taxExemption.findMany({
      where,
      include: {
        jurisdiction: {
          select: {
            id: true,
            name: true,
            code: true,
            jurisdictionType: true,
          },
        },
      },
      orderBy: {
        validFrom: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: taxExemptions,
    });
  } catch (error: any) {
    console.error('Error fetching tax exemptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax exemptions', details: error.message },
      { status: 500 }
    );
  }
}
