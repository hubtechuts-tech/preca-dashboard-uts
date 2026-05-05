/**
 * Application Layer - Get Top Advisors Use Case
 * Retrieves top advisors by screening count for statistics display
 */

import {
  IAdvisorRepository,
  AdvisorStats
} from '../../../domain/interfaces/repositories/IAdvisorRepository';

export class GetTopAdvisorsUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(limit: number = 5): Promise<AdvisorStats[]> {
    return await this.advisorRepository.getTopAdvisorsByScreenings(limit);
  }
}
