import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, PermissionSections, PermissionActions } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const res = await requirePermission(
      request,
      { orgSlug: params.orgSlug },
      PermissionSections.GENERAL_LEDGER,
      PermissionActions.VIEW
    );
    if (!res.ok) return res.response;
    const { organizationId, userId } = res;

    const roles = await (prisma as any).role.findMany({
      where: { organizationId },
      include: { permissions: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const res = await requirePermission(
      request,
      { orgSlug: params.orgSlug },
      PermissionSections.GENERAL_LEDGER,
      PermissionActions.EDIT
    );
    if (!res.ok) return res.response;
    const { organizationId, userId } = res;

    const body = await request.json();
    const name: string = body.name;
    const description: string | undefined = body.description;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const role = await (prisma as any).role.create({
      data: { organizationId, name, description },
    });

    await logAudit({
      organizationId,
      userId,
      entityType: "Role",
      entityId: role.id,
      action: "CREATE" as any,
      changes: { name, description },
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
