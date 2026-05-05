/**
 * Application Layer - Get Advisor Details Use Case
 * Retrieves a specific advisor with their full screening list and statistics
 */

import {
  IAdvisorRepository,
  AdvisorWithScreenings
} from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { AdvisorNotFoundError } from '../../../domain/errors/AdvisorErrors';

export class GetAdvisorDetailsUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(advisorId: number): Promise<AdvisorWithScreenings> {
    const advisorDetails = await this.advisorRepository.findAdvisorWithScreeningsById(advisorId);

    if (!advisorDetails) {
      throw new AdvisorNotFoundError(advisorId);
    }

    return advisorDetails;
  }
}
