import { prisma } from '@/lib/prisma';
import { Permission, hasPermission } from '@/lib/permissions';
import { PackageTier, UserRole } from '@prisma/client';

export async function requireOrgMembership(userId: string, orgSlug: string) {
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) throw new Error('Organization not found');

  const membership = await prisma.organizationUser.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId } },
  });
  if (!membership) throw new Error('User not in organization');
  return { org, membership };
}

export function ensurePermission(role: UserRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    const err = new Error('Forbidden');
    // @ts-expect-error attach status
    err.statusCode = 403;
    throw err;
  }
}

export async function ensurePackageAccess(
  organizationId: string,
  allowedPackages: PackageTier[]
) {
  // Package restrictions disabled - all access allowed
  return;
}
