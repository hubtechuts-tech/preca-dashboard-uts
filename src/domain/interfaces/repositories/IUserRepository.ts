/**
 * IUserRepository Interface
 *
 * Contract for user data access.
 * This is a "port" in Clean Architecture - the domain defines what it needs.
 * The infrastructure layer will implement this interface.
 */

import { User } from '../../entities/User';

export interface ClientWithStats {
  user: User;
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  totalSpent: number;
  lastScreeningDate: Date | null;
}

export interface ScreeningSummary {
  id: string;
  serviceId: number;
  serviceName: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  paymentAmount: number | null;
  createdAt: Date;
  completedAt: Date | null;
  reportUrl: string | null;
}

export interface ClientWithScreenings extends ClientWithStats {
  screenings: ScreeningSummary[];
}

export interface IUserRepository {
  /**
   * Find a user by their unique ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email address
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Save a user (create or update)
   * The repository should handle whether it's an insert or update
   */
  save(user: User): Promise<User>;

  /**
   * Delete a user by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find all users (with optional pagination)
   */
  findAll(limit?: number, offset?: number): Promise<User[]>;

  /**
   * Check if a user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Find all clients (users with role='client') with their screening stats
   */
  findAllClientsWithStats(): Promise<ClientWithStats[]>;

  /**
   * Find a client by ID with their screening stats
   */
  findClientWithStatsById(userId: string): Promise<ClientWithStats | null>;

  /**
   * Find a client by ID with their screening details (includes full screening list)
   */
  findClientWithScreeningsById(userId: string): Promise<ClientWithScreenings | null>;

  /**
   * Search clients by name, email, or phone number
   */
  searchClients(query: string): Promise<User[]>;

  /**
   * Find all staff users (with optional pagination)
   */
  findAllStaff(limit?: number, offset?: number): Promise<User[]>;

  /**
   * Search staff by name or email
   */
  searchStaff(query: string): Promise<User[]>;
}
