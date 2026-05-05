/**
 * Presentation Layer - Wee Trust Webhook Route
 *
 * Handles webhook events from Wee Trust API:
 *
 * Document Signing Events:
 * - sentDocument: Document sent to signer
 * - signedDocument: Document signed by user
 * - completedDocument: All signers completed (includes biometric verification if enabled)
 *
 * Note: Identity verification is now embedded in the document signing flow.
 * When check: true is used, biometric data is included in the completedDocument webhook.
 *
 * POST /api/webhooks/wee-trust
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProcessWeeTrustWebhookUseCase, WeeTrustWebhookPayload } from '@/application/use-cases/wee-trust/ProcessWeeTrustWebhookUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { WeeTrustService } from '@/infrastructure/services/WeeTrustService';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { ConsoleEmailService } from '@/infrastructure/services/ConsoleEmailService';
import { prisma } from '@/infrastructure/database/PrismaClient';

/**
 * POST /api/webhooks/wee-trust
 * Handle Wee Trust webhook events
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WeeTrustWebhook] Received webhook');

    // Parse webhook payload
    const payload = await request.json();

    console.log('[WeeTrustWebhook] Payload:', JSON.stringify(payload, null, 2));

    // Validate required fields (support both 'event' and 'type' for compatibility)
    if (!payload.event && !payload.type) {
      console.error('[WeeTrustWebhook] Invalid payload: missing event/type');
      return NextResponse.json(
        { error: 'Invalid webhook payload: event or type is required' },
        { status: 400 }
      );
    }

    // Initialize dependencies
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const weeTrustService = new WeeTrustService();

    // Initialize email service
    const emailService = process.env.RESEND_API_KEY
      ? new ResendEmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM)
      : new ConsoleEmailService();

    // Route webhook based on event type
    const event = payload.event || payload.type;

    // Document Signing Events (now includes biometric verification)
    if (event === 'sentDocument' || event === 'signedDocument' || event === 'completedDocument') {
      // Extract documentID - can be at root or nested in Document object
      const documentID = payload.documentID || payload.Document?.documentID;

      // Validate document payload
      if (!documentID) {
        console.error('[WeeTrustWebhook] Invalid document payload: missing documentID');
        console.error('[WeeTrustWebhook] Available keys:', Object.keys(payload));
        return NextResponse.json(
          { error: 'Invalid webhook payload: documentID is required for document events' },
          { status: 400 }
        );
      }

      // Normalize payload - flatten Document object if present
      const documentData = payload.Document || payload;
      const documentPayload: WeeTrustWebhookPayload = {
        event,
        documentID,
        signatory: documentData.signatory,
        status: documentData.status,
        documentFileObj: documentData.documentFileObj
      };
      const useCase = new ProcessWeeTrustWebhookUseCase(
        screeningRepository,
        weeTrustService,
        emailService
      );

      const result = await useCase.execute(documentPayload);

      console.log('[WeeTrustWebhook] Document processed:', result);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        screeningId: result.screeningId
      }, { status: 200 });
    }

    // Unknown event type
    console.warn('[WeeTrustWebhook] Unknown webhook event:', event);
    return NextResponse.json({
      success: false,
      message: `Unknown webhook event: ${event}`
    }, { status: 200 });

  } catch (error) {
    console.error('[WeeTrustWebhook] Error processing webhook:', error);

    // Return 200 to prevent Wee Trust from retrying
    // Log error for manual investigation
    return NextResponse.json({
      success: false,
      message: 'Webhook processed with errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

/**
 * GET /api/webhooks/wee-trust
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Wee Trust webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
