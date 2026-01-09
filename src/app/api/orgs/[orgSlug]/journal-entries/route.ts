import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, PermissionSections, PermissionActions } from '@/lib/rbac';
import { journalListService } from '@/services/accounting/journal-list.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    // Permission: VIEW General Ledger
    const res = await requirePermission(
      request, 
      { orgSlug: params.orgSlug }, 
      PermissionSections.GENERAL_LEDGER, 
      PermissionActions.VIEW
    );
    if (!res.ok) return res.response;
    
    const organizationId = res.organizationId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build filters from query parameters
    const filters: any = {};
    
    // Accounting Period
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filters.accountingPeriod = {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      };
    }
    
    // Other filters
    const branchId = searchParams.get('branchId');
    const transactionType = searchParams.get('transactionType');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');
    const search = searchParams.get('search');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    
    if (branchId) filters.branchId = branchId;
    if (transactionType) filters.transactionType = transactionType;
    if (status) filters.status = status;
    if (createdBy) filters.createdBy = createdBy;
    if (search) filters.search = search;
    
    if (minAmount || maxAmount) {
      filters.amountRange = {
        ...(minAmount && { min: parseFloat(minAmount) }),
        ...(maxAmount && { max: parseFloat(maxAmount) }),
      };
    }

    // Fetch journal entries using the service
    const result = await journalListService.getJournalEntries(
      organizationId,
      filters,
      { page, limit }
    );

    return NextResponse.json({
      success: true,
      entries: result.entries,
      total: result.total,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
      organizationSettings: result.organizationSettings,
      localizationMetadata: result.localizationMetadata,
    });

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch journal entries',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}