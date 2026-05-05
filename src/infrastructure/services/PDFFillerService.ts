/**
 * Infrastructure Layer - PDF Filler Service Implementation
 *
 * Fills authorization document PDF template with user data
 * Supports both:
 * - Persona Física con Actividad Empresarial (PFAE)
 * - Persona Moral (PM)
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { IPDFFillerService, PDFFieldData, PersonType } from '../../domain/interfaces/services/IPDFFillerService';

export class PDFFillerService implements IPDFFillerService {
  /**
   * Fill authorization document with user data
   * Overlays text and checkboxes at specific positions on the PDF
   */
  async fillAuthorizationDocument(
    templateBuffer: Buffer,
    data: PDFFieldData
  ): Promise<Buffer> {
    try {
      console.log('[PDFFillerService] Starting PDF fill process');
      console.log('[PDFFillerService] Person type:', data.personType);
      console.log('[PDFFillerService] Applicant:', data.applicantName);

      // Load the PDF template
      const pdfDoc = await PDFDocument.load(templateBuffer);

      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      console.log(`[PDFFillerService] PDF page size: ${width}x${height}`);

      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Text styling
      const fontSize = 10;
      const smallFontSize = 8;
      const textColor = rgb(0, 0, 0);

      // TODO: Adjust these positions based on actual PDF layout
      // These are placeholder positions that need to be calibrated
      // You can use a PDF viewer to find exact coordinates
      const positions = {
        // 1. Tipo de persona checkboxes
        checkboxPFAE: { x: 261, y: 474 },  // Persona Física
        checkboxPM: { x: 383, y: 475 },    // Persona Moral

        // 2. Nombre del solicitante
        applicantName: { x: 63, y: 435 },

        // 3. Representante Legal (solo PM)
        legalRepresentative: { x: 63, y: 401 },

        // 4. RFC
        rfc: { x: 87, y: 380 },

        // 5. Domicilio
        street: { x: 103, y: 366 },

        // 6. Colonia
        colony: { x: 421, y: 365 },

        // 7. Municipio
        municipality: { x: 104, y: 347 },

        // 8. Estado
        state: { x: 317, y: 347 },

        // 9. Código Postal
        zipCode: { x: 498, y: 347 },

        // 10. Teléfono
        phone: { x: 109, y: 331 },

        // 11. Fecha
        date: { x: 206, y: 313 }
      };

      // 1. Mark tipo de persona checkbox
      this.drawCheckbox(firstPage,
        data.personType === 'PFAE' ? positions.checkboxPFAE : positions.checkboxPM,
        5
      );

      // 2. Nombre del solicitante
      firstPage.drawText(data.applicantName.toUpperCase(), {
        x: positions.applicantName.x,
        y: positions.applicantName.y,
        size: fontSize,
        font: boldFont,
        color: textColor
      });

      // 3. Representante Legal (solo si es PM)
      if (data.personType === 'PM' && data.legalRepresentative) {
        firstPage.drawText(data.legalRepresentative.toUpperCase(), {
          x: positions.legalRepresentative.x,
          y: positions.legalRepresentative.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 4. RFC (with graceful fallback)
      if (data.rfc) {
        firstPage.drawText(data.rfc.toUpperCase(), {
          x: positions.rfc.x,
          y: positions.rfc.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      } else {
        console.warn('[PDFFillerService] RFC not provided, leaving blank');
      }

      // 5. Domicilio - Calle y número (with graceful fallback)
      if (data.street) {
        firstPage.drawText(data.street, {
          x: positions.street.x,
          y: positions.street.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 6. Colonia (with graceful fallback)
      if (data.colony) {
        firstPage.drawText(data.colony, {
          x: positions.colony.x,
          y: positions.colony.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 7. Municipio (with graceful fallback)
      if (data.municipality) {
        firstPage.drawText(data.municipality, {
          x: positions.municipality.x,
          y: positions.municipality.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 8. Estado (with graceful fallback)
      if (data.state) {
        firstPage.drawText(data.state, {
          x: positions.state.x,
          y: positions.state.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 9. Código Postal (with graceful fallback)
      if (data.zipCode) {
        firstPage.drawText(data.zipCode, {
          x: positions.zipCode.x,
          y: positions.zipCode.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 10. Teléfono(s) (with graceful fallback)
      if (data.phone) {
        firstPage.drawText(data.phone, {
          x: positions.phone.x,
          y: positions.phone.y,
          size: fontSize,
          font: font,
          color: textColor
        });
      }

      // 11. Fecha
      firstPage.drawText(data.date, {
        x: positions.date.x,
        y: positions.date.y,
        size: fontSize,
        font: font,
        color: textColor
      });

      console.log('[PDFFillerService] PDF filled successfully');

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);

    } catch (error) {
      console.error('[PDFFillerService] Error filling PDF:', error);
      throw new Error(`Failed to fill PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Draw a checkbox "X" at the specified position
   */
  private drawCheckbox(page: PDFPage, position: { x: number; y: number }, size: number): void {
    const checkboxSize = size;
    const x = position.x;
    const y = position.y;

    // Draw "X" mark
    page.drawText('X', {
      x,
      y,
      size: checkboxSize * 2,
      font: page.doc.embedStandardFont(StandardFonts.HelveticaBold),
      color: rgb(0, 0, 0)
    });
  }

  /**
   * Validate that a buffer is a valid PDF
   */
  async validatePDF(pdfBuffer: Buffer): Promise<boolean> {
    try {
      await PDFDocument.load(pdfBuffer);
      return true;
    } catch (error) {
      console.error('[PDFFillerService] Invalid PDF:', error);
      return false;
    }
  }
}
