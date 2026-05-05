/**
 * Application Layer - Search Clients Use Case
 * Handles searching for clients by name, email, or phone
 */

import { IUserRepository } from '../../../domain/interfaces/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

export interface ClientSearchResult {
  id: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
}

export class SearchClientsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(query: string): Promise<ClientSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const clients = await this.userRepository.searchClients(query.trim());

    return clients.map((user: User) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    }));
  }
}
