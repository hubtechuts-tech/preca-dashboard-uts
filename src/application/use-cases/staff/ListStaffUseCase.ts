/**
 * ListStaffUseCase
 *
 * Business logic for listing staff members
 * Only admins can list staff
 */

import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';

export interface ListStaffFilters {
  limit?: number;
  offset?: number;
}

export class ListStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(filters?: ListStaffFilters): Promise<User[]> {
    const staff = await this.userRepository.findAllStaff(
      filters?.limit,
      filters?.offset
    );

    return staff;
  }
}
