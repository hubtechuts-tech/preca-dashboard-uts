/**
 * Application Layer - Get Client By ID Use Case
 * Retrieves a specific client with their screening statistics
 */

import { IUserRepository, ClientWithStats } from '../../../domain/interfaces/repositories/IUserRepository';

export class GetClientByIdUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(clientId: string): Promise<ClientWithStats | null> {
    return await this.userRepository.findClientWithStatsById(clientId);
  }
}
