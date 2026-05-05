/**
 * Presentation Layer - Screening Controller
 * Orchestrates screening operations and handles HTTP concerns
 */

import { CreateScreeningUseCase, FormDataValidationError } from '@/application/use-cases/screening/CreateScreeningUseCase';
import { GetScreeningByIdUseCase } from '@/application/use-cases/screening/GetScreeningByIdUseCase';
import { GetScreeningsByPhoneUseCase } from '@/application/use-cases/screening/GetScreeningsByPhoneUseCase';
import { ListScreeningsUseCase } from '@/application/use-cases/screening/ListScreeningsUseCase';
import { UpdateScreeningStatusUseCase } from '@/application/use-cases/screening/UpdateScreeningStatusUseCase';
import { AddAdditionalEmailUseCase } from '@/application/use-cases/screening/AddAdditionalEmailUseCase';
import { RemoveAdditionalEmailUseCase } from '@/application/use-cases/screening/RemoveAdditionalEmailUseCase';
import { UploadReportUseCase, UploadReportDTO } from '@/application/use-cases/report/UploadReportUseCase';
import { CompleteScreeningUseCase, CompleteScreeningDTO } from '@/application/use-cases/report/CompleteScreeningUseCase';
import {
  CreateScreeningDTO,
  UpdateScreeningStatusDTO,
  FilterScreeningsDTO,
  ValidationError,
} from '@/application/dto/screening/ScreeningDTO';
import { AddAdditionalEmailDTO, RemoveAdditionalEmailDTO } from '@/application/dto/screening/AdditionalEmailDTO';
import { Screening, ScreeningStatus } from '@/domain/entities/Screening';
import { InvalidFileTypeError, FileSizeExceededError } from '@/domain/errors/FileStorageErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Response DTO for screening
 */
class ScreeningResponseDTO {
  id!: string;
  userId!: string | null;
  serviceId!: number;
  serviceName!: string | null;
  serviceReportSchema!: Record<string, any> | null;
  advisorId!: number | null;
  advisor!: { id: number; name: string; email: string; phoneNumber: string } | null;
  status!: ScreeningStatus;
  applicantName!: string;
  applicantEmail!: string;
  applicantPhone!: string | null;
  formData!: Record<string, any>;
  reportData!: Record<string, any> | null;
  stripeSessionId!: string | null;
  clientReferenceId!: string | null;
  paymentAmount!: number | null;
  paymentCompletedAt!: Date | null;
  isIdentityVerified!: boolean;
  verificationCompletedAt!: Date | null;
  adminUserId!: string | null;
  adminNotes!: string | null;
  reportUrl!: string | null;
  reportUrls!: string[];
  reportFileKeys!: string[];
  additionalEmails!: string[];
  paymentLinkUrl!: string | null;
  // Wee Trust authorization document fields
  weeTrustDocumentId!: string | null;
  authorizationDocumentUrl!: string | null;
  authorizationSignedAt!: Date | null;
  // Wee Trust identity verification fields
  identityVerificationId!: string | null;
  identityVerificationUrl!: string | null;
  identityVerifiedAt!: Date | null;
  identityVerificationData!: Record<string, any> | null;
  // Applicant detail fields
  applicantPersonType!: string | null;
  applicantLegalRepresentative!: string | null;
  applicantRFC!: string | null;
  applicantStreet!: string | null;
  applicantColony!: string | null;
  applicantMunicipality!: string | null;
  applicantState!: string | null;
  applicantZipCode!: string | null;
  // Manual payment tracking
  manualPaymentMarkedBy!: string | null;
  manualPaymentMarkedAt!: Date | null;
  manualPaymentReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  completedAt!: Date | null;

  static fromDomain(screening: Screening, advisor?: any, service?: any): ScreeningResponseDTO {
    return {
      id: screening.id,
      userId: screening.userId,
      serviceId: screening.serviceId,
      serviceName: service?.name || null,
      serviceReportSchema: service?.reportSchema?.toJSON?.() || service?.reportSchema || null,
      advisorId: screening.advisorId,
      advisor: advisor ? {
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber: advisor.phoneNumber
      } : null,
      status: screening.status,
      applicantName: screening.applicantName,
      applicantEmail: screening.applicantEmail,
      applicantPhone: screening.applicantPhone,
      formData: screening.formData,
      reportData: screening.reportData,
      stripeSessionId: screening.stripeSessionId,
      clientReferenceId: screening.clientReferenceId,
      paymentAmount: screening.paymentAmount,
      paymentCompletedAt: screening.paymentCompletedAt,
      isIdentityVerified: screening.isIdentityVerified,
      verificationCompletedAt: screening.verificationCompletedAt,
      adminUserId: screening.adminUserId,
      adminNotes: screening.adminNotes,
      reportUrl: screening.reportUrl,
      reportUrls: screening.reportUrls,
      reportFileKeys: screening.reportFileKeys,
      additionalEmails: screening.additionalEmails,
      paymentLinkUrl: screening.paymentLinkUrl,
      weeTrustDocumentId: screening.weeTrustDocumentId,
      authorizationDocumentUrl: screening.authorizationDocumentUrl,
      authorizationSignedAt: screening.authorizationSignedAt,
      identityVerificationId: screening.identityVerificationId,
      identityVerificationUrl: screening.identityVerificationUrl,
      identityVerifiedAt: screening.identityVerifiedAt,
      identityVerificationData: screening.identityVerificationData,
      // Applicant detail fields
      applicantPersonType: screening.applicantPersonType || null,
      applicantLegalRepresentative: screening.applicantLegalRepresentative || null,
      applicantRFC: screening.applicantRFC?.getValue() || null,
      applicantStreet: screening.applicantAddress?.street || null,
      applicantColony: screening.applicantAddress?.colony || null,
      applicantMunicipality: screening.applicantAddress?.municipality || null,
      applicantState: screening.applicantAddress?.state || null,
      applicantZipCode: screening.applicantAddress?.zipCode || null,
      // Manual payment tracking
      manualPaymentMarkedBy: screening.manualPaymentMarkedBy || null,
      manualPaymentMarkedAt: screening.manualPaymentMarkedAt || null,
      manualPaymentReason: screening.manualPaymentReason || null,
      createdAt: screening.createdAt,
      updatedAt: screening.updatedAt,
      completedAt: screening.completedAt,
    };
  }
}

export class ScreeningController {
  constructor(
    private createScreeningUseCase: CreateScreeningUseCase,
    private getScreeningByIdUseCase: GetScreeningByIdUseCase,
    private getScreeningsByPhoneUseCase: GetScreeningsByPhoneUseCase,
    private listScreeningsUseCase: ListScreeningsUseCase,
    private updateScreeningStatusUseCase: UpdateScreeningStatusUseCase,
    private uploadReportUseCase: UploadReportUseCase,
    private completeScreeningUseCase: CompleteScreeningUseCase,
    private addAdditionalEmailUseCase: AddAdditionalEmailUseCase,
    private removeAdditionalEmailUseCase: RemoveAdditionalEmailUseCase,
    private advisorRepository?: any,
    private serviceRepository?: any
  ) { }

  /**
   * Create a new screening
   */
  async create(request: any, userId?: string): Promise<ApiResponse> {
    try {
      // Add userId to request if authenticated
      const requestData = { ...request, userId };

      // Validate with DTO
      const dto = new CreateScreeningDTO(requestData);

      // Execute use case
      const screening = await this.createScreeningUseCase.execute(dto);

      return {
        success: true,
        data: ScreeningResponseDTO.fromDomain(screening),
        statusCode: 201,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a screening by ID
   */
  async getById(screeningId: string): Promise<ApiResponse> {
    try {
      const screening = await this.getScreeningByIdUseCase.execute(screeningId);

      if (!screening) {
        return {
          success: false,
          error: 'Screening not found',
          statusCode: 404,
        };
      }

      // Fetch advisor data if advisorId exists
      let advisor = null;
      if (screening.advisorId && this.advisorRepository) {
        advisor = await this.advisorRepository.findById(screening.advisorId);
      }

      // Fetch service data to get reportSchema
      let service = null;
      if (this.serviceRepository) {
        service = await this.serviceRepository.findById(screening.serviceId);
      }

      return {
        success: true,
        data: ScreeningResponseDTO.fromDomain(screening, advisor, service),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List screenings with optional filters
   */
  async list(filters: any): Promise<ApiResponse> {
    try {
      const dto = new FilterScreeningsDTO(filters);
      const screenings = await this.listScreeningsUseCase.execute(dto);

      return {
        success: true,
        data: screenings.map((s) => ScreeningResponseDTO.fromDomain(s)),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get screenings by phone number (last 3)
   */
  async getByPhone(phone: string): Promise<ApiResponse> {
    try {
      const screenings = await this.getScreeningsByPhoneUseCase.execute(phone);

      return {
        success: true,
        data: screenings.map((s) => ScreeningResponseDTO.fromDomain(s)),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update screening status
   */
  async updateStatus(
    screeningId: string,
    request: any,
    adminUserId?: string
  ): Promise<ApiResponse> {
    try {
      // Add adminUserId to request if provided
      const requestData = { ...request, adminUserId };

      const dto = new UpdateScreeningStatusDTO(requestData);
      const screening = await this.updateScreeningStatusUseCase.execute(
        screeningId,
        dto
      );

      return {
        success: true,
        data: ScreeningResponseDTO.fromDomain(screening),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Upload report for a screening
   */
  async uploadReport(
    screeningId: string,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const dto: UploadReportDTO = {
        screeningId,
        adminUserId,
        fileBuffer,
        fileName,
        contentType,
      };

      const result = await this.uploadReportUseCase.execute(dto);

      // Construct short backend URL instead of presigned URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shortReportUrl = `${baseUrl}/api/files/${result.fileKey}`;

      return {
        success: true,
        data: {
          reportUrl: shortReportUrl,  // Short backend URL
          fileKey: result.fileKey,
          message: result.message,
        },
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Complete a screening (mark as completed and send report)
   */
  async completeScreening(
    screeningId: string,
    reportUrls: string[],
    adminUserId: string,
    adminNotes?: string,
    sendToAdvisor?: boolean
  ): Promise<ApiResponse> {
    try {
      const dto: CompleteScreeningDTO = {
        screeningId,
        adminUserId,
        reportUrls,
        adminNotes,
        sendToAdvisor,
      };

      const result = await this.completeScreeningUseCase.execute(dto);

      return {
        success: true,
        data: {
          screeningId: result.screeningId,
          message: result.message,
        },
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Add additional email to screening
   */
  async addAdditionalEmail(
    screeningId: string,
    email: string
  ): Promise<ApiResponse> {
    try {
      const dto = new AddAdditionalEmailDTO({ email });
      const result = await this.addAdditionalEmailUseCase.execute(screeningId, dto);

      return {
        success: true,
        data: {
          screeningId: result.screeningId,
          email: result.email,
          message: result.message
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Remove additional email from screening
   */
  async removeAdditionalEmail(
    screeningId: string,
    email: string
  ): Promise<ApiResponse> {
    try {
      const dto = new RemoveAdditionalEmailDTO({ email });
      const result = await this.removeAdditionalEmailUseCase.execute(screeningId, dto);

      return {
        success: true,
        data: {
          screeningId: result.screeningId,
          email: result.email,
          message: result.message
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('ScreeningController error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof FormDataValidationError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
        data: {
          validationErrors: error.validationErrors
        }
      };
    }

    if (error instanceof InvalidFileTypeError || error instanceof FileSizeExceededError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('not found')) {
        return { success: false, error: error.message, statusCode: 404 };
      }

      if (
        error.message.includes('not available') ||
        error.message.includes('Cannot')
      ) {
        return { success: false, error: error.message, statusCode: 400 };
      }

      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
