/**
 * IAdvisorRepository Interface
 *
 * Contract for advisor data access.
 */

import { Advisor } from '../../entities/Advisor';

export interface AdvisorStats {
  advisor: Advisor;
  totalScreenings: number;
  completedScreenings: number;
  pendingScreenings: number;
  totalRevenue: number;
  lastActivityDate: Date | null;
}

export interface AdvisorScreeningSummary {
  id: string;
  serviceId: number;
  serviceName: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  clientName: string | null;
  clientEmail: string | null;
  paymentAmount: number | null;
  createdAt: Date;
  completedAt: Date | null;
  reportUrl: string | null;
}

export interface AdvisorWithScreenings extends AdvisorStats {
  screenings: AdvisorScreeningSummary[];
}

export interface IAdvisorRepository {
  /**
   * Find an advisor by their unique ID
   */
  findById(id: number): Promise<Advisor | null>;

  /**
   * Find an advisor by email
   */
  findByEmail(email: string): Promise<Advisor | null>;

  /**
   * Find an advisor by phone number
   */
  findByPhoneNumber(phoneNumber: string): Promise<Advisor | null>;

  /**
   * Find or create an advisor by phone number and name
   * Used when advisor ID is not provided but name/phone are
   */
  findOrCreateByPhoneAndName(phoneNumber: string, name: string, email?: string): Promise<Advisor>;

  /**
   * Find an advisor by phone number and name
   * Used when advisor ID is not provided but name/phone are
   */
  findByPhoneAndName(phoneNumber: string, name: string): Promise<Advisor | null>;

  /**
   * Find all active advisors
   */
  findAllActive(limit?: number, offset?: number): Promise<Advisor[]>;

  /**
   * Find all advisors (active and inactive)
   */
  findAll(limit?: number, offset?: number): Promise<Advisor[]>;

  /**
   * Save an advisor (create or update)
   */
  save(advisor: Advisor): Promise<Advisor>;

  /**
   * Delete an advisor by ID
   */
  delete(id: number): Promise<void>;

  /**
   * Find an advisor with their screenings and statistics
   */
  findAdvisorWithScreeningsById(id: number): Promise<AdvisorWithScreenings | null>;

  /**
   * Get top advisors by screening count
   */
  getTopAdvisorsByScreenings(limit: number): Promise<AdvisorStats[]>;
}
