/**
 * Domain Layer - PDF Filler Service Interface
 *
 * Contract for filling PDF templates with user data
 * Used for authorization documents (Carta de Autorización)
 *
 * Supports both:
 * - Persona Física con Actividad Empresarial (PFAE)
 * - Persona Moral (PM)
 */

export type PersonType = 'PFAE' | 'PM';

export interface PDFFieldData {
  // 1. Tipo de persona
  personType: PersonType;  // PFAE or PM

  // 2. Nombre del solicitante
  // - PFAE: Nombre completo de la persona
  // - PM: Razón social de la empresa
  applicantName: string;

  // 3. Representante Legal (solo para PM)
  legalRepresentative?: string | null;

  // 4. RFC
  rfc: string;

  // 5-9. Domicilio completo
  street: string;              // Calle y número
  colony: string;              // Colonia
  municipality: string;        // Municipio
  state: string;               // Estado
  zipCode: string;             // Código postal

  // 10. Teléfono(s)
  phone: string;

  // 11. Fecha
  date: string;  // Format: DD/MM/YYYY
}

export interface IPDFFillerService {
  /**
   * Fill authorization document PDF template with user data
   * Supports both PFAE and PM person types
   *
   * @param templateBuffer - Original PDF template as Buffer
   * @param data - User data to fill into PDF
   * @returns Filled PDF as Buffer
   */
  fillAuthorizationDocument(
    templateBuffer: Buffer,
    data: PDFFieldData
  ): Promise<Buffer>;

  /**
   * Validate that PDF can be processed
   * @param pdfBuffer - PDF file buffer
   * @returns True if valid PDF
   */
  validatePDF(pdfBuffer: Buffer): Promise<boolean>;
}
