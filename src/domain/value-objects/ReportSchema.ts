/**
 * Domain Layer - Report Schema Value Object
 *
 * Defines the structure and validation rules for dynamic report generation forms
 * used by admins to fill in report data before PDF generation.
 */

export class ReportSchema {
  constructor(
    public readonly version: string,
    public readonly templateId: string,
    public readonly sections: ReportSection[],
    public readonly fields: ReportField[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.version) {
      throw new Error('Report schema version is required');
    }

    if (!this.templateId) {
      throw new Error('Report schema templateId is required');
    }

    if (!this.fields || this.fields.length === 0) {
      throw new Error('Report schema must have at least one field');
    }

    // Validate unique field names
    const fieldNames = this.fields.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error('Report schema field names must be unique');
    }

    // Validate section references exist
    const sectionIds = new Set(this.sections.map(s => s.id));
    this.fields.forEach(field => {
      if (field.section && !sectionIds.has(field.section)) {
        throw new Error(
          `Field "${field.name}" references non-existent section "${field.section}"`
        );
      }
    });

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
   * Validates report data against this schema
   */
  validateReportData(reportData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Check for unknown fields (fields not in schema)
    const allowedFieldNames = new Set(this.fields.map(f => f.name));
    const providedFieldNames = Object.keys(reportData);

    providedFieldNames.forEach(fieldName => {
      if (!allowedFieldNames.has(fieldName)) {
        errors.push({
          field: fieldName,
          message: `Campo '${fieldName}' no es válido para este reporte`
        });
      }
    });

    // 2. Validate schema fields
    this.fields.forEach(field => {
      const value = reportData[field.name];

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

  private validateFieldType(field: ReportField, value: any): boolean {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return typeof value === 'string';
      case 'number':
      case 'currency':
      case 'percentage':
      case 'score':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'select':
      case 'status':
        return field.options?.some(opt => opt.value === value) ?? false;
      case 'table':
        return Array.isArray(value);
      case 'image':
        // Image fields should contain URLs (strings starting with http/https) or base64
        if (typeof value !== 'string') return false;
        return value.startsWith('http://') ||
          value.startsWith('https://') ||
          value.startsWith('data:image/');
      case 'section_header':
        // Section headers don't have values
        return true;
      default:
        return true;
    }
  }

  private validateFieldRules(field: ReportField, value: any): ValidationError | null {
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
    if (['number', 'currency', 'percentage', 'score'].includes(field.type)) {
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

    // Table validation
    if (field.type === 'table' && Array.isArray(value)) {
      if (validation.min !== undefined && value.length < validation.min) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe tener al menos ${validation.min} filas`
        };
      }
      if (validation.max !== undefined && value.length > validation.max) {
        return {
          field: field.name,
          message: validation.message || `${field.label} debe tener máximo ${validation.max} filas`
        };
      }
    }

    return null;
  }

  /**
   * Get fields grouped by section
   */
  getFieldsBySection(): Map<string | null, ReportField[]> {
    const grouped = new Map<string | null, ReportField[]>();

    // Initialize with null for fields without section
    grouped.set(null, []);

    // Initialize sections
    this.sections.forEach(section => {
      grouped.set(section.id, []);
    });

    // Group fields
    this.fields.forEach(field => {
      const sectionId = field.section || null;
      const sectionFields = grouped.get(sectionId) || [];
      sectionFields.push(field);
      grouped.set(sectionId, sectionFields);
    });

    return grouped;
  }

  toJSON(): ReportSchemaJSON {
    return {
      version: this.version,
      templateId: this.templateId,
      sections: this.sections.map(s => ({
        id: s.id,
        title: s.title,
        order: s.order
      })),
      fields: this.fields.map(f => f.toJSON())
    };
  }

  static fromJSON(json: ReportSchemaJSON): ReportSchema {
    const sections = json.sections.map(s => ({
      id: s.id,
      title: s.title,
      order: s.order
    }));
    const fields = json.fields.map(f => ReportField.fromJSON(f));
    return new ReportSchema(json.version, json.templateId, sections, fields);
  }
}

export class ReportField {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly label: string,
    public readonly type: ReportFieldType,
    public readonly required: boolean,
    public readonly placeholder?: string,
    public readonly helpText?: string,
    public readonly defaultValue?: any,
    public readonly validation?: ReportFieldValidation,
    public readonly options?: ReportFieldOption[],
    public readonly tableColumns?: ReportTableColumn[],
    public readonly dependsOn?: FieldDependency,
    public readonly section?: string,
    public readonly order: number = 0
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) throw new Error('Field id is required');
    if (!this.name) throw new Error('Field name is required');
    if (!this.label) throw new Error('Field label is required');
    if (!this.type) throw new Error('Field type is required');

    // Validate options exist for select/status
    if (['select', 'status'].includes(this.type)) {
      if (!this.options || this.options.length === 0) {
        throw new Error(`Field type "${this.type}" requires options`);
      }
    }

    // Validate table columns exist for table type
    if (this.type === 'table') {
      if (!this.tableColumns || this.tableColumns.length === 0) {
        throw new Error('Field type "table" requires tableColumns');
      }
    }
  }

  toJSON(): ReportFieldJSON {
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
      tableColumns: this.tableColumns,
      dependsOn: this.dependsOn,
      section: this.section,
      order: this.order
    };
  }

  static fromJSON(json: ReportFieldJSON): ReportField {
    return new ReportField(
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
      json.tableColumns,
      json.dependsOn,
      json.section,
      json.order || 0
    );
  }
}

// Type definitions
export type ReportFieldType =
  | 'text'           // Single line text
  | 'textarea'       // Multi-line text
  | 'number'         // Numeric input
  | 'currency'       // Money format (MXN)
  | 'percentage'     // Percentage display
  | 'date'           // Date picker
  | 'select'         // Dropdown
  | 'boolean'        // Yes/No toggle
  | 'table'          // Tabular data (credit accounts, etc.)
  | 'score'          // Credit score with visual
  | 'status'         // Status indicator (good/warning/bad)
  | 'image'          // Image/signature upload
  | 'section_header'; // Visual grouping (no value)

export interface ReportFieldValidation {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ReportFieldOption {
  value: string;
  label: string;
  color?: string; // For status fields (hex color)
}

export interface ReportTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'status';
  width?: string; // CSS width
}

export interface FieldDependency {
  field: string;
  value?: any;
  operator?: 'equals' | 'notEquals' | 'contains';
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
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
export interface ReportSchemaJSON {
  version: string;
  templateId: string;
  sections: ReportSection[];
  fields: ReportFieldJSON[];
}

export interface ReportFieldJSON {
  id: string;
  name: string;
  label: string;
  type: ReportFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: ReportFieldValidation;
  options?: ReportFieldOption[];
  tableColumns?: ReportTableColumn[];
  dependsOn?: FieldDependency;
  section?: string;
  order: number;
}
