/**
 * Application Layer - Add Additional Email Use Case
 *
 * Adds an email address to a screening's additional recipients list
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { AddAdditionalEmailDTO } from '../../dto/screening/AdditionalEmailDTO';

export interface AddAdditionalEmailResult {
  success: boolean;
  screeningId: string;
  email: string;
  message: string;
}

export class AddAdditionalEmailUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(screeningId: string, dto: AddAdditionalEmailDTO): Promise<AddAdditionalEmailResult> {
    console.log(`[AddAdditionalEmailUseCase] Adding email to screening ${screeningId}: ${dto.email}`);

    // 1. Find screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // 2. Business rule: Can only add emails to paid or processing screenings
    if (screening.isPending()) {
      throw new Error('Cannot add additional emails to unpaid screening');
    }

    // 3. Add email (entity handles validation and duplicate checking)
    try {
      screening.addAdditionalEmail(dto.email);
    } catch (error: any) {
      // Re-throw domain errors with better context
      throw new Error(error.message);
    }

    // 4. Save updated screening
    await this.screeningRepository.save(screening);

    console.log(`[AddAdditionalEmailUseCase] Email added successfully`);

    return {
      success: true,
      screeningId: screening.id,
      email: dto.email,
      message: 'Email added to additional recipients'
    };
  }
}
