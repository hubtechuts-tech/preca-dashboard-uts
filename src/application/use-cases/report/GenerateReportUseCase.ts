/**
 * Application Layer - Generate Report Use Case
 *
 * Generates a PDF report from saved report data using the
 * appropriate template and stores it in file storage.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { IPdfGeneratorService } from '../../../domain/interfaces/services/IPdfGeneratorService';
import { IFileStorageService } from '../../../domain/interfaces/services/IFileStorageService';
import {
  ReportDataNotFoundError,
  PdfGenerationError
} from '../../../domain/errors/ReportErrors';
import { GenerateReportDTO, GenerateReportResponse } from '../../dto/report/ReportDTO';
import { FolioGeneratorService } from '../../../infrastructure/services/FolioGeneratorService';
import * as fs from 'fs';
import * as path from 'path';

export class GenerateReportUseCase {
  private folioGenerator: FolioGeneratorService;

  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceCatalogRepository,
    private pdfGeneratorService: IPdfGeneratorService,
    private fileStorageService: IFileStorageService,
    folioGenerator?: FolioGeneratorService
  ) {
    this.folioGenerator = folioGenerator || new FolioGeneratorService();
  }

  async execute(dto: GenerateReportDTO, adminUserId: string): Promise<GenerateReportResponse> {
    const { screeningId, templateId: templateOverride } = dto;

    // 1. Get screening with report data
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} no encontrado`);
    }

    // 2. Verify report data exists
    if (!screening.hasReportData()) {
      throw new ReportDataNotFoundError(screeningId);
    }

    // 3. Get service for template info
    const service = await this.serviceRepository.findById(screening.serviceId);
    if (!service) {
      throw new Error(`Servicio ${screening.serviceId} no encontrado`);
    }

    // 4. Determine template ID
    const templateId = templateOverride
      || service.reportSchema?.templateId
      || this.getDefaultTemplate(service.code, screening.applicantPersonType);

    // 5. Generate or get folio number
    const folio = await this.folioGenerator.getOrGenerateFolio(screeningId);

    // IMPORTANT: Update the screening instance with the folio to prevent
    // overwriting it with null/old value when saving the screening later
    screening.assignFolio(folio);

    // 6. Prepare template data
    const templateData = this.buildTemplateData(screening, service, folio);

    // 7. Generate PDF
    let pdfResult;
    try {
      pdfResult = await this.pdfGeneratorService.generateReport(
        templateId,
        templateData,
        {
          format: 'A4',
          displayHeaderFooter: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '25mm',
            left: '15mm'
          }
        }
      );
    } catch (error) {
      throw new PdfGenerationError(
        error instanceof Error ? error.message : 'Error desconocido',
        error as Error
      );
    }

    // 8. Generate filename
    const sanitizedName = screening.applicantName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const fileName = `reporte_${sanitizedName}_${Date.now()}.pdf`;

    // 9. Upload to storage
    const uploadResult = await this.fileStorageService.uploadFile(
      pdfResult.buffer,
      fileName,
      {
        contentType: 'application/pdf',
        isPublic: false,
        metadata: {
          screeningId,
          adminUserId,
          templateId,
          generatedAt: pdfResult.generatedAt.toISOString(),
          pageCount: pdfResult.pageCount.toString()
        }
      }
    );

    // 10. Update screening with report URL and file key
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortReportUrl = `${baseUrl}/api/files/${uploadResult.fileKey}`;

    screening.addReportUrl(shortReportUrl);
    screening.addReportFileKey(uploadResult.fileKey);
    await this.screeningRepository.save(screening);

    return {
      success: true,
      reportUrl: shortReportUrl,
      fileKey: uploadResult.fileKey,
      pageCount: pdfResult.pageCount,
      message: 'Reporte generado correctamente'
    };
  }

  /**
   * Build template data from screening and service
   */
  private buildTemplateData(screening: any, service: any, folio: string): Record<string, any> {
    const reportData = screening.reportData || {};

    // Safely get RFC value
    let rfcValue = reportData.rfc || null;
    if (screening.applicantRFC) {
      rfcValue = typeof screening.applicantRFC.getValue === 'function'
        ? screening.applicantRFC.getValue()
        : screening.applicantRFC;
    }

    // Safely get address string
    let addressValue = reportData.address || null;
    if (screening.applicantAddress) {
      if (typeof screening.applicantAddress.toFullString === 'function') {
        addressValue = screening.applicantAddress.toFullString();
      } else if (typeof screening.applicantAddress === 'object') {
        // Build address from plain object
        const addr = screening.applicantAddress;
        const parts = [addr.street, addr.colony, addr.municipality, addr.state, addr.zipCode].filter(Boolean);
        addressValue = parts.join(', ') || null;
      }
    }

    // Safely get person type display
    let personTypeDisplay = null;
    if (typeof screening.getPersonTypeDisplay === 'function') {
      personTypeDisplay = screening.getPersonTypeDisplay();
    } else if (screening.applicantPersonType) {
      personTypeDisplay = screening.applicantPersonType === 'moral' ? 'PM' : 'PFAE';
    }

    // Load logo as base64 for embedding in PDF
    const logoBase64 = this.loadLogoAsBase64();

    return {
      // Screening info
      screeningId: screening.id,
      folio,

      // Applicant info
      applicantName: screening.applicantName,
      applicantEmail: screening.applicantEmail,
      applicantPhone: screening.applicantPhone,
      rfc: rfcValue,
      curp: reportData.curp,
      address: addressValue,
      personType: personTypeDisplay,
      legalRepresentative: screening.applicantLegalRepresentative,

      // Service info
      serviceName: service.name,
      serviceCode: service.code,

      // Report data from admin form (spread all fields)
      ...reportData,

      // Metadata
      generatedAt: new Date(),
      currentYear: new Date().getFullYear(),
      logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || null,
      logoBase64
    };
  }

  /**
   * Load the company logo as base64 for embedding in PDF templates
   */
  private loadLogoAsBase64(): string | null {
    try {
      // Try multiple possible logo locations
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'logopreca.png'),
        path.join(process.cwd(), 'public', 'logo.png'),
        path.join(process.cwd(), 'public', 'images', 'logo.png'),
      ];

      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          return logoBuffer.toString('base64');
        }
      }

      console.warn('Logo file not found in expected locations');
      return null;
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  }

  /**
   * Get default template based on service code and person type
   */
  private getDefaultTemplate(serviceCode: string, personType: string | null): string {
    const type = personType === 'moral' ? 'pm' : 'pfae';

    // Map service codes to templates
    const templateMap: Record<string, string> = {
      'PRECA_BASIC': `preca-basic-${type}`,
      'PRECA_PRO': `preca-pro-${type}`,
      'PRECA_PREMIUM': `preca-premium-${type}`,
      'PRECA_BUSINESS': `preca-basic-pm`,
    };

    return templateMap[serviceCode] || `preca-basic-${type}`;
  }
}
