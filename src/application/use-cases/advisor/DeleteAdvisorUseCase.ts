/**
 * DeleteAdvisorUseCase
 *
 * Deletes an advisor from the system
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';

export class DeleteAdvisorUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(id: number): Promise<void> {
    // Check if advisor exists
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new Error(`Advisor with ID ${id} not found`);
    }

    // Delete advisor
    await this.advisorRepository.delete(id);
  }
}
