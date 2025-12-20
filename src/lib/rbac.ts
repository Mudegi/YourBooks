import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type PermissionSection =
  | "GENERAL_LEDGER"
  | "INVOICES"
  | "REPORTS"
  | "PAYMENTS"
  | "VENDORS"
  | "CUSTOMERS";

export type PermissionAction = "VIEW" | "EDIT" | "DELETE" | "APPROVE";

export type PermissionKey = `${PermissionSection}.${PermissionAction}`;

export const PermissionSections = {
  GENERAL_LEDGER: "GENERAL_LEDGER",
  INVOICES: "INVOICES",
  REPORTS: "REPORTS",
  PAYMENTS: "PAYMENTS",
  VENDORS: "VENDORS",
  CUSTOMERS: "CUSTOMERS",
} as const;

export const PermissionActions = {
  VIEW: "VIEW",
  EDIT: "EDIT",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
} as const;

async function resolveOrganizationId(req: NextRequest, orgSlug?: string): Promise<string | null> {
  const headerOrgId = req.headers.get("x-organization-id");
  if (headerOrgId) return headerOrgId;
  if (!orgSlug) return null;
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true } });
  return org?.id || null;
}

export async function getEffectivePermissions(organizationId: string, userId: string): Promise<Set<string>> {
  const perms = new Set<string>();

  const orgUser = await prisma.organizationUser.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { permissions: true, id: true },
  });
  if (!orgUser) return perms;

  // Legacy inline permissions: expect format SECTION.ACTION strings
  for (const p of orgUser.permissions || []) {
    const [section, action] = p.split(".");
    if (section && action) {
      perms.add(`${section}.${action}`);
    }
  }

  // Role-based permissions
  const rolePerms = await (prisma as any).organizationUserRole.findMany({
    where: { organizationId, orgUserId: orgUser.id },
    include: { role: { include: { permissions: true } } },
  });
  for (const ur of rolePerms) {
    for (const rp of ur.role.permissions) {
      perms.add(`${rp.section}.${rp.action}`);
    }
  }

  return perms;
}

export async function hasPermission(
  organizationId: string,
  userId: string,
  section: PermissionSection,
  action: PermissionAction
): Promise<boolean> {
  const perms = await getEffectivePermissions(organizationId, userId);
  return perms.has(`${section}.${action}`);
}

export async function requirePermission(
  req: NextRequest,
  params: { orgSlug?: string },
  section: PermissionSection,
  action: PermissionAction
): Promise<{ ok: true; organizationId: string; userId: string } | { ok: false; response: NextResponse }> {
  const orgId = await resolveOrganizationId(req, params.orgSlug);
  if (!orgId) {
    return { ok: false, response: NextResponse.json({ error: "Organization not found" }, { status: 404 }) };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const allowed = await hasPermission(orgId, user.id, section, action);
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, organizationId: orgId, userId: user.id };
}
