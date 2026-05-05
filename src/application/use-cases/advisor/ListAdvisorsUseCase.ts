/**
 * ListAdvisorsUseCase
 *
 * Lists all advisors with optional filters
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';

export interface ListAdvisorsFilters {
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class ListAdvisorsUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(filters?: ListAdvisorsFilters): Promise<Advisor[]> {
    const { activeOnly = false, limit, offset } = filters || {};

    if (activeOnly) {
      return await this.advisorRepository.findAllActive(limit, offset);
    }

    return await this.advisorRepository.findAll(limit, offset);
  }
}
