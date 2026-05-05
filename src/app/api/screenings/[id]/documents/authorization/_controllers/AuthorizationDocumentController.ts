/**
 * Presentation Layer - Authorization Document Controller
 * Handles HTTP concerns for authorization document operations
 */

import {
  GetAuthorizationDocumentUseCase,
  AuthorizationDocumentResult,
  ScreeningNotFoundError,
  NoAuthorizationDocumentError,
  DocumentUrlNotAvailableError,
} from '@/application/use-cases/wee-trust/GetAuthorizationDocumentUseCase';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Response DTO for authorization document
 */
interface AuthorizationDocumentResponseDTO {
  documentId: string;
  url: string;
  status: string;
  signedAt: string | null;
  expiresIn: string;
}

export class AuthorizationDocumentController {
  constructor(
    private getAuthorizationDocumentUseCase: GetAuthorizationDocumentUseCase
  ) {}

  /**
   * Get fresh authorization document URL
   */
  async getFreshUrl(screeningId: string): Promise<ApiResponse<AuthorizationDocumentResponseDTO>> {
    try {
      // Execute use case
      const result: AuthorizationDocumentResult = await this.getAuthorizationDocumentUseCase.execute(screeningId);

      // Map to response DTO
      const responseDTO: AuthorizationDocumentResponseDTO = {
        documentId: result.documentId,
        url: result.url,
        status: result.status,
        signedAt: result.signedAt ? result.signedAt.toISOString() : null,
        expiresIn: `${result.expiresInDays} days`,
      };

      return {
        success: true,
        data: responseDTO,
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and map to HTTP status codes
   */
  private handleError(error: unknown): ApiResponse {
    console.error('[AuthorizationDocumentController] Error:', error);

    if (error instanceof ScreeningNotFoundError) {
      return {
        success: false,
        error: error.message,
        statusCode: 404,
      };
    }

    if (error instanceof NoAuthorizationDocumentError) {
      return {
        success: false,
        error: error.message,
        statusCode: 404,
      };
    }

    if (error instanceof DocumentUrlNotAvailableError) {
      return {
        success: false,
        error: error.message,
        statusCode: 404,
      };
    }

    // Generic error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      statusCode: 500,
    };
  }
}
