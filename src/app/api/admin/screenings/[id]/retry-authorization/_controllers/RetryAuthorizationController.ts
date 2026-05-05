/**
 * Presentation Layer - Retry Authorization Controller
 *
 * Handles admin retry requests for failed Wee Trust authorization document uploads
 * Orchestrates the retry flow and error handling
 */

import { SendAuthorizationDocumentUseCase } from '@/application/use-cases/wee-trust/SendAuthorizationDocumentUseCase';
import { IScreeningRepository } from '@/domain/interfaces/repositories/IScreeningRepository';

interface RetryRequest {
  screeningId: string;
}

interface RetryResponse {
  success: boolean;
  data?: {
    documentId: string;
    signingUrl?: string;
    message: string;
  };
  error?: string;
  details?: string;
  statusCode: number;
}

export class RetryAuthorizationController {
  constructor(
    private sendAuthorizationUseCase: SendAuthorizationDocumentUseCase,
    private screeningRepository: IScreeningRepository
  ) {}

  async retry(request: RetryRequest): Promise<RetryResponse> {
    try {
      const { screeningId } = request;

      console.log(`[RetryAuthorizationController] Retrying authorization for screening ${screeningId}`);

      // 1. Get screening to validate state
      const screening = await this.screeningRepository.findById(screeningId);

      if (!screening) {
        return {
          success: false,
          error: 'Screening not found',
          statusCode: 404
        };
      }

      // 2. Validate screening is paid
      if (!screening.isPaid()) {
        return {
          success: false,
          error: 'Screening must be paid before sending authorization document',
          details: `Current status: ${screening.status}`,
          statusCode: 400
        };
      }

      // 3. Reset Wee Trust document data if exists (to allow retry)
      if (screening.weeTrustDocumentId) {
        console.log(`[RetryAuthorizationController] Resetting existing document ID: ${screening.weeTrustDocumentId}`);

        // Use domain method to reset authorization fields
        screening.resetAuthorizationDocument();
        await this.screeningRepository.save(screening);
      }

      // 4. Execute use case to send authorization document
      const result = await this.sendAuthorizationUseCase.execute({ screeningId });

      console.log(`[RetryAuthorizationController] Authorization document sent successfully`);
      console.log(`[RetryAuthorizationController] Document ID: ${result.documentId}`);

      // 5. Return success response
      return {
        success: true,
        data: {
          documentId: result.documentId,
          signingUrl: result.signingUrl,
          message: result.message
        },
        statusCode: 200
      };

    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): RetryResponse {
    console.error('[RetryAuthorizationController] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log detailed error information
    console.error('[RetryAuthorizationController] Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    // Check for specific error types
    if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
      return {
        success: false,
        error: 'Wee Trust API timeout',
        details: 'The Wee Trust API is taking too long to respond. Please try again in a few moments.',
        statusCode: 504
      };
    }

    if (errorMessage.includes('not found')) {
      return {
        success: false,
        error: 'Resource not found',
        details: errorMessage,
        statusCode: 404
      };
    }

    if (errorMessage.includes('not paid') || errorMessage.includes('payment')) {
      return {
        success: false,
        error: 'Payment required',
        details: errorMessage,
        statusCode: 400
      };
    }

    // Generic error response
    return {
      success: false,
      error: 'Failed to send authorization document',
      details: errorMessage,
      statusCode: 500
    };
  }
}
