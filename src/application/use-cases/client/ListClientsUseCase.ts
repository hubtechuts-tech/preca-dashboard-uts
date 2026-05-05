/**
 * Application Layer - List Clients Use Case
 * Handles listing all clients with their screening statistics
 */

import { IUserRepository, ClientWithStats } from '../../../domain/interfaces/repositories/IUserRepository';

export class ListClientsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<ClientWithStats[]> {
    return await this.userRepository.findAllClientsWithStats();
  }
}
