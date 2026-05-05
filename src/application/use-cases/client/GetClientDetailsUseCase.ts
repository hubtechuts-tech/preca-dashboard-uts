/**
 * Application Layer - Get Client Details Use Case
 * Retrieves a specific client with their full screening list and statistics
 */

import { IUserRepository, ClientWithScreenings } from '../../../domain/interfaces/repositories/IUserRepository';

export class GetClientDetailsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(clientId: string): Promise<ClientWithScreenings | null> {
    return await this.userRepository.findClientWithScreeningsById(clientId);
  }
}
