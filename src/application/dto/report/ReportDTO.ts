/**
 * Application Layer - Report DTOs
 *
 * Data Transfer Objects for report operations
 */

import { z } from 'zod';

// ============================================
// Save Report Data DTO
// ============================================

export const SaveReportDataSchema = z.object({
  screeningId: z.string().uuid('ID de screening inválido'),
  reportData: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Los datos del reporte no pueden estar vacíos' }
  )
});

export type SaveReportDataInput = z.infer<typeof SaveReportDataSchema>;

export class SaveReportDataDTO {
  readonly screeningId: string;
  readonly reportData: Record<string, any>;

  constructor(data: unknown) {
    const parsed = SaveReportDataSchema.parse(data);
    this.screeningId = parsed.screeningId;
    this.reportData = parsed.reportData;
  }
}

// ============================================
// Generate Report DTO
// ============================================

export const GenerateReportSchema = z.object({
  screeningId: z.string().uuid('ID de screening inválido'),
  templateId: z.string().optional()
});

export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;

export class GenerateReportDTO {
  readonly screeningId: string;
  readonly templateId?: string;

  constructor(data: unknown) {
    const parsed = GenerateReportSchema.parse(data);
    this.screeningId = parsed.screeningId;
    this.templateId = parsed.templateId;
  }
}

// ============================================
// Update Service Report Schema DTO
// ============================================

const ReportFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  color: z.string().optional()
});

const ReportTableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'currency', 'date', 'status']),
  width: z.string().optional()
});

const ReportFieldValidationSchema = z.object({
  pattern: z.string().optional(),
  message: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional()
});

const FieldDependencySchema = z.object({
  field: z.string(),
  value: z.any(),
  operator: z.enum(['equals', 'notEquals', 'contains']).optional()
});

const ReportFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.enum([
    'text', 'textarea', 'number', 'currency', 'percentage',
    'date', 'select', 'boolean', 'table', 'score', 'status',
    'image', 'section_header'
  ]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: ReportFieldValidationSchema.optional(),
  options: z.array(ReportFieldOptionSchema).optional(),
  tableColumns: z.array(ReportTableColumnSchema).optional(),
  dependsOn: FieldDependencySchema.optional(),
  section: z.string().optional(),
  order: z.number()
});

const ReportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number()
});

const ReportSchemaDataSchema = z.object({
  version: z.string(),
  templateId: z.string(),
  sections: z.array(ReportSectionSchema),
  fields: z.array(ReportFieldSchema).min(1, 'El esquema debe tener al menos un campo')
});

export const UpdateServiceReportSchemaSchema = z.object({
  serviceId: z.number().positive('ID de servicio inválido'),
  reportSchema: ReportSchemaDataSchema.nullable()
});

export type UpdateServiceReportSchemaInput = z.infer<typeof UpdateServiceReportSchemaSchema>;

export class UpdateServiceReportSchemaDTO {
  readonly serviceId: number;
  readonly reportSchema: z.infer<typeof ReportSchemaDataSchema> | null;

  constructor(data: unknown) {
    const parsed = UpdateServiceReportSchemaSchema.parse(data);
    this.serviceId = parsed.serviceId;
    this.reportSchema = parsed.reportSchema;
  }
}

// ============================================
// Response DTOs
// ============================================

export interface SaveReportDataResponse {
  success: boolean;
  screeningId: string;
  message: string;
}

export interface GenerateReportResponse {
  success: boolean;
  reportUrl: string;
  fileKey: string;
  pageCount: number;
  message: string;
}

export interface ReportSchemaResponse {
  serviceId: number;
  serviceName: string;
  hasReportSchema: boolean;
  reportSchema: Record<string, any> | null;
}
