import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { IPasswordHasher } from '../../../domain/interfaces/services/IPasswordHasher';
import { User } from '../../../domain/entities/User';
import {
  InvalidCredentialsError,
  UserInactiveError,
  InvalidLoginMethodError
} from '../../../domain/errors/AuthErrors';

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(email: string, password: string): Promise<User> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Check if user is active
    if (!user.isActive) {
      throw new UserInactiveError();
    }

    // 3. Verify password
    // Note: We only allow humans to login with password
    if (!user.passwordHash) {
      throw new InvalidLoginMethodError();
    }

    const isValid = await this.passwordHasher.compare(password, user.passwordHash);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // 4. Return user (controller will handle session creation)
    return user;
  }
}
