/**
 * GetScreeningsByPhoneUseCase
 *
 * Retrieves screenings by applicant phone number.
 * Business logic: Returns last 3 screenings for the given phone number.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { Screening } from '../../../domain/entities/Screening';

export class GetScreeningsByPhoneUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(phone: string): Promise<Screening[]> {
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      throw new Error('Phone number is required');
    }

    // Get last 3 screenings for this phone number
    return await this.screeningRepository.findByApplicantPhone(phone.trim(), 3);
  }
}
