/**
 * Application Layer - User DTOs
 * Data Transfer Objects for user operations with validation
 */

export class UpdateProfileDTO {
  fullName?: string;
  email?: string;

  constructor(data: any) {
    this.fullName = data.fullName?.trim();
    this.email = data.email?.trim();
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (this.fullName !== undefined) {
      if (this.fullName.length === 0) {
        errors.push('Full name cannot be empty');
      }
      if (this.fullName.length > 255) {
        errors.push('Full name is too long (max 255 characters)');
      }
    }

    if (this.email !== undefined) {
      if (this.email.length === 0) {
        errors.push('Email cannot be empty');
      }
      if (!this.isValidEmail(this.email)) {
        errors.push('Invalid email format');
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

  hasChanges(): boolean {
    return this.fullName !== undefined || this.email !== undefined;
  }
}

export class UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;

  constructor(data: any) {
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.currentPassword) {
      errors.push('Current password is required');
    }

    if (!this.newPassword) {
      errors.push('New password is required');
    }

    if (this.newPassword && this.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }

    if (this.newPassword && !this.isStrongPassword(this.newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (this.currentPassword && this.newPassword && this.currentPassword === this.newPassword) {
      errors.push('New password must be different from current password');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private isStrongPassword(password: string): boolean {
    // At least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasUppercase && hasLowercase && hasNumber;
  }
}

export class UserResponseDTO {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.role = data.role;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromDomain(user: any): UserResponseDTO {
    return new UserResponseDTO({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
