/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (e.g., checkout.session.completed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { ProcessStripeWebhookUseCase } from '@/application/use-cases/payment/ProcessStripeWebhookUseCase';
import { MarkPaymentCompletedUseCase } from '@/application/use-cases/payment/MarkPaymentCompletedUseCase';
import { SendAuthorizationDocumentUseCase } from '@/application/use-cases/wee-trust/SendAuthorizationDocumentUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { ConsoleEmailService } from '@/infrastructure/services/ConsoleEmailService';
import { StripeService } from '@/infrastructure/services/StripeService';
import { WeeTrustService } from '@/infrastructure/services/WeeTrustService';
import { PDFFillerService } from '@/infrastructure/services/PDFFillerService';
import { prisma } from '@/infrastructure/database/PrismaClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/webhooks/stripe
 * Process Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found in headers');
      return NextResponse.json(
        { error: 'No Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Create dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const serviceRepository = new PrismaServiceCatalogRepository(prisma);
    const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);

    // Use Resend in production, Console in development
    const emailService =
      process.env.NODE_ENV === 'production' &&
      process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM
        ? new ResendEmailService(
            process.env.RESEND_API_KEY,
            process.env.EMAIL_FROM
          )
        : new ConsoleEmailService();

    // Create Wee Trust service and use cases (optional)
    // Note: Identity verification is now embedded in the document signing flow
    let sendAuthorizationUseCase: SendAuthorizationDocumentUseCase | undefined;
    if (process.env.WEETRUST_USER_ID && process.env.WEETRUST_API_KEY) {
      try {
        const weeTrustService = new WeeTrustService();
        const pdfFillerService = new PDFFillerService();
        sendAuthorizationUseCase = new SendAuthorizationDocumentUseCase(
          screeningRepository,
          weeTrustService,
          pdfFillerService,
          serviceRepository
        );
      } catch (error) {
        console.warn('Wee Trust not configured, authorization documents will not be sent:', error);
      }
    } else {
      console.warn('Wee Trust credentials not configured (WEETRUST_USER_ID, WEETRUST_API_KEY)');
    }

    const markPaymentUseCase = new MarkPaymentCompletedUseCase(
      screeningRepository,
      serviceRepository,
      emailService,
      sendAuthorizationUseCase
    );

    const webhookUseCase = new ProcessStripeWebhookUseCase(
      screeningRepository,
      markPaymentUseCase,
      stripeService
    );

    // Process the webhook
    await webhookUseCase.execute(event as any);

    // Return success
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);

    // Return 200 even on error to prevent Stripe from retrying
    // Log the error for investigation
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
