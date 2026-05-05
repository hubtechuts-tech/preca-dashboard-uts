/**
 * ListScreeningsUseCase
 *
 * Lists screenings with optional filtering.
 * Business logic: Applies filters and pagination.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { Screening } from '../../../domain/entities/Screening';
import { FilterScreeningsDTO } from '../../dto/screening/ScreeningDTO';

export interface ListScreeningsResult {
  screenings: Screening[];
  total: number;
  limit: number;
  offset: number;
}

export class ListScreeningsUseCase {
  constructor(private screeningRepository: IScreeningRepository) {}

  async execute(dto: FilterScreeningsDTO): Promise<Screening[]> {
    // Apply filters based on DTO
    if (dto.status) {
      // Filter by status
      return await this.screeningRepository.findByStatus(
        dto.status,
        dto.limit,
        dto.offset
      );
    } else if (dto.userId) {
      // Filter by user
      return await this.screeningRepository.findByUserId(dto.userId);
    } else if (dto.adminUserId) {
      // Filter by admin
      return await this.screeningRepository.findByAdminUserId(dto.adminUserId);
    } else {
      // No filters - return all with pagination
      return await this.screeningRepository.findAll(dto.limit, dto.offset);
    }
  }
}
