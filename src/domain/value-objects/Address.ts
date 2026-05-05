/**
 * Address Value Object
 *
 * Represents a complete Mexican address
 */

export interface AddressProps {
  street: string;        // Calle y número (e.g., "Calle Principal 123 Int. 4")
  colony: string;        // Colonia
  municipality: string;  // Municipio
  state: string;         // Estado
  zipCode: string;       // Código Postal
}

export class Address {
  private constructor(private readonly props: AddressProps) {}

  static create(props: AddressProps): Address {
    // Validate required fields
    if (!props.street || props.street.trim().length === 0) {
      throw new Error('Street is required');
    }
    if (!props.colony || props.colony.trim().length === 0) {
      throw new Error('Colony is required');
    }
    if (!props.municipality || props.municipality.trim().length === 0) {
      throw new Error('Municipality is required');
    }
    if (!props.state || props.state.trim().length === 0) {
      throw new Error('State is required');
    }
    if (!props.zipCode || props.zipCode.trim().length === 0) {
      throw new Error('Zip code is required');
    }

    // Validate zip code format (5 digits)
    if (!Address.isValidZipCode(props.zipCode)) {
      throw new Error('Zip code must be 5 digits');
    }

    // Validate lengths
    if (props.street.trim().length > 500) {
      throw new Error('Street must not exceed 500 characters');
    }
    if (props.colony.trim().length > 200) {
      throw new Error('Colony must not exceed 200 characters');
    }
    if (props.municipality.trim().length > 200) {
      throw new Error('Municipality must not exceed 200 characters');
    }
    if (props.state.trim().length > 100) {
      throw new Error('State must not exceed 100 characters');
    }

    return new Address({
      street: props.street.trim(),
      colony: props.colony.trim(),
      municipality: props.municipality.trim(),
      state: props.state.trim(),
      zipCode: props.zipCode.trim()
    });
  }

  private static isValidZipCode(zipCode: string): boolean {
    const trimmed = zipCode.trim();
    return /^\d{5}$/.test(trimmed);
  }

  get street(): string { return this.props.street; }
  get colony(): string { return this.props.colony; }
  get municipality(): string { return this.props.municipality; }
  get state(): string { return this.props.state; }
  get zipCode(): string { return this.props.zipCode; }

  // Format for display
  getFullAddress(): string {
    return `${this.street}, Col. ${this.colony}, ${this.municipality}, ${this.state}, C.P. ${this.zipCode}`;
  }

  toObject(): AddressProps {
    return { ...this.props };
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.colony === other.colony &&
      this.municipality === other.municipality &&
      this.state === other.state &&
      this.zipCode === other.zipCode
    );
  }
}
