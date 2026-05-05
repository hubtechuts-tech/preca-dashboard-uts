/**
 * Domain Layer - Form Schema Value Object
 *
 * Defines the structure and validation rules for dynamic forms
 * used in service catalog screening processes.
 */

export class FormSchema {
  constructor(
    public readonly version: string,
    public readonly fields: FormField[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.version) {
      throw new Error('Form schema version is required');
    }

    if (!this.fields || this.fields.length === 0) {
      throw new Error('Form schema must have at least one field');
    }

    // Validate unique field names
    const fieldNames = this.fields.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error('Form schema field names must be unique');
    }

    // Validate field dependencies exist
    this.fields.forEach(field => {
      if (field.dependsOn) {
        const dependencyExists = this.fields.some(
          f => f.name === field.dependsOn!.field
        );
        if (!dependencyExists) {
          throw new Error(
            `Field "${field.name}" depends on non-existent field "${field.dependsOn.field}"`
          );
        }
      }
    });
  }

  /**
   * Validates form data against this schema
   */
  validateFormData(formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Check for unknown fields (fields not in schema)
    const allowedFieldNames = new Set(this.fields.map(f => f.name));
    const providedFieldNames = Object.keys(formData);

    providedFieldNames.forEach(fieldName => {
      if (!allowedFieldNames.has(fieldName)) {
        errors.push({
          field: fieldName,
          message: `Campo '${fieldName}' no es válido para este servicio`
        });
      }
    });

    // 2. Validate schema fields
    this.fields.forEach(field => {
      const value = formData[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label} es requerido`
        });
        return;
      }

      // Skip validation if field is not required and empty
      if (!value && value !== 0 && value !== false) return;

      // Type validation
      if (!this.validateFieldType(field, value)) {
        errors.push({
          field: field.name,
          message: `${field.label} tiene un tipo inválido`
        });
      }

      // Custom validation rules
      if (field.validation) {
        const validationError = this.validateFieldRules(field, value);
        if (validationError) {
          errors.push(validationError);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateFieldType(field: FormField, value: any): boolean {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'tel':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'select':
      case 'radio':
        return field.options?.some(opt => opt.value === value) ?? false;
      case 'checkbox':
        return Array.isArray(value);
      case 'file':
        // File fields should contain URLs (strings starting with http/https)
        if (typeof value !== 'string') return false;
        return value.startsWith('http://') || value.startsWith('https://');
      default:
        return true;
    }
  }

  private validateFieldRules(field: FormField, value: any): ValidationError | null {
    const validation = field.validation!;

    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return {
          field: field.name,
          message: validation.message || `${field.label} tiene formato inválido`
        };
      }
    }

    // Min/Max validation for numbers
    if (field.type === 'number') {
      const numValue = Number(value);
      if (validation.min !== undefined && numValue < validation.min) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe ser mayor o igual a ${validation.min}`
        };
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe ser menor o igual a ${validation.max}`
        };
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe tener al menos ${validation.minLength} caracteres`
        };
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe tener máximo ${validation.maxLength} caracteres`
        };
      }
    }

    return null;
  }

  toJSON(): FormSchemaJSON {
    return {
      version: this.version,
      fields: this.fields.map(f => f.toJSON())
    };
  }

  static fromJSON(json: FormSchemaJSON): FormSchema {
    const fields = json.fields.map(f => FormField.fromJSON(f));
    return new FormSchema(json.version, fields);
  }
}

export class FormField {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly label: string,
    public readonly type: FieldType,
    public readonly required: boolean,
    public readonly placeholder?: string,
    public readonly helpText?: string,
    public readonly defaultValue?: any,
    public readonly validation?: FieldValidation,
    public readonly options?: FieldOption[],
    public readonly dependsOn?: FieldDependency,
    public readonly order: number = 0
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) throw new Error('Field id is required');
    if (!this.name) throw new Error('Field name is required');
    if (!this.label) throw new Error('Field label is required');
    if (!this.type) throw new Error('Field type is required');

    // Validate options exist for select/radio/checkbox
    if (['select', 'radio', 'checkbox'].includes(this.type)) {
      if (!this.options || this.options.length === 0) {
        throw new Error(`Field type "${this.type}" requires options`);
      }
    }
  }

  toJSON(): FormFieldJSON {
    return {
      id: this.id,
      name: this.name,
      label: this.label,
      type: this.type,
      required: this.required,
      placeholder: this.placeholder,
      helpText: this.helpText,
      defaultValue: this.defaultValue,
      validation: this.validation,
      options: this.options,
      dependsOn: this.dependsOn,
      order: this.order
    };
  }

  static fromJSON(json: FormFieldJSON): FormField {
    return new FormField(
      json.id,
      json.name,
      json.label,
      json.type,
      json.required,
      json.placeholder,
      json.helpText,
      json.defaultValue,
      json.validation,
      json.options,
      json.dependsOn,
      json.order || 0
    );
  }
}

// Type definitions
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean'
  | 'file';

export interface FieldValidation {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  maxSize?: number; // For file uploads (in bytes)
  allowedTypes?: string[]; // For file uploads (MIME types)
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDependency {
  field: string;
  value: any;
  operator?: 'equals' | 'notEquals' | 'contains';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// JSON serialization types
export interface FormSchemaJSON {
  version: string;
  fields: FormFieldJSON[];
}

export interface FormFieldJSON {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: FieldOption[];
  dependsOn?: FieldDependency;
  order: number;
}
