/**
 * Permission Enum
 *
 * Granular permissions for role-based access control
 * Following Clean Architecture: Pure TypeScript, no dependencies
 */

export enum Permission {
  // Screening permissions
  SCREENINGS_READ = 'screenings:read',
  SCREENINGS_WRITE = 'screenings:write',

  // Client permissions
  CLIENTS_READ = 'clients:read',
  CLIENTS_WRITE = 'clients:write',

  // Service permissions
  SERVICES_READ = 'services:read',
  SERVICES_WRITE = 'services:write',

  // API Key permissions
  API_KEYS_READ = 'api_keys:read',
  API_KEYS_WRITE = 'api_keys:write',

  // User/Staff management permissions
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',

  // Coupon permissions
  COUPONS_READ = 'coupons:read',
  COUPONS_WRITE = 'coupons:write',

  // Advisor permissions
  ADVISORS_READ = 'advisors:read',
  ADVISORS_WRITE = 'advisors:write',
}

/**
 * Permission groups for easier management
 */
export const PermissionGroups = {
  SCREENINGS: [Permission.SCREENINGS_READ, Permission.SCREENINGS_WRITE],
  CLIENTS: [Permission.CLIENTS_READ, Permission.CLIENTS_WRITE],
  SERVICES: [Permission.SERVICES_READ, Permission.SERVICES_WRITE],
  API_KEYS: [Permission.API_KEYS_READ, Permission.API_KEYS_WRITE],
  USERS: [Permission.USERS_READ, Permission.USERS_WRITE],
  COUPONS: [Permission.COUPONS_READ, Permission.COUPONS_WRITE],
  ADVISORS: [Permission.ADVISORS_READ, Permission.ADVISORS_WRITE],
} as const;

/**
 * All available permissions
 */
export const ALL_PERMISSIONS = Object.values(Permission);

/**
 * Default permission sets for role templates
 */
export const RolePermissions = {
  // Admin has all permissions
  ADMIN: ALL_PERMISSIONS,

  // Client can only read their own screenings (handled in use cases)
  CLIENT: [],

  // Staff Viewer: Read-only access to screenings and clients
  STAFF_VIEWER: [
    Permission.SCREENINGS_READ,
    Permission.CLIENTS_READ,
  ],

  // Staff Manager: Full access except API keys
  STAFF_MANAGER: [
    Permission.SCREENINGS_READ,
    Permission.SCREENINGS_WRITE,
    Permission.CLIENTS_READ,
    Permission.CLIENTS_WRITE,
    Permission.SERVICES_READ,
    Permission.SERVICES_WRITE,
  ],

  // Staff Full: Everything except API key management
  STAFF_FULL: ALL_PERMISSIONS.filter(
    p => p !== Permission.API_KEYS_READ && p !== Permission.API_KEYS_WRITE
  ),
} as const;

/**
 * Check if a permission is a read permission
 */
export function isReadPermission(permission: Permission): boolean {
  return permission.endsWith(':read');
}

/**
 * Check if a permission is a write permission
 */
export function isWritePermission(permission: Permission): boolean {
  return permission.endsWith(':write');
}

/**
 * Get the read permission for a given write permission
 */
export function getReadPermission(writePermission: Permission): Permission | null {
  if (!isWritePermission(writePermission)) {
    return null;
  }
  const readPermString = writePermission.replace(':write', ':read');
  return Object.values(Permission).find(p => p === readPermString) || null;
}
