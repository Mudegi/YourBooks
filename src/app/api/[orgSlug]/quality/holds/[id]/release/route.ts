/**
 * API: Release Quality Hold
 * PATCH /api/[orgSlug]/quality/holds/[id]/release - Release quality hold
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, Permission } from '@/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgSlug: string; id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(payload.role, Permission.RELEASE_QUALITY_HOLDS)) {
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
    const { disposition, releaseNotes } = body;

    // Validation
    if (!disposition) {
      return NextResponse.json(
        { error: 'Missing required field: disposition' },
        { status: 400 }
      );
    }

    // Find the hold
    const hold = await prisma.qualityHold.findUnique({
      where: { id: params.id },
    });

    if (!hold) {
      return NextResponse.json({ error: 'Hold not found' }, { status: 404 });
    }

    if (hold.organizationId !== organization.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (hold.status === 'RELEASED') {
      return NextResponse.json({ error: 'Hold already released' }, { status: 400 });
    }

    // Update hold
    const updatedHold = await prisma.qualityHold.update({
      where: { id: params.id },
      data: {
        status: 'RELEASED',
        disposition,
        releaseNotes,
        releasedById: payload.userId,
        releasedAt: new Date(),
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
        releasedByUser: {
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
      data: updatedHold,
    });
  } catch (error: any) {
    console.error('Error releasing quality hold:', error);
    return NextResponse.json(
      { error: 'Failed to release quality hold', details: error.message },
      { status: 500 }
    );
  }
}
