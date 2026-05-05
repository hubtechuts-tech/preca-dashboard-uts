/**
 * Application Layer - Update Password Use Case
 * Updates user password after verifying current password
 */

import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { IPasswordHasher } from '../../../domain/interfaces/services/IPasswordHasher';
import { User } from '../../../domain/entities/User';
import { UserNotFoundError, InvalidPasswordError } from '../../../domain/errors/UserErrors';
import { UpdatePasswordDTO } from '../../dto/user/UserDTO';

export class UpdatePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(userId: string, dto: UpdatePasswordDTO): Promise<void> {
    // 1. Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Verify current password
    if (!user.passwordHash) {
      throw new InvalidPasswordError('User has no password set');
    }

    const isCurrentPasswordValid = await this.passwordHasher.compare(
      dto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidPasswordError('Current password is incorrect');
    }

    // 3. Hash the new password
    const newPasswordHash = await this.passwordHasher.hash(dto.newPassword);

    // 4. Update the password
    user.updatePassword(newPasswordHash);

    // 5. Save the updated user
    await this.userRepository.save(user);
  }
}
