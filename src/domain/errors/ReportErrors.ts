/**
 * Domain Layer - Report Errors
 *
 * Custom errors for report generation operations
 */

export class ReportError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ReportError';
  }
}

export class ReportSchemaValidationError extends ReportError {
  constructor(
    public readonly validationErrors: Array<{ field: string; message: string }>
  ) {
    const errorCount = validationErrors.length;
    const firstErrors = validationErrors.slice(0, 3).map(e => e.message).join(', ');
    super(`Validación de datos del reporte fallida: ${firstErrors}${errorCount > 3 ? '...' : ''}`);
    this.name = 'ReportSchemaValidationError';
  }
}

export class TemplateNotFoundError extends ReportError {
  constructor(templateId: string) {
    super(`Plantilla de reporte no encontrada: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

export class PdfGenerationError extends ReportError {
  constructor(message: string, cause?: Error) {
    super(`Error al generar PDF: ${message}`, cause);
    this.name = 'PdfGenerationError';
  }
}

export class ReportDataNotFoundError extends ReportError {
  constructor(screeningId: string) {
    super(`No hay datos de reporte para la solicitud: ${screeningId}`);
    this.name = 'ReportDataNotFoundError';
  }
}

export class ReportSchemaNotFoundError extends ReportError {
  constructor(serviceId: number) {
    super(`El servicio ${serviceId} no tiene esquema de reporte configurado`);
    this.name = 'ReportSchemaNotFoundError';
  }
}

export class InvalidReportDataError extends ReportError {
  constructor(message: string) {
    super(`Datos de reporte inválidos: ${message}`);
    this.name = 'InvalidReportDataError';
  }
}
