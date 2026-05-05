/**
 * Application Layer - Get Authorization Document Use Case
 *
 * Fetches fresh authorization document URL from WeeTrust
 * Solves the problem of expired pre-signed URLs
 */

import { IScreeningRepository } from '@/domain/interfaces/repositories/IScreeningRepository';
import { IWeeTrustService } from '@/domain/interfaces/services/IWeeTrustService';

export interface AuthorizationDocumentResult {
  documentId: string;
  url: string;
  status: string;
  signedAt: Date | null;
  expiresInDays: number;
}

export class GetAuthorizationDocumentUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private weeTrustService: IWeeTrustService
  ) {}

  async execute(screeningId: string): Promise<AuthorizationDocumentResult> {
    // 1. Get screening from database
    const screening = await this.screeningRepository.findById(screeningId);

    if (!screening) {
      throw new ScreeningNotFoundError(screeningId);
    }

    // 2. Check if WeeTrust document exists
    if (!screening.weeTrustDocumentId) {
      throw new NoAuthorizationDocumentError(screeningId);
    }

    // 3. Fetch fresh document status from WeeTrust API
    const documentStatus = await this.weeTrustService.getDocumentStatus(
      screening.weeTrustDocumentId
    );

    // 4. Extract fresh URL
    const freshUrl = documentStatus.documentFileObj?.url;

    if (!freshUrl) {
      throw new DocumentUrlNotAvailableError(screening.weeTrustDocumentId);
    }

    // 5. Return fresh document data
    return {
      documentId: screening.weeTrustDocumentId,
      url: freshUrl,
      status: documentStatus.status,
      signedAt: screening.authorizationSignedAt,
      expiresInDays: 6, // WeeTrust pre-signed URLs expire in 6 days
    };
  }
}

// Domain Errors
export class ScreeningNotFoundError extends Error {
  constructor(screeningId: string) {
    super(`Screening with id ${screeningId} not found`);
    this.name = 'ScreeningNotFoundError';
  }
}

export class NoAuthorizationDocumentError extends Error {
  constructor(screeningId: string) {
    super(`No authorization document found for screening ${screeningId}`);
    this.name = 'NoAuthorizationDocumentError';
  }
}

export class DocumentUrlNotAvailableError extends Error {
  constructor(documentId: string) {
    super(`Document URL not available for document ${documentId}`);
    this.name = 'DocumentUrlNotAvailableError';
  }
}
