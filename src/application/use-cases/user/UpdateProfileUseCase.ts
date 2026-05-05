/**
 * Application Layer - Update Profile Use Case
 * Updates user profile information
 */

import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UserNotFoundError } from '../../../domain/errors/UserErrors';
import { UpdateProfileDTO } from '../../dto/user/UserDTO';

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateProfileDTO): Promise<User> {
    // 1. Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Update the profile fields
    if (dto.email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email is already in use by another user');
      }
      user.updateEmail(dto.email);
    }

    if (dto.fullName !== undefined) {
      user.updateFullName(dto.fullName);
    }

    // 3. Save the updated user
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }
}
