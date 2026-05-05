/**
 * API Authentication Helpers
 * Supports both session cookies (web UI) and API keys (programmatic access)
 */

import { NextRequest } from 'next/server';
import { verifySession } from './session';
import { SessionData } from '@/domain/interfaces/services/ISessionService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { ApiKeyGenerator } from '@/infrastructure/security/ApiKeyGenerator';

const apiKeyGenerator = new ApiKeyGenerator();

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Verifies API key from Authorization header
 * Returns user session data if valid
 */
async function verifyApiKey(apiKey: string): Promise<SessionData> {
  // Extract prefix from the key (first 10 characters)
  // Format: preca_abcd... (where prefix is "preca_abcd")
  if (!apiKey || apiKey.length < 10) {
    throw new UnauthorizedError('Invalid API key format');
  }

  const keyPrefix = apiKey.substring(0, 10);

  // Find API key by prefix
  const apiKeyRecord = await prisma.api_keys.findFirst({
    where: {
      key_prefix: keyPrefix,
      is_active: true,
    },
    include: {
      users: true,
    },
  });

  if (!apiKeyRecord) {
    throw new UnauthorizedError('Invalid API key');
  }

  // Verify the full key hash using ApiKeyGenerator
  const isValid = await apiKeyGenerator.verify(apiKey, apiKeyRecord.key_hash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid API key');
  }

  // Check if key is expired
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    throw new UnauthorizedError('API key has expired');
  }

  // Update last used timestamp
  await prisma.api_keys.update({
    where: { id: apiKeyRecord.id },
    data: { last_used_at: new Date() },
  });

  return {
    userId: apiKeyRecord.user_id,
    email: apiKeyRecord.users.email,
    role: apiKeyRecord.users.role,
  };
}

/**
 * Authenticates request using either session cookie or API key
 * Checks session first, then falls back to API key
 */
export async function requireAuth(request: NextRequest): Promise<SessionData> {
  // Check for session cookie first
  const token = request.cookies.get('session')?.value;
  if (token) {
    try {
      return await verifySession(token);
    } catch (error) {
      // Session invalid, continue to check API key
    }
  }

  // Fall back to API key (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    return await verifyApiKey(apiKey);
  }

  throw new UnauthorizedError('No authentication provided. Use session cookie or API key.');
}

/**
 * Verifies the user has admin role
 * Throws ForbiddenError if user is not an admin
 */
export async function requireAdmin(request: NextRequest): Promise<SessionData> {
  const session = await requireAuth(request);

  if (session.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return session;
}

/**
 * Verifies the user has a specific permission
 * Throws ForbiddenError if user doesn't have the permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<SessionData> {
  const session = await requireAuth(request);

  // Admins always have all permissions
  if (session.role === 'admin') {
    return session;
  }

  // Fetch user to check permissions
  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { permissions: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!user.permissions.includes(permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }

  return session;
}

/**
 * Gets the current session if available, returns null otherwise
 * Does not throw errors
 */
export async function getSession(request: NextRequest): Promise<SessionData | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}
