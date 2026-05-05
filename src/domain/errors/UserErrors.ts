/**
 * Domain Layer - User Errors
 *
 * Business rule violations and domain-specific errors for User operations
 */

export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidPasswordError extends Error {
  constructor(message: string = 'Invalid password') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export class WeakPasswordError extends Error {
  constructor(message: string = 'Password does not meet security requirements') {
    super(message);
    this.name = 'WeakPasswordError';
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
    this.name = 'EmailAlreadyExistsError';
  }
}
