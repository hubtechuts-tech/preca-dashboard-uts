/**
 * GetAdvisorByIdUseCase
 *
 * Retrieves an advisor by ID
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';

export class GetAdvisorByIdUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(id: number): Promise<Advisor> {
    const advisor = await this.advisorRepository.findById(id);

    if (!advisor) {
      throw new Error(`Advisor with ID ${id} not found`);
    }

    return advisor;
  }
}
