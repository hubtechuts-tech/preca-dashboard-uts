/**
 * ProcessStripeWebhookUseCase
 *
 * Processes Stripe webhook events.
 * Business logic: Handles checkout.session.completed events to mark screenings as paid.
 * Supports both direct checkout sessions and payment link sessions.
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IStripeService } from '../../../domain/interfaces/services/IStripeService';
import { Screening } from '../../../domain/entities/Screening';
import { MarkPaymentCompletedUseCase } from './MarkPaymentCompletedUseCase';
import { MarkPaymentCompletedDTO } from '../../dto/screening/ScreeningDTO';

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      client_reference_id?: string;
      payment_link?: string;
      amount_total?: number;
      currency?: string;
      payment_status?: string;
    };
  };
}

export class ProcessStripeWebhookUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private markPaymentCompletedUseCase: MarkPaymentCompletedUseCase,
    private stripeService: IStripeService
  ) {}

  async execute(event: StripeWebhookEvent): Promise<void> {
    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      console.log(`Ignoring event type: ${event.type}`);
      return;
    }

    const session = event.data.object;

    // Validate payment was successful
    if (session.payment_status !== 'paid') {
      console.log(`Payment not completed for session ${session.id}`);
      return;
    }

    // Get client_reference_id - either from session or payment link metadata
    let clientReferenceId = session.client_reference_id;

    // If no direct client_reference_id, check if this came from a payment link
    if (!clientReferenceId && session.payment_link) {
      console.log(`Session ${session.id} came from payment link ${session.payment_link}`);

      // Fetch payment link to get metadata
      const paymentLink = await this.stripeService.getPaymentLink(session.payment_link);

      if (paymentLink && paymentLink.metadata?.client_reference_id) {
        clientReferenceId = paymentLink.metadata.client_reference_id;
        console.log(`Extracted client_reference_id from payment link metadata: ${clientReferenceId}`);
      }
    }

    if (!clientReferenceId) {
      throw new Error('No client_reference_id found in checkout session or payment link metadata');
    }

    // Find screening by client reference ID
    const screening = await this.screeningRepository.findByClientReferenceId(
      clientReferenceId
    );

    if (!screening) {
      throw new Error(
        `Screening not found for client_reference_id: ${clientReferenceId}`
      );
    }

    // Check if already paid (idempotency)
    if (screening.isPaid() || screening.isProcessing() || screening.isCompleted()) {
      console.log(
        `Screening ${screening.id} already paid/processed, skipping`
      );
      return;
    }

    // Calculate amount in the correct currency (Stripe uses smallest currency unit)
    const amountTotal = session.amount_total || 0;
    const currency = session.currency || 'mxn';
    const amount = currency === 'mxn' ? amountTotal / 100 : amountTotal;

    // Mark payment as completed
    const dto = new MarkPaymentCompletedDTO({
      stripeSessionId: session.id,
      paymentAmount: amount,
    });

    await this.markPaymentCompletedUseCase.execute(screening.id, dto);

    console.log(
      `Successfully processed payment for screening ${screening.id}`
    );
  }
}
