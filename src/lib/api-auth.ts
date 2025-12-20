import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { getSessionFromHeaders, verifyToken } from './auth';
import { cookies } from 'next/headers';
import { Permission, hasPermission } from './permissions';
import { UserRole } from '@prisma/client';

// Middleware to validate API keys for external system access
export async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean;
  apiKey?: any;
  organization?: any;
  error?: string;
}> {
  // Get API key from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const apiKeyValue = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Hash the provided key to compare with stored hash
  const hashedKey = createHash('sha256').update(apiKeyValue).digest('hex');

  // Find API key in database
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: {
      organization: true,
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check if key is expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Check rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Count requests in the last hour (you'd implement this with Redis in production)
  // For now, we'll just update lastUsedAt
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    apiKey,
    organization: apiKey.organization,
  };
}

// Helper to check if API key has required permission
export function apiKeyHasPermission(apiKey: any, permission: string): boolean {
  return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
}

// Rate limiting helper (simplified - use Redis in production)
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<boolean> {
  // In production, use Redis with sliding window
  // For now, return true (rate limit not exceeded)
  return true;
}

type PermissionResult = {
  organizationId: string;
  userId: string;
  role: UserRole;
  permissions: string[];
};

function makeError(message: string, status: number) {
  const err = new Error(message);
  // @ts-expect-error attach http status
  err.status = status;
  return err;
}

// Require an authenticated user with a specific permission for the given org
export async function requirePermission(
  orgSlug: string,
  permission: Permission
): Promise<PermissionResult> {
  const session = await getSessionFromHeaders(headers() as unknown as Headers);

  let resolvedSession = session;

  // Fallback: check auth-token cookie directly if header-based session is missing
  if (!resolvedSession?.userId) {
    const cookieToken = cookies().get('auth-token')?.value;
    if (cookieToken) {
      const verified = await verifyToken(cookieToken);
      if (verified?.userId) {
        resolvedSession = verified as any;
      }
    }
  }

  // Dev bypass: allow local usage without auth when explicitly enabled
  if (!resolvedSession?.userId && process.env.DEV_BYPASS_AUTH === 'true') {
    const organization = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!organization) throw makeError('Organization not found', 404);
    const firstMember = await prisma.organizationUser.findFirst({
      where: { organizationId: organization.id, isActive: true },
      select: { userId: true, role: true, permissions: true },
    });
    resolvedSession = firstMember
      ? ({ userId: firstMember.userId, role: firstMember.role, permissions: firstMember.permissions || [] } as any)
      : ({ userId: 'dev-bypass', role: 'ADMIN', permissions: ['*'] } as any);
  }

  if (!resolvedSession?.userId) {
    throw makeError('Unauthorized', 401);
  }

  const organization = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!organization) {
    throw makeError('Organization not found', 404);
  }

  const membership = await prisma.organizationUser.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: resolvedSession.userId,
      },
    },
    select: {
      role: true,
      permissions: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive) {
    throw makeError('Forbidden', 403);
  }

  const permissions = membership.permissions || [];
  const roleHasPermission = hasPermission(membership.role, permission);
  const customHasPermission = permissions.includes('*') ||
    permissions.includes(permission as unknown as string);

  if (!roleHasPermission && !customHasPermission) {
    throw makeError('Forbidden', 403);
  }

  return {
    organizationId: organization.id,
    userId: resolvedSession.userId,
    role: membership.role,
    permissions,
  };
}
