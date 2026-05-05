/**
 * Application Layer - Delete Screening Use Case
 * Allows admins to delete screening records
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';

export class DeleteScreeningUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(screeningId: string): Promise<void> {
    // 1. Check if screening exists
    const screening = await this.screeningRepository.findById(screeningId);

    if (!screening) {
      throw new Error(`Screening with id ${screeningId} not found`);
    }

    // 2. Delete the screening
    await this.screeningRepository.delete(screeningId);
  }
}
