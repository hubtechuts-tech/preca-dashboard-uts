/**
 * Domain Layer - Authentication Errors
 * These are business errors thrown by use cases
 */

export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class UserInactiveError extends Error {
  constructor(message: string = 'User account is deactivated') {
    super(message);
    this.name = 'UserInactiveError';
  }
}

export class InvalidLoginMethodError extends Error {
  constructor(message: string = 'Invalid login method for this user') {
    super(message);
    this.name = 'InvalidLoginMethodError';
  }
}
