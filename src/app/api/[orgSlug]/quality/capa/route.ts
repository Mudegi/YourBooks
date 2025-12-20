/**
 * API: CAPA (Corrective and Preventive Actions) Management
 * POST /api/[orgSlug]/quality/capa - Create CAPA
 * GET /api/[orgSlug]/quality/capa - List CAPAs
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
    if (!hasPermission(payload.role, Permission.MANAGE_CAPA)) {
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
      ncrId,
      type,
      priority,
      title,
      description,
      rootCause,
      proposedAction,
      targetDate,
      notes,
    } = body;

    // Validation
    if (!type || !priority || !title || !description || !targetDate) {
      return NextResponse.json(
        { error: 'Missing required fields: type, priority, title, description, targetDate' },
        { status: 400 }
      );
    }

    // Generate CAPA number
    const year = new Date().getFullYear();
    const lastCAPA = await prisma.cAPA.findFirst({
      where: {
        organizationId: organization.id,
        capaNumber: {
          startsWith: `CAPA-${year}`,
        },
      },
      orderBy: {
        capaNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastCAPA) {
      const match = lastCAPA.capaNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const capaNumber = `CAPA-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create CAPA
    const capa = await prisma.cAPA.create({
      data: {
        organizationId: organization.id,
        ncrId,
        capaNumber,
        type,
        priority,
        title,
        description,
        rootCause,
        proposedAction,
        targetDate: new Date(targetDate),
        status: 'OPEN',
        notes,
      },
      include: {
        ncr: {
          select: {
            id: true,
            ncrNumber: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: capa,
    });
  } catch (error: any) {
    console.error('Error creating CAPA:', error);
    return NextResponse.json(
      { error: 'Failed to create CAPA', details: error.message },
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
    if (!hasPermission(payload.role, Permission.VIEW_CAPA)) {
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
    const ncrId = searchParams.get('ncrId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    // Build filter
    const where: any = {
      organizationId: organization.id,
    };

    if (ncrId) {
      where.ncrId = ncrId;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    const capas = await prisma.cAPA.findMany({
      where,
      include: {
        ncr: {
          select: {
            id: true,
            ncrNumber: true,
            description: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifiedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: capas,
    });
  } catch (error: any) {
    console.error('Error fetching CAPAs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CAPAs', details: error.message },
      { status: 500 }
    );
  }
}
