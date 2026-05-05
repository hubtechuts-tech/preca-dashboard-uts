/**
 * Application Layer - Save Report Data Use Case
 *
 * Saves/updates report data for a screening, validating against
 * the service's report schema if available.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { ReportSchemaValidationError } from '../../../domain/errors/ReportErrors';
import { SaveReportDataDTO, SaveReportDataResponse } from '../../dto/report/ReportDTO';

export class SaveReportDataUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceCatalogRepository
  ) {}

  async execute(dto: SaveReportDataDTO, adminUserId: string): Promise<SaveReportDataResponse> {
    const { screeningId, reportData } = dto;

    // 1. Get screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} no encontrado`);
    }

    // 2. Verify screening is paid
    if (!screening.isPaid()) {
      throw new Error('No se pueden guardar datos de reporte para un screening sin pago');
    }

    // 3. Verify authorization is signed
    if (!screening.hasSignedAuthorization()) {
      throw new Error('No se pueden guardar datos de reporte sin autorización firmada');
    }

    // 4. Get service to validate against report schema
    const service = await this.serviceRepository.findById(screening.serviceId);
    if (!service) {
      throw new Error(`Servicio ${screening.serviceId} no encontrado`);
    }

    // 5. Validate report data against schema if exists
    if (service.reportSchema) {
      const validation = service.reportSchema.validateReportData(reportData);
      if (!validation.valid) {
        throw new ReportSchemaValidationError(validation.errors);
      }
    }

    // 6. Start processing if not already in processing status
    if (screening.isPaid() && !screening.isProcessing() && !screening.isCompleted()) {
      screening.startProcessing(adminUserId);
    }

    // 7. Save report data
    screening.setReportData(reportData);
    await this.screeningRepository.save(screening);

    return {
      success: true,
      screeningId,
      message: 'Datos del reporte guardados correctamente'
    };
  }
}
