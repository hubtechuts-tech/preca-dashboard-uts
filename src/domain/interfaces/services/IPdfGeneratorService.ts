/**
 * Domain Layer - PDF Generator Service Interface
 *
 * Contract for generating PDFs from templates and data.
 * This interface belongs to the domain layer; implementations
 * live in the infrastructure layer.
 */

export interface PdfGeneratorOptions {
  /** Page format */
  format?: 'A4' | 'Letter';
  /** Landscape orientation */
  landscape?: boolean;
  /** Page margins */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Display header and footer */
  displayHeaderFooter?: boolean;
  /** Custom header HTML template */
  headerTemplate?: string;
  /** Custom footer HTML template */
  footerTemplate?: string;
}

export interface PdfGeneratorResult {
  /** PDF file as a Buffer */
  buffer: Buffer;
  /** Number of pages in the generated PDF */
  pageCount: number;
  /** Timestamp when PDF was generated */
  generatedAt: Date;
}

export interface IPdfGeneratorService {
  /**
   * Generate PDF from a template ID and data
   * @param templateId - The template identifier (e.g., 'preca-basic-pfae')
   * @param data - Data to populate the template
   * @param options - PDF generation options
   * @returns PDF buffer and metadata
   */
  generateReport(
    templateId: string,
    data: Record<string, any>,
    options?: PdfGeneratorOptions
  ): Promise<PdfGeneratorResult>;

  /**
   * Generate PDF from raw HTML string
   * @param html - Complete HTML document
   * @param options - PDF generation options
   * @returns PDF buffer and metadata
   */
  generateFromHtml(
    html: string,
    options?: PdfGeneratorOptions
  ): Promise<PdfGeneratorResult>;

  /**
   * Get list of available template IDs
   * @returns Array of template identifiers
   */
  getAvailableTemplates(): string[];

  /**
   * Check if a template exists
   * @param templateId - Template identifier to check
   * @returns True if template exists
   */
  templateExists(templateId: string): boolean;
}
