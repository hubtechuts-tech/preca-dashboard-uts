/**
 * RFC Value Object
 *
 * Validates Mexican RFC (Registro Federal de Contribuyentes)
 * PFAE (Persona Física con Actividad Empresarial): 13 characters
 * PM (Persona Moral): 12 characters
 *
 * Note: Internally uses PersonType enum (physical/moral)
 * Converts to display names (PFAE/PM) when needed
 */

import { PersonType } from '../entities/ServiceCatalog';

export class RFC {
  private constructor(
    private readonly value: string,
    private readonly personType: PersonType
  ) {}

  static create(value: string, personType: PersonType): RFC {
    const trimmed = value.toUpperCase().trim();

    // Business rule: RFC format validation
    if (!RFC.isValid(trimmed, personType)) {
      const expectedLength = personType === PersonType.MORAL ? 12 : 13;
      const displayType = personType === PersonType.MORAL ? 'PM' : 'PFAE';
      throw new Error(
        `Invalid RFC format for ${displayType}. ` +
        `Expected ${expectedLength} characters`
      );
    }

    return new RFC(trimmed, personType);
  }

  static isValid(value: string, personType: PersonType): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const trimmed = value.trim();
    const expectedLength = personType === PersonType.MORAL ? 12 : 13;

    // Check length
    if (trimmed.length !== expectedLength) {
      return false;
    }

    // Basic format: alphanumeric only
    const rfcRegex = /^[A-Z0-9]+$/;
    return rfcRegex.test(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  getPersonType(): PersonType {
    return this.personType;
  }

  toString(): string {
    return this.value;
  }

  equals(other: RFC): boolean {
    return this.value === other.value && this.personType === other.personType;
  }

  // Helper to get display name (PFAE or PM) for UI/PDF
  getPersonTypeDisplay(): 'PFAE' | 'PM' {
    return this.personType === PersonType.MORAL ? 'PM' : 'PFAE';
  }
}
