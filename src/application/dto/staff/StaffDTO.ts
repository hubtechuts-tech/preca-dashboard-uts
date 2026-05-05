/**
 * Staff Management DTOs
 *
 * Data Transfer Objects for staff management operations
 */

import { User, UserRole } from '../../../domain/entities/User';
import { Permission, ALL_PERMISSIONS } from '../../../domain/entities/Permission';
import { EmailAlreadyExistsError } from '../../../domain/errors/PermissionErrors';

/**
 * DTO for creating a new staff member
 */
export class CreateStaffDTO {
  email: string;
  fullName: string;
  password: string;
  phoneNumber?: string;
  permissions: Permission[];

  constructor(data: any) {
    this.email = data.email?.trim().toLowerCase() || '';
    this.fullName = data.fullName?.trim() || '';
    this.password = data.password || '';
    this.phoneNumber = data.phoneNumber?.trim() || undefined;
    this.permissions = data.permissions || [];

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Email validation
    if (!this.email || this.email.length === 0) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    // Full name validation
    if (!this.fullName || this.fullName.length === 0) {
      errors.push('Full name is required');
    } else if (this.fullName.length < 2) {
      errors.push('Full name must be at least 2 characters');
    }

    // Password validation
    if (!this.password || this.password.length === 0) {
      errors.push('Password is required');
    } else if (this.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    // Permissions validation
    if (!Array.isArray(this.permissions)) {
      errors.push('Permissions must be an array');
    } else {
      const invalidPerms = this.permissions.filter(p => !ALL_PERMISSIONS.includes(p));
      if (invalidPerms.length > 0) {
        errors.push(`Invalid permissions: ${invalidPerms.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * DTO for updating a staff member
 */
export class UpdateStaffDTO {
  fullName?: string;
  phoneNumber?: string;
  permissions?: Permission[];
  isActive?: boolean;

  constructor(data: any) {
    this.fullName = data.fullName?.trim() || undefined;
    this.phoneNumber = data.phoneNumber?.trim() || undefined;
    this.permissions = data.permissions || undefined;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : undefined;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Full name validation (if provided)
    if (this.fullName !== undefined && this.fullName.length < 2) {
      errors.push('Full name must be at least 2 characters');
    }

    // Permissions validation (if provided)
    if (this.permissions !== undefined) {
      if (!Array.isArray(this.permissions)) {
        errors.push('Permissions must be an array');
      } else {
        const invalidPerms = this.permissions.filter(p => !ALL_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
          errors.push(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  hasUpdates(): boolean {
    return this.fullName !== undefined ||
           this.phoneNumber !== undefined ||
           this.permissions !== undefined ||
           this.isActive !== undefined;
  }
}

/**
 * Response DTO for staff member
 */
export class StaffResponseDTO {
  id!: string;
  email!: string;
  fullName!: string | null;
  phoneNumber!: string | null;
  role!: UserRole;
  permissions!: Permission[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(user: User): StaffResponseDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

/**
 * List response DTO
 */
export class StaffListResponseDTO {
  staff!: StaffResponseDTO[];
  total!: number;

  static create(staff: User[], total: number): StaffListResponseDTO {
    return {
      staff: staff.map(s => StaffResponseDTO.fromDomain(s)),
      total,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
