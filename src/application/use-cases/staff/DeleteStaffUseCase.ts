/**
 * DeleteStaffUseCase
 *
 * Business logic for deleting/deactivating staff members
 * Only admins can delete staff
 */

import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { StaffUserNotFoundError, CannotModifyAdminPermissionsError } from '../../../domain/errors/PermissionErrors';

export class DeleteStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(staffId: string): Promise<void> {
    const staff = await this.userRepository.findById(staffId);

    if (!staff) {
      throw new StaffUserNotFoundError(staffId);
    }

    // Prevent deleting admin users
    if (staff.isAdmin()) {
      throw new CannotModifyAdminPermissionsError();
    }

    // Prevent deleting non-staff users
    if (!staff.isStaff()) {
      throw new Error('Can only delete staff users');
    }

    // Delete the staff user
    await this.userRepository.delete(staffId);
  }
}
