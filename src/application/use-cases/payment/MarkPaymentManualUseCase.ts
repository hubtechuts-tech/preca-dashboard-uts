/**
 * MarkPaymentManualUseCase
 *
 * Marks a screening as paid manually by an admin.
 * Business logic: Updates screening status, triggers confirmation email,
 * and sends authorization document for signature (same as normal payment flow).
 * 
 * Used for handling alternative payment methods or exceptional cases.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IEmailService } from '../../../domain/interfaces/services/IEmailService';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { Screening } from '../../../domain/entities/Screening';
import { SendAuthorizationDocumentUseCase } from '../wee-trust/SendAuthorizationDocumentUseCase';

export interface MarkPaymentManualDTO {
  screeningId: string;
  adminUserId: string;
  reason: string;
}

export class MarkPaymentManualUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceCatalogRepository,
    private emailService: IEmailService,
    private sendAuthorizationDocumentUseCase?: SendAuthorizationDocumentUseCase
  ) {}

  async execute(dto: MarkPaymentManualDTO): Promise<Screening> {
    const { screeningId, adminUserId, reason } = dto;

    // 1. Validate inputs
    if (!screeningId || screeningId.trim().length === 0) {
      throw new Error('Se requiere el ID de la solicitud');
    }

    if (!adminUserId || adminUserId.trim().length === 0) {
      throw new Error('Se requiere el ID del administrador');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Se requiere una razón para marcar el pago manualmente');
    }

    // 2. Find the screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Solicitud con ID ${screeningId} no encontrada`);
    }

    // 3. Get service to determine the price
    const service = await this.serviceRepository.findById(screening.serviceId);
    if (!service) {
      throw new Error(`Servicio con ID ${screening.serviceId} no encontrado`);
    }

    // 4. Mark as paid manually using domain method (uses full service price)
    const paymentAmount = Number(service.priceMxn);
    screening.markAsPaidManually(adminUserId, paymentAmount, reason);

    // 5. Save the updated screening
    await this.screeningRepository.save(screening);

    console.log(`[MarkPaymentManualUseCase] Screening ${screeningId} marked as paid manually by admin ${adminUserId}`);
    console.log(`[MarkPaymentManualUseCase] Reason: ${reason}`);
    console.log(`[MarkPaymentManualUseCase] Amount: ${paymentAmount}`);

    // 6. Get service name for email
    const serviceName = service ? service.name : 'Servicio de Screening';

    // 7. Send payment confirmation email (optional for manual payments)
    try {
      await this.emailService.sendPaymentConfirmation(
        screening.applicantEmail,
        screening.applicantName,
        serviceName,
        paymentAmount
      );
      console.log(`[MarkPaymentManualUseCase] Payment confirmation email sent to ${screening.applicantEmail}`);
    } catch (error) {
      console.error('[MarkPaymentManualUseCase] Failed to send payment confirmation email:', error);
      // Don't throw - payment is already completed, email failure is non-critical
    }

    // 8. Send authorization document for signature with identity verification via Wee Trust
    // This is the same as the normal payment flow - user will sign then verify identity
    if (this.sendAuthorizationDocumentUseCase) {
      try {
        console.log(`[MarkPaymentManualUseCase] Sending authorization document (with identity verification) for screening ${screening.id}`);
        await this.sendAuthorizationDocumentUseCase.execute({
          screeningId: screening.id
        });
        console.log(`[MarkPaymentManualUseCase] Authorization document sent successfully - user will complete signing + identity verification`);
      } catch (error) {
        console.error('[MarkPaymentManualUseCase] Failed to send authorization document:', error);
        // Don't throw - payment is completed, authorization can be retried manually
        // In production, you might want to add a retry queue or manual intervention
      }
    } else {
      console.warn('[MarkPaymentManualUseCase] SendAuthorizationDocumentUseCase not configured');
    }

    return screening;
  }
}
