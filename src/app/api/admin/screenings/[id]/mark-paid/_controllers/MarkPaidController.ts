/**
 * Presentation Layer - Mark Payment Manual Controller
 *
 * Controller for manually marking a screening as paid by an admin.
 * Follows Clean Architecture pattern - thin controller, business logic in use case.
 */

import { MarkPaymentManualUseCase, MarkPaymentManualDTO } from '@/application/use-cases/payment/MarkPaymentManualUseCase';

export interface MarkPaidRequest {
  reason: string;
}

export interface MarkPaidResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    paymentAmount: number | null;
    manualPaymentMarkedBy: string | null;
    manualPaymentMarkedAt: Date | null;
    manualPaymentReason: string | null;
  };
  error?: string;
  statusCode: number;
}

export class MarkPaidController {
  constructor(private markPaymentManualUseCase: MarkPaymentManualUseCase) {}

  async markAsPaid(
    screeningId: string,
    adminUserId: string,
    request: MarkPaidRequest
  ): Promise<MarkPaidResponse> {
    try {
      // Validate request
      if (!request.reason || request.reason.trim().length === 0) {
        return {
          success: false,
          error: 'Se requiere una razón para marcar el pago manualmente',
          statusCode: 400
        };
      }

      // Create DTO
      const dto: MarkPaymentManualDTO = {
        screeningId,
        adminUserId,
        reason: request.reason
      };

      // Execute use case
      const screening = await this.markPaymentManualUseCase.execute(dto);

      // Return success response with screening data
      return {
        success: true,
        data: {
          id: screening.id,
          status: screening.status,
          paymentAmount: screening.paymentAmount,
          manualPaymentMarkedBy: screening.manualPaymentMarkedBy,
          manualPaymentMarkedAt: screening.manualPaymentMarkedAt,
          manualPaymentReason: screening.manualPaymentReason
        },
        statusCode: 200
      };

    } catch (error: any) {
      console.error('[MarkPaidController] Error:', error);

      // Handle known errors
      if (error.message.includes('no encontrada') || error.message.includes('not found')) {
        return {
          success: false,
          error: error.message,
          statusCode: 404
        };
      }

      if (error.message.includes('pendientes de pago') || error.message.includes('pending')) {
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      // Generic error
      return {
        success: false,
        error: error.message || 'Error interno del servidor',
        statusCode: 500
      };
    }
  }
}
