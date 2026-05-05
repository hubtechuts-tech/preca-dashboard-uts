/**
 * Advisor Entity
 *
 * Represents a real estate advisor who refers clients to use our screening services.
 * Following Clean Architecture: NO dependencies on external frameworks.
 */

export interface AdvisorProps {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Advisor {
  private constructor(private props: AdvisorProps) {}

  // Factory method for creating a new advisor
  static create(
    name: string,
    email: string,
    phoneNumber: string
  ): Advisor {
    // Business rule: Name is required
    if (!name || name.trim().length === 0) {
      throw new Error('Advisor name is required');
    }

    if (name.trim().length < 2) {
      throw new Error('Advisor name must be at least 2 characters');
    }

    if (name.trim().length > 200) {
      throw new Error('Advisor name must not exceed 200 characters');
    }

    // Business rule: Email must be valid
    if (!Advisor.isValidEmail(email)) {
      throw new Error('Invalid advisor email format');
    }

    // Business rule: Phone number is required
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('Advisor phone number is required');
    }

    if (phoneNumber.trim().length < 10) {
      throw new Error('Advisor phone number must be at least 10 digits');
    }

    if (phoneNumber.trim().length > 20) {
      throw new Error('Advisor phone number must not exceed 20 characters');
    }

    return new Advisor({
      id: 0, // Will be set by database auto-increment
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Factory method for reconstituting from database
  static reconstitute(props: AdvisorProps): Advisor {
    return new Advisor(props);
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get phoneNumber(): string { return this.props.phoneNumber; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phoneNumber?: string): void {
    if (email) {
      if (!Advisor.isValidEmail(email)) {
        throw new Error('Invalid advisor email format');
      }
      this.props.email = email.toLowerCase().trim();
    }

    if (phoneNumber) {
      if (phoneNumber.trim().length < 10) {
        throw new Error('Advisor phone number must be at least 10 digits');
      }
      if (phoneNumber.trim().length > 20) {
        throw new Error('Advisor phone number must not exceed 20 characters');
      }
      this.props.phoneNumber = phoneNumber.trim();
    }

    this.props.updatedAt = new Date();
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to plain object (for serialization)
  toObject(): AdvisorProps {
    return { ...this.props };
  }
}
