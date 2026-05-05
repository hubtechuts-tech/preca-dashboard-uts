/**
 * IScreeningRepository Interface
 *
 * Contract for screening data access.
 */

import { Screening, ScreeningStatus } from '../../entities/Screening';

export interface IScreeningRepository {
  /**
   * Find a screening by its unique ID
   */
  findById(id: string): Promise<Screening | null>;

  /**
   * Find a screening by client reference ID (for payment reconciliation)
   */
  findByClientReferenceId(clientReferenceId: string): Promise<Screening | null>;

  /**
   * Find a screening by Stripe session ID
   */
  findByStripeSessionId(stripeSessionId: string): Promise<Screening | null>;

  /**
   * Find all screenings for a specific user
   */
  findByUserId(userId: string): Promise<Screening[]>;

  /**
   * Find screenings by status
   */
  findByStatus(status: ScreeningStatus, limit?: number, offset?: number): Promise<Screening[]>;

  /**
   * Find screenings ready for admin processing (paid + verified)
   */
  findReadyForProcessing(limit?: number, offset?: number): Promise<Screening[]>;

  /**
   * Find screenings assigned to a specific admin
   */
  findByAdminUserId(adminUserId: string): Promise<Screening[]>;

  /**
   * Find screenings by applicant email
   */
  findByApplicantEmail(email: string): Promise<Screening[]>;

  /**
   * Find screenings by applicant phone number (limited to last N results)
   */
  findByApplicantPhone(phone: string, limit?: number): Promise<Screening[]>;

  /**
   * Save a screening (create or update)
   */
  save(screening: Screening): Promise<void>;

  /**
   * Delete a screening by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count screenings by status
   */
  countByStatus(status: ScreeningStatus): Promise<number>;

  /**
   * Find a screening by Wee Trust document ID
   */
  findByWeeTrustDocumentId(documentId: string): Promise<Screening | null>;

  /**
   * Find a screening by identity verification ID (for webhook processing)
   */
  findByIdentityVerificationId(validationId: string): Promise<Screening | null>;

  /**
   * Find all screenings (with optional pagination)
   */
  findAll(limit?: number, offset?: number): Promise<Screening[]>;
}
