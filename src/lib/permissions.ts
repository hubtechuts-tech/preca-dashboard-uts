/**
 * Permission Utilities and Middleware
 *
 * Helper functions for checking permissions in API routes and server components
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Permission } from '../domain/entities/Permission';
import { User } from '../domain/entities/User';
import { PrismaUserRepository } from '../infrastructure/database/repositories/PrismaUserRepository';
import { prisma } from '../infrastructure/database/PrismaClient';
import { verifySession } from './session';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  return user.hasPermission(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return user.hasAnyPermission(permissions);
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return user.hasAllPermissions(permissions);
}

/**
 * Require specific permission for a route
 * Throws error if user doesn't have permission
 */
export function requirePermission(user: User, permission: Permission): void {
  if (!user.hasPermission(permission)) {
    throw new InsufficientPermissionsError(permission);
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(user: User, permissions: Permission[]): void {
  if (!user.hasAnyPermission(permissions)) {
    throw new InsufficientPermissionsError(permissions.join(' or '));
  }
}

/**
 * Require all of the specified permissions
 */
export function requireAllPermissions(user: User, permissions: Permission[]): void {
  if (!user.hasAllPermissions(permissions)) {
    throw new InsufficientPermissionsError(permissions.join(' and '));
  }
}

/**
 * Get user with permissions from session
 */
export async function getUserWithPermissions(userId: string): Promise<User | null> {
  const userRepository = new PrismaUserRepository(prisma);
  return await userRepository.findById(userId);
}

/**
 * Custom error for insufficient permissions
 */
export class InsufficientPermissionsError extends Error {
  constructor(permission: string) {
    super(`Insufficient permissions. Required: ${permission}`);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Format permission error response
 */
export function permissionErrorResponse(error: unknown): NextResponse {
  if (error instanceof InsufficientPermissionsError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

/**
 * Server Component Permission Guards
 * Use these in server components and server actions
 */

/**
 * Get current user from server component
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const session = await verifySession(token);
    if (!session) {
      return null;
    }

    return await getUserWithPermissions(session.userId);
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication in server component
 * Redirects to login if not authenticated
 */
export async function requireAuthServer(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Require specific permission in server component
 * Redirects to unauthorized page if permission not granted
 */
export async function requirePermissionServer(permission: Permission): Promise<User> {
  const user = await requireAuthServer();

  if (!user.hasPermission(permission)) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Require any of the specified permissions in server component
 * Redirects to unauthorized page if none of the permissions are granted
 */
export async function requireAnyPermissionServer(permissions: Permission[]): Promise<User> {
  const user = await requireAuthServer();

  if (!user.hasAnyPermission(permissions)) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Require admin role in server component
 * Redirects to unauthorized page if not admin
 */
export async function requireAdminServer(): Promise<User> {
  const user = await requireAuthServer();

  if (user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return user;
}
