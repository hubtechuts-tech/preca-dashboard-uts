/**
 * Application Layer - Delete Report Use Case
 *
 * Deletes a generated PDF report from a screening.
 * Removes both the file from storage and the reference from the screening.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IFileStorageService } from '../../../domain/interfaces/services/IFileStorageService';

export interface DeleteReportDTO {
  screeningId: string;
  fileKey: string;
}

export interface DeleteReportResponse {
  success: boolean;
  message: string;
  remainingReports: number;
}

export class DeleteReportUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private fileStorageService: IFileStorageService
  ) {}

  async execute(dto: DeleteReportDTO, adminUserId: string): Promise<DeleteReportResponse> {
    const { screeningId, fileKey } = dto;

    // 1. Get the screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} no encontrado`);
    }

    // 2. Verify the file key exists in the screening
    if (!screening.reportFileKeys.includes(fileKey)) {
      throw new Error(`Reporte con key ${fileKey} no encontrado en el screening`);
    }

    // 3. Delete the file from storage
    try {
      await this.fileStorageService.deleteFile(fileKey);
    } catch (error) {
      // Log the error but continue - the file may have already been deleted
      console.warn(`[DeleteReportUseCase] Could not delete file ${fileKey}:`, error);
    }

    // 4. Remove the report reference from the screening
    const removed = screening.removeReport(fileKey);
    if (!removed) {
      throw new Error('Error al eliminar el reporte del screening');
    }

    // 5. Save the updated screening
    await this.screeningRepository.save(screening);

    return {
      success: true,
      message: 'Reporte eliminado correctamente',
      remainingReports: screening.getReportCount()
    };
  }
}
