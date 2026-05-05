/**
 * Application Layer - Remove Additional Email Use Case
 *
 * Removes an email address from a screening's additional recipients list
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { RemoveAdditionalEmailDTO } from '../../dto/screening/AdditionalEmailDTO';

export interface RemoveAdditionalEmailResult {
  success: boolean;
  screeningId: string;
  email: string;
  message: string;
}

export class RemoveAdditionalEmailUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(screeningId: string, dto: RemoveAdditionalEmailDTO): Promise<RemoveAdditionalEmailResult> {
    console.log(`[RemoveAdditionalEmailUseCase] Removing email from screening ${screeningId}: ${dto.email}`);

    // 1. Find screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // 2. Remove email (entity handles validation)
    try {
      screening.removeAdditionalEmail(dto.email);
    } catch (error: any) {
      // Re-throw domain errors with better context
      throw new Error(error.message);
    }

    // 3. Save updated screening
    await this.screeningRepository.save(screening);

    console.log(`[RemoveAdditionalEmailUseCase] Email removed successfully`);

    return {
      success: true,
      screeningId: screening.id,
      email: dto.email,
      message: 'Email removed from additional recipients'
    };
  }
}
