/**
 * Application Layer - Login Data Transfer Object
 * Validates and structures login request data
 */

export class LoginDTO {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.email || this.email.trim() === '') {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Email must be a valid email address');
    }

    if (!this.password || this.password.trim() === '') {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join(', '));
    this.name = 'ValidationError';
  }
}
