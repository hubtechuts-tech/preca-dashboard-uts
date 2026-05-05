/**
 * Application Layer - Additional Email DTOs
 * For managing additional email recipients for screening reports
 */

export class AddAdditionalEmailDTO {
  email: string;

  constructor(data: any) {
    this.email = data.email;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.email || typeof this.email !== 'string' || this.email.trim().length === 0) {
      errors.push('Email address is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
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

export class RemoveAdditionalEmailDTO {
  email: string;

  constructor(data: any) {
    this.email = data.email;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.email || typeof this.email !== 'string' || this.email.trim().length === 0) {
      errors.push('Email address is required');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
