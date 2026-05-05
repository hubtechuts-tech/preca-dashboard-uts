/**
 * ToggleAdvisorStatusUseCase
 *
 * Activates or deactivates an advisor
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';

export class ToggleAdvisorStatusUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(id: number, isActive: boolean): Promise<Advisor> {
    // Find advisor
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new Error(`Advisor with ID ${id} not found`);
    }

    // Update status
    if (isActive) {
      advisor.activate();
    } else {
      advisor.deactivate();
    }

    // Save to database
    const updatedAdvisor = await this.advisorRepository.save(advisor);

    return updatedAdvisor;
  }
}
