/**
 * Presentation Layer - Client Controller
 * Orchestrates client operations and handles HTTP concerns
 */

import { ListClientsUseCase } from '@/application/use-cases/client/ListClientsUseCase';
import { GetClientByIdUseCase } from '@/application/use-cases/client/GetClientByIdUseCase';
import { GetClientDetailsUseCase } from '@/application/use-cases/client/GetClientDetailsUseCase';
import { SearchClientsUseCase, ClientSearchResult } from '@/application/use-cases/client/SearchClientsUseCase';
import { ClientResponseDTO } from '@/application/dto/client/ClientDTO';
import { ClientDetailsDTOMapper } from '@/application/dto/client/ClientDetailsDTO';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ClientController {
  constructor(
    private listClientsUseCase: ListClientsUseCase,
    private getClientByIdUseCase: GetClientByIdUseCase,
    private getClientDetailsUseCase?: GetClientDetailsUseCase,
    private searchClientsUseCase?: SearchClientsUseCase
  ) {}

  /**
   * List all clients with their stats
   */
  async list(): Promise<ApiResponse> {
    try {
      const clients = await this.listClientsUseCase.execute();

      return {
        success: true,
        data: clients.map(client => ClientResponseDTO.fromDomain(client)),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search clients by query (name, email, phone)
   */
  async search(query: string): Promise<ApiResponse<ClientSearchResult[]>> {
    try {
      if (!this.searchClientsUseCase) {
        return { success: false, error: 'Search not configured', statusCode: 500 };
      }

      const results = await this.searchClientsUseCase.execute(query);

      return {
        success: true,
        data: results,
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific client by ID
   */
  async getById(clientId: string): Promise<ApiResponse> {
    try {
      const client = await this.getClientByIdUseCase.execute(clientId);

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: ClientResponseDTO.fromDomain(client),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get client details with full screening list
   */
  async getDetails(clientId: string): Promise<ApiResponse> {
    try {
      if (!this.getClientDetailsUseCase) {
        return { success: false, error: 'Client details not configured', statusCode: 500 };
      }

      const clientDetails = await this.getClientDetailsUseCase.execute(clientId);

      if (!clientDetails) {
        return {
          success: false,
          error: 'Client not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: ClientDetailsDTOMapper.fromDomain(clientDetails),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('ClientController error:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
