/**
 * CreateStaffUseCase
 *
 * Business logic for creating a new staff member
 * Only admins can create staff
 */

import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { CreateStaffDTO } from '../../dto/staff/StaffDTO';
import { EmailAlreadyExistsError } from '../../../domain/errors/PermissionErrors';
import * as bcrypt from 'bcryptjs';

export class CreateStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: CreateStaffDTO): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(dto.email);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create staff user
    const staff = User.create(
      dto.email,
      UserRole.STAFF,
      passwordHash,
      dto.fullName,
      dto.phoneNumber,
      dto.permissions
    );

    // Save to repository
    const saved = await this.userRepository.save(staff);

    return saved;
  }
}
