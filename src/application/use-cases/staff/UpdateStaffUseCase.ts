/**
 * UpdateStaffUseCase
 *
 * Business logic for updating staff member details
 * Only admins can update staff
 */

import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { UpdateStaffDTO } from '../../dto/staff/StaffDTO';
import { StaffUserNotFoundError, CannotModifyAdminPermissionsError } from '../../../domain/errors/PermissionErrors';

export class UpdateStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(staffId: string, dto: UpdateStaffDTO): Promise<User> {
    // Find staff user
    const staff = await this.userRepository.findById(staffId);
    if (!staff) {
      throw new StaffUserNotFoundError(staffId);
    }

    // Prevent modifying admin users
    if (staff.isAdmin()) {
      throw new CannotModifyAdminPermissionsError();
    }

    // Prevent modifying non-staff users
    if (!staff.isStaff()) {
      throw new Error('Can only update staff users');
    }

    // Apply updates
    if (dto.fullName !== undefined) {
      staff.updateFullName(dto.fullName);
    }

    if (dto.phoneNumber !== undefined) {
      staff.updatePhoneNumber(dto.phoneNumber);
    }

    if (dto.permissions !== undefined) {
      staff.updatePermissions(dto.permissions);
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        staff.activate();
      } else {
        staff.deactivate();
      }
    }

    // Save changes
    const updated = await this.userRepository.save(staff);

    return updated;
  }
}
