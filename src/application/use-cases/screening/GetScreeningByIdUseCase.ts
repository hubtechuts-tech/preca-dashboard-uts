/**
 * GetScreeningByIdUseCase
 *
 * Retrieves a screening by its ID.
 * Business logic: Returns null if not found.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { Screening } from '../../../domain/entities/Screening';

export class GetScreeningByIdUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(id: string): Promise<Screening | null> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Screening ID is required');
    }

    return await this.screeningRepository.findById(id);
  }
}
