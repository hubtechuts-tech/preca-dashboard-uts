/**
 * UpdateAdvisorUseCase
 *
 * Updates an advisor's contact information
 */

import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { Advisor } from '../../../domain/entities/Advisor';
import { UpdateAdvisorDTO } from '../../dto/advisor/AdvisorDTO';

export class UpdateAdvisorUseCase {
  constructor(private advisorRepository: IAdvisorRepository) {}

  async execute(id: number, dto: UpdateAdvisorDTO): Promise<Advisor> {
    // Find advisor
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new Error(`Advisor with ID ${id} not found`);
    }

    // Check if new email already exists (if email is being updated)
    if (dto.email && dto.email !== advisor.email) {
      const existingAdvisor = await this.advisorRepository.findByEmail(dto.email);
      if (existingAdvisor) {
        throw new Error(`Advisor with email ${dto.email} already exists`);
      }
    }

    // Check if new phone number already exists (if phone is being updated)
    if (dto.phoneNumber && dto.phoneNumber !== advisor.phoneNumber) {
      const existingAdvisor = await this.advisorRepository.findByPhoneNumber(dto.phoneNumber);
      if (existingAdvisor) {
        throw new Error(`Advisor with phone number ${dto.phoneNumber} already exists`);
      }
    }

    // Update advisor
    advisor.updateContactInfo(dto.email, dto.phoneNumber);

    // Save to database
    const updatedAdvisor = await this.advisorRepository.save(advisor);

    return updatedAdvisor;
  }
}
