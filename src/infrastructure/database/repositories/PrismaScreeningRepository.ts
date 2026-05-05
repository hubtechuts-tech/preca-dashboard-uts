/**
 * PrismaScreeningRepository
 *
 * Infrastructure layer implementation of IScreeningRepository.
 * Maps between Prisma models and domain entities.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { Screening, ScreeningStatus } from '../../../domain/entities/Screening';
import { RFC } from '../../../domain/value-objects/RFC';
import { Address } from '../../../domain/value-objects/Address';
import { PersonType } from '../../../domain/entities/ServiceCatalog';

export class PrismaScreeningRepository implements IScreeningRepository {
  constructor(private prisma: PrismaClient) { }

  async findById(id: string): Promise<Screening | null> {
    if (!id || id === 'undefined' || id.length < 10) {
      console.warn(`PrismaScreeningRepository.findById called with invalid ID: ${id}`);
      return null;
    }

    const record = await this.prisma.screenings.findUnique({
      where: { id },
      include: {
        advisors: true  // Include advisor relation
      }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByClientReferenceId(clientReferenceId: string): Promise<Screening | null> {
    const record = await this.prisma.screenings.findFirst({
      where: { client_reference_id: clientReferenceId }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByStripeSessionId(stripeSessionId: string): Promise<Screening | null> {
    const record = await this.prisma.screenings.findFirst({
      where: { stripe_session_id: stripeSessionId }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByWeeTrustDocumentId(documentId: string): Promise<Screening | null> {
    const record = await this.prisma.screenings.findFirst({
      where: { wee_trust_document_id: documentId }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByIdentityVerificationId(validationId: string): Promise<Screening | null> {
    const record = await this.prisma.screenings.findFirst({
      where: { identity_verification_id: validationId }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async findByStatus(
    status: ScreeningStatus,
    limit?: number,
    offset?: number
  ): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: { status: status as any },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    return records.map(record => this.toDomain(record));
  }

  async findReadyForProcessing(limit?: number, offset?: number): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: {
        status: 'paid',
        is_identity_verified: true,
        authorization_signed_at: {
          not: null
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    return records.map(record => this.toDomain(record));
  }

  async findByAdminUserId(adminUserId: string): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: { admin_user_id: adminUserId },
      orderBy: { updated_at: 'desc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async findByApplicantEmail(email: string): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: { applicant_email: email.toLowerCase() },
      orderBy: { created_at: 'desc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async findByApplicantPhone(phone: string, limit?: number): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      where: { applicant_phone: phone },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return records.map(record => this.toDomain(record));
  }

  async save(screening: Screening): Promise<void> {
    const data = this.toPrisma(screening);

    await this.prisma.screenings.upsert({
      where: { id: screening.id },
      update: data,
      create: data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.screenings.delete({
      where: { id }
    });
  }

  async countByStatus(status: ScreeningStatus): Promise<number> {
    return await this.prisma.screenings.count({
      where: { status: status as any }
    });
  }

  async findAll(limit?: number, offset?: number): Promise<Screening[]> {
    const records = await this.prisma.screenings.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    return records.map(record => this.toDomain(record));
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(record: any): Screening {
    // Parse RFC if present
    let rfc: RFC | null = null;
    if (record.applicant_rfc && record.applicant_person_type) {
      try {
        rfc = RFC.create(
          record.applicant_rfc,
          record.applicant_person_type as PersonType
        );
      } catch (error) {
        console.warn(`Invalid RFC in database for screening ${record.id}:`, error);
        // Continue without RFC for backward compatibility
      }
    }

    // Parse Address if present
    let address: Address | null = null;
    if (record.applicant_street && record.applicant_colony &&
      record.applicant_municipality && record.applicant_state &&
      record.applicant_zip_code) {
      try {
        address = Address.create({
          street: record.applicant_street,
          colony: record.applicant_colony,
          municipality: record.applicant_municipality,
          state: record.applicant_state,
          zipCode: record.applicant_zip_code
        });
      } catch (error) {
        console.warn(`Invalid address in database for screening ${record.id}:`, error);
        // Continue without address for backward compatibility
      }
    }

    return Screening.reconstitute({
      id: record.id,
      userId: record.user_id,
      serviceId: record.service_id,
      advisorId: record.advisor_id,
      status: this.mapStatusToDomain(record.status),
      applicantName: record.applicant_name,
      applicantEmail: record.applicant_email,
      applicantPhone: record.applicant_phone,
      applicantPersonType: record.applicant_person_type as PersonType | null,
      applicantLegalRepresentative: record.applicant_legal_representative,
      applicantRFC: rfc,
      applicantAddress: address,
      formData: typeof record.form_data === 'string'
        ? JSON.parse(record.form_data)
        : record.form_data || {},
      reportData: record.report_data
        ? (typeof record.report_data === 'string'
          ? JSON.parse(record.report_data)
          : record.report_data)
        : null,
      stripeSessionId: record.stripe_session_id,
      clientReferenceId: record.client_reference_id,
      paymentLinkUrl: record.payment_link_url,
      paymentAmount: record.payment_amount ? Number(record.payment_amount) : null,
      paymentCompletedAt: record.payment_completed_at,
      isIdentityVerified: record.is_identity_verified,
      verificationCompletedAt: record.verification_completed_at,
      weeTrustDocumentId: record.wee_trust_document_id,
      authorizationDocumentUrl: record.authorization_document_url,
      authorizationSignedAt: record.authorization_signed_at,
      identityVerificationId: record.identity_verification_id,
      identityVerificationUrl: record.identity_verification_url,
      identityVerifiedAt: record.identity_verified_at,
      identityVerificationData: record.identity_verification_data as Record<string, any> | null,
      adminUserId: record.admin_user_id,
      adminNotes: record.admin_notes,
      reportUrl: record.report_url,
      reportUrls: record.report_urls || [],
      reportFileKeys: record.report_file_keys || [],
      authorizationDocumentFileKey: record.authorization_document_file_key,
      identityVerificationFileKey: record.identity_verification_file_key,
      additionalEmails: record.additional_emails || [],
      manualPaymentMarkedBy: record.manual_payment_marked_by,
      manualPaymentMarkedAt: record.manual_payment_marked_at,
      manualPaymentReason: record.manual_payment_reason,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      completedAt: record.completed_at
    });
  }

  /**
   * Maps domain entity to Prisma model
   */
  private toPrisma(screening: Screening) {
    return {
      id: screening.id,
      user_id: screening.userId,
      service_id: screening.serviceId,
      advisor_id: screening.advisorId,
      status: this.mapStatusToPrisma(screening.status),
      applicant_name: screening.applicantName,
      applicant_email: screening.applicantEmail,
      applicant_phone: screening.applicantPhone,
      applicant_person_type: screening.applicantPersonType || null,
      applicant_legal_representative: screening.applicantLegalRepresentative,
      applicant_rfc: screening.applicantRFC?.getValue() || null,
      applicant_street: screening.applicantAddress?.street || null,
      applicant_colony: screening.applicantAddress?.colony || null,
      applicant_municipality: screening.applicantAddress?.municipality || null,
      applicant_state: screening.applicantAddress?.state || null,
      applicant_zip_code: screening.applicantAddress?.zipCode || null,
      form_data: screening.formData,
      report_data: screening.reportData ?? Prisma.JsonNull,
      stripe_session_id: screening.stripeSessionId,
      client_reference_id: screening.clientReferenceId,
      payment_link_url: screening.paymentLinkUrl,
      payment_amount: screening.paymentAmount,
      payment_completed_at: screening.paymentCompletedAt,
      is_identity_verified: screening.isIdentityVerified,
      verification_completed_at: screening.verificationCompletedAt,
      wee_trust_document_id: screening.weeTrustDocumentId,
      authorization_document_url: screening.authorizationDocumentUrl,
      authorization_signed_at: screening.authorizationSignedAt,
      identity_verification_id: screening.identityVerificationId,
      identity_verification_url: screening.identityVerificationUrl,
      identity_verified_at: screening.identityVerifiedAt,
      identity_verification_data: screening.identityVerificationData as any,
      admin_user_id: screening.adminUserId,
      admin_notes: screening.adminNotes,
      report_url: screening.reportUrl,
      report_urls: screening.reportUrls,
      report_file_keys: screening.reportFileKeys,
      authorization_document_file_key: screening.authorizationDocumentFileKey,
      identity_verification_file_key: screening.identityVerificationFileKey,
      additional_emails: screening.additionalEmails,
      manual_payment_marked_by: screening.manualPaymentMarkedBy,
      manual_payment_marked_at: screening.manualPaymentMarkedAt,
      manual_payment_reason: screening.manualPaymentReason,
      created_at: screening.createdAt,
      updated_at: screening.updatedAt,
      completed_at: screening.completedAt
    };
  }

  /**
   * Maps database status enum to domain enum
   */
  private mapStatusToDomain(status: string): ScreeningStatus {
    const statusMap: Record<string, ScreeningStatus> = {
      'pending_payment': ScreeningStatus.PENDING_PAYMENT,
      'paid': ScreeningStatus.PAID,
      'processing_bureau': ScreeningStatus.PROCESSING_BUREAU,
      'completed': ScreeningStatus.COMPLETED,
      'rejected': ScreeningStatus.REJECTED
    };

    return statusMap[status] || ScreeningStatus.PENDING_PAYMENT;
  }

  /**
   * Maps domain status enum to database enum
   */
  private mapStatusToPrisma(status: ScreeningStatus): any {
    return status; // They match, but keeping method for consistency
  }
}
