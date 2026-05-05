/**
 * Permission-related Domain Errors
 *
 * Following Clean Architecture: Domain-specific errors with clear semantics
 */

export class InsufficientPermissionsError extends Error {
  constructor(requiredPermission: string) {
    super(`Insufficient permissions. Required: ${requiredPermission}`);
    this.name = 'InsufficientPermissionsError';
  }
}

export class ForbiddenActionError extends Error {
  constructor(action: string) {
    super(`Forbidden: You do not have permission to ${action}`);
    this.name = 'ForbiddenActionError';
  }
}

export class InvalidPermissionError extends Error {
  constructor(permission: string) {
    super(`Invalid permission: ${permission}`);
    this.name = 'InvalidPermissionError';
  }
}

export class CannotModifyAdminPermissionsError extends Error {
  constructor() {
    super('Cannot modify permissions for admin users');
    this.name = 'CannotModifyAdminPermissionsError';
  }
}

export class StaffUserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Staff user with ID ${userId} not found`);
    this.name = 'StaffUserNotFoundError';
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'EmailAlreadyExistsError';
  }
}
