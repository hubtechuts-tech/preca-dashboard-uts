/**
 * UpdateScreeningStatusUseCase
 *
 * Updates the status of a screening.
 * Business logic: Uses domain entity methods to ensure valid state transitions.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { Screening, ScreeningStatus } from '../../../domain/entities/Screening';
import { UpdateScreeningStatusDTO } from '../../dto/screening/ScreeningDTO';

export class UpdateScreeningStatusUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(screeningId: string, dto: UpdateScreeningStatusDTO): Promise<Screening> {
    // 1. Validate screening ID
    if (!screeningId || typeof screeningId !== 'string') {
      throw new Error('Screening ID is required');
    }

    // 2. Fetch the screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening with ID ${screeningId} not found`);
    }

    // 3. Update based on the target status using domain methods
    switch (dto.status) {
      case ScreeningStatus.PROCESSING_BUREAU:
        if (!dto.adminUserId) {
          throw new Error('Admin user ID is required to start processing');
        }
        screening.startProcessing(dto.adminUserId);
        break;

      case ScreeningStatus.COMPLETED:
        if (!dto.reportUrl) {
          throw new Error('Report URL is required to complete screening');
        }
        if (!dto.adminUserId) {
          throw new Error('Admin user ID is required to complete screening');
        }
        screening.complete(dto.reportUrl, dto.adminUserId);
        break;

      case ScreeningStatus.REJECTED:
        if (!dto.adminUserId) {
          throw new Error('Admin user ID is required to reject screening');
        }
        const reason = dto.adminNotes || 'No reason provided';
        screening.reject(reason, dto.adminUserId);
        break;

      default:
        throw new Error(`Cannot manually update status to ${dto.status}`);
    }

    // 4. Save the updated screening
    await this.screeningRepository.save(screening);

    // 5. Return the updated screening
    return screening;
  }
}
