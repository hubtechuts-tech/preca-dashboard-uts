/**
 * Application Layer - Update Service Report Schema Use Case
 *
 * Updates the report schema for a service, which defines
 * what fields the admin fills when generating reports.
 */

import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { ReportSchema } from '../../../domain/value-objects/ReportSchema';
import { UpdateServiceReportSchemaDTO } from '../../dto/report/ReportDTO';

export interface UpdateServiceReportSchemaResponse {
  success: boolean;
  serviceId: number;
  serviceName: string;
  hasReportSchema: boolean;
  message: string;
}

export class UpdateServiceReportSchemaUseCase {
  constructor(private serviceRepository: IServiceCatalogRepository) {}

  async execute(dto: UpdateServiceReportSchemaDTO): Promise<UpdateServiceReportSchemaResponse> {
    const { serviceId, reportSchema: schemaData } = dto;

    // 1. Find service
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error(`Servicio ${serviceId} no encontrado`);
    }

    // 2. Parse and validate report schema if provided
    let reportSchema: ReportSchema | null = null;
    if (schemaData) {
      try {
        reportSchema = ReportSchema.fromJSON(schemaData);
      } catch (error) {
        throw new Error(
          `Esquema de reporte inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    // 3. Update service
    service.updateReportSchema(reportSchema);
    await this.serviceRepository.save(service);

    return {
      success: true,
      serviceId: service.id,
      serviceName: service.name,
      hasReportSchema: service.hasReportSchema(),
      message: reportSchema
        ? 'Esquema de reporte actualizado correctamente'
        : 'Esquema de reporte eliminado correctamente'
    };
  }
}
