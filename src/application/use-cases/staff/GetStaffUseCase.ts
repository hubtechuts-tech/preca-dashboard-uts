/**
 * GetStaffUseCase
 *
 * Business logic for retrieving a single staff member
 * Only admins can view staff details
 */

import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { StaffUserNotFoundError } from '../../../domain/errors/PermissionErrors';

export class GetStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(staffId: string): Promise<User> {
    const staff = await this.userRepository.findById(staffId);

    if (!staff) {
      throw new StaffUserNotFoundError(staffId);
    }

    if (!staff.isStaff()) {
      throw new Error('User is not a staff member');
    }

    return staff;
  }
}
