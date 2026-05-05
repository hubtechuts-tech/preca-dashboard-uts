/**
 * Service Domain Errors
 *
 * Business rule violations and error conditions for Service Catalog
 */

export class ServiceNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Service not found: ${identifier}`);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceCodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Service with code '${code}' already exists`);
    this.name = 'ServiceCodeAlreadyExistsError';
  }
}

export class ServiceHasActiveScreeningsError extends Error {
  constructor(serviceId: string) {
    super(`Cannot delete service ${serviceId} because it has active screenings`);
    this.name = 'ServiceHasActiveScreeningsError';
  }
}

export class StripeIntegrationError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(`Stripe integration error: ${message}`);
    this.name = 'StripeIntegrationError';
  }
}

export class ServiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceValidationError';
  }
}
