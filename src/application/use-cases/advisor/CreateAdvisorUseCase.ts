/**
 * CreateAdvisorUseCase
 *
 * Creates a new advisor in the system
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';
import { CreateAdvisorDTO } from '../../dto/advisor/AdvisorDTO';

export class CreateAdvisorUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(dto: CreateAdvisorDTO): Promise<Advisor> {
    // Check if advisor with email already exists
    const existingAdvisorByEmail = await this.advisorRepository.findByEmail(dto.email);
    if (existingAdvisorByEmail) {
      throw new Error(`Advisor with email ${dto.email} already exists`);
    }

    // Check if advisor with phone number already exists
    const existingAdvisorByPhone = await this.advisorRepository.findByPhoneNumber(dto.phoneNumber);
    if (existingAdvisorByPhone) {
      throw new Error(`Advisor with phone number ${dto.phoneNumber} already exists`);
    }

    // Create advisor entity
    const advisor = Advisor.create(dto.name, dto.email, dto.phoneNumber);

    // Save to database
    const savedAdvisor = await this.advisorRepository.save(advisor);

    return savedAdvisor;
  }
}
