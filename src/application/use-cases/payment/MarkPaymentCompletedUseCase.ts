/**
 * MarkPaymentCompletedUseCase
 *
 * Marks a screening as paid after successful Stripe payment.
 * Business logic: Updates screening status, triggers confirmation email,
 * and sends authorization document for signature (with embedded identity verification).
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IEmailService } from '../../../domain/interfaces/services/IEmailService';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { Screening } from '../../../domain/entities/Screening';
import { MarkPaymentCompletedDTO } from '../../dto/screening/ScreeningDTO';
import { SendAuthorizationDocumentUseCase } from '../wee-trust/SendAuthorizationDocumentUseCase';

export class MarkPaymentCompletedUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceCatalogRepository,
    private emailService: IEmailService,
    private sendAuthorizationDocumentUseCase?: SendAuthorizationDocumentUseCase
  ) {}

  async execute(
    screeningId: string,
    dto: MarkPaymentCompletedDTO
  ): Promise<Screening> {
    // 1. Find the screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening with ID ${screeningId} not found`);
    }

    // 2. Mark as paid using domain method
    screening.markAsPaid(dto.stripeSessionId, dto.paymentAmount);

    // 3. Save the updated screening
    await this.screeningRepository.save(screening);

    // 4. Get service details for email
    const service = await this.serviceRepository.findById(screening.serviceId);
    const serviceName = service ? service.name : 'Servicio de Screening';

    // 5. Send payment confirmation email
    try {
      await this.emailService.sendPaymentConfirmation(
        screening.applicantEmail,
        screening.applicantName,
        serviceName,
        dto.paymentAmount
      );
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      // Don't throw - payment is already completed, email failure is non-critical
    }

    // 6. Send authorization document for signature with identity verification via Wee Trust
    // Note: Identity verification (INE + biometric) is now embedded in the document signing flow
    // User will sign the document first, then complete identity verification in the same Wee Trust flow
    if (this.sendAuthorizationDocumentUseCase) {
      try {
        console.log(`[MarkPaymentCompletedUseCase] Sending authorization document (with identity verification) for screening ${screening.id}`);
        await this.sendAuthorizationDocumentUseCase.execute({
          screeningId: screening.id
        });
        console.log(`[MarkPaymentCompletedUseCase] Authorization document sent successfully - user will complete signing + identity verification`);
      } catch (error) {
        console.error('Failed to send authorization document:', error);
        // Don't throw - payment is completed, authorization can be retried manually
        // In production, you might want to add a retry queue or manual intervention
      }
    } else {
      console.warn('[MarkPaymentCompletedUseCase] SendAuthorizationDocumentUseCase not configured');
    }

    return screening;
  }
}
