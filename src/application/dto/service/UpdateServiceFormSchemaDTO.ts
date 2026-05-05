import { FormSchemaJSON } from '@/domain/value-objects/FormSchema';

/**
 * DTO for updating a service's form schema
 * Application Layer - Data Transfer Object
 */
export class UpdateServiceFormSchemaDTO {
  serviceId: number;
  formSchema: FormSchemaJSON;

  constructor(data: any) {
    this.serviceId = data.serviceId;
    this.formSchema = data.formSchema;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.serviceId || typeof this.serviceId !== 'number') {
      errors.push('Service ID is required and must be a number');
    }

    if (!this.formSchema) {
      errors.push('Form schema is required');
    }

    if (this.formSchema && !this.formSchema.version) {
      errors.push('Form schema version is required');
    }

    if (this.formSchema && (!Array.isArray(this.formSchema.fields) || this.formSchema.fields.length === 0)) {
      errors.push('Form schema must have at least one field');
    }

    // Validate each field has required properties
    if (this.formSchema && Array.isArray(this.formSchema.fields)) {
      this.formSchema.fields.forEach((field, index) => {
        if (!field.id) {
          errors.push(`Field at index ${index} is missing 'id'`);
        }
        if (!field.name) {
          errors.push(`Field at index ${index} is missing 'name'`);
        }
        if (!field.label) {
          errors.push(`Field at index ${index} is missing 'label'`);
        }
        if (!field.type) {
          errors.push(`Field at index ${index} is missing 'type'`);
        }
        if (typeof field.required !== 'boolean') {
          errors.push(`Field at index ${index} is missing 'required' boolean`);
        }
        if (typeof field.order !== 'number') {
          errors.push(`Field at index ${index} is missing 'order' number`);
        }

        // Validate that select/radio/checkbox fields have options
        if (['select', 'radio', 'checkbox'].includes(field.type)) {
          if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
            errors.push(`Field '${field.name}' of type '${field.type}' requires options`);
          }
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
