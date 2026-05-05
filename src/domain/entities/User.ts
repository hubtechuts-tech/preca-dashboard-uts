/**
 * User Entity
 *
 * Core business object representing a user in the system.
 * Following Clean Architecture: NO dependencies on external frameworks.
 */

import { Permission, RolePermissions } from './Permission';

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  STAFF = 'staff',
  SYSTEM_BOT = 'system_bot'
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  // Factory method for creating a new user
  static create(
    email: string,
    role: UserRole,
    passwordHash: string | null = null,
    fullName: string | null = null,
    phoneNumber: string | null = null,
    permissions: Permission[] = []
  ): User {
    // Business rule: Email must be valid
    if (!User.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Business rule: Admins and Staff must have passwords
    if ((role === UserRole.ADMIN || role === UserRole.STAFF) && !passwordHash) {
      throw new Error('Admin and Staff users must have a password');
    }

    // Business rule: Clients can have password, but it's optional during creation (e.g. guest checkout)
    // if (role === UserRole.CLIENT && !passwordHash) {
    //   // Allowed for auto-creation
    // }

    // Business rule: Bots don't have passwords
    if (role === UserRole.SYSTEM_BOT && passwordHash) {
      throw new Error('System bots cannot have passwords');
    }

    // Business rule: Auto-assign permissions based on role if not provided
    const finalPermissions = permissions.length > 0
      ? permissions
      : User.getDefaultPermissionsForRole(role);

    return new User({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      fullName,
      phoneNumber,
      role,
      permissions: finalPermissions,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Factory method for reconstituting from database
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters (read-only access to properties)
  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get passwordHash(): string | null { return this.props.passwordHash; }
  get fullName(): string | null { return this.props.fullName; }
  get phoneNumber(): string | null { return this.props.phoneNumber; }
  get role(): UserRole { return this.props.role; }
  get permissions(): Permission[] { return [...this.props.permissions]; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  updatePassword(newPasswordHash: string): void {
    if (this.props.role === UserRole.SYSTEM_BOT) {
      throw new Error('Cannot set password for system bot');
    }

    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  updateEmail(email: string): void {
    // Business rule: Email must be valid
    if (!User.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  updateFullName(fullName: string): void {
    this.props.fullName = fullName;
    this.props.updatedAt = new Date();
  }

  updatePhoneNumber(phoneNumber: string | null): void {
    this.props.phoneNumber = phoneNumber;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  isHuman(): boolean {
    return this.props.role === UserRole.ADMIN || this.props.role === UserRole.CLIENT;
  }

  isBot(): boolean {
    return this.props.role === UserRole.SYSTEM_BOT;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isStaff(): boolean {
    return this.props.role === UserRole.STAFF;
  }

  // Permission checking methods
  hasPermission(permission: Permission): boolean {
    // Admins always have all permissions
    if (this.isAdmin()) {
      return true;
    }

    return this.props.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return permissions.some(p => this.props.permissions.includes(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return permissions.every(p => this.props.permissions.includes(p));
  }

  // Update permissions (only for STAFF role)
  updatePermissions(permissions: Permission[]): void {
    if (this.props.role !== UserRole.STAFF) {
      throw new Error('Can only update permissions for STAFF users');
    }

    this.props.permissions = [...permissions];
    this.props.updatedAt = new Date();
  }

  // Get default permissions for a role
  private static getDefaultPermissionsForRole(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return [...RolePermissions.ADMIN];
      case UserRole.CLIENT:
        return [...RolePermissions.CLIENT];
      case UserRole.STAFF:
        return [...RolePermissions.STAFF_VIEWER]; // Default to viewer
      case UserRole.SYSTEM_BOT:
        return [];
      default:
        return [];
    }
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to plain object (for serialization)
  toObject(): UserProps {
    return { ...this.props };
  }
}
