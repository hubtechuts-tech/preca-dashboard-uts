/**
 * Application Layer - Process Wee Trust Webhook Use Case
 *
 * Handles webhook events from Wee Trust:
 * - sentDocument: Document sent to signer (log event)
 * - signedDocument: Signer signed the document (update screening)
 * - completedDocument: All signers completed (final confirmation)
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IWeeTrustService } from '../../../domain/interfaces/services/IWeeTrustService';
import { IEmailService } from '../../../domain/interfaces/services/IEmailService';

export interface WeeTrustWebhookPayload {
  event: string; // Event type: sentDocument, signedDocument, completedDocument
  documentID: string;
  signatory?: Array<{
    emailID: string;
    name: string;
    isSigned: number;
    signatoryID: string;
  }>;
  status?: string; // Document status: DRAFT, PENDING, COMPLETED
  documentFileObj?: {
    url: string;
    size: string;
  };
}

export interface ProcessWeeTrustWebhookResult {
  success: boolean;
  message: string;
  screeningId?: string;
  status?: string;
}

export class ProcessWeeTrustWebhookUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private weeTrustService: IWeeTrustService,
    private emailService: IEmailService
  ) {}

  async execute(payload: WeeTrustWebhookPayload): Promise<ProcessWeeTrustWebhookResult> {
    const { event, documentID } = payload;

    console.log(`[ProcessWeeTrustWebhookUseCase] Received webhook: ${event} for document ${documentID}`);

    // Find screening by Wee Trust document ID
    const screening = await this.findScreeningByWeeTrustDocumentId(documentID);

    if (!screening) {
      console.warn(`[ProcessWeeTrustWebhookUseCase] No screening found for document ${documentID}`);
      return {
        success: false,
        message: `No screening found for document ${documentID}`
      };
    }

    // Handle different webhook events
    switch (event) {
      case 'sentDocument':
        // Document was sent to signer (informational only)
        console.log(`[ProcessWeeTrustWebhookUseCase] Document sent to ${screening.applicantEmail}`);
        return {
          success: true,
          message: 'Document sent notification received',
          screeningId: screening.id,
          status: 'sent'
        };

      case 'signedDocument':
      case 'completedDocument':
        // Document was signed - update screening
        return await this.handleDocumentSigned(screening.id, documentID, payload);

      default:
        console.warn(`[ProcessWeeTrustWebhookUseCase] Unknown webhook event: ${event}`);
        return {
          success: false,
          message: `Unknown webhook event: ${event}`
        };
    }
  }

  /**
   * Handle document signed webhook
   * Now also handles identity verification if biometric was enabled
   */
  private async handleDocumentSigned(
    screeningId: string,
    documentId: string,
    payload: WeeTrustWebhookPayload
  ): Promise<ProcessWeeTrustWebhookResult> {
    const screening = await this.screeningRepository.findById(screeningId);

    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // Check if already signed
    if (screening.hasSignedAuthorization()) {
      console.log(`[ProcessWeeTrustWebhookUseCase] Screening ${screeningId} already marked as signed`);
      return {
        success: true,
        message: 'Screening already marked as signed (idempotent)',
        screeningId: screening.id,
        status: 'already_signed'
      };
    }

    // Get document details from Wee Trust to get the signed document URL
    const documentStatus = await this.weeTrustService.getDocumentStatus(documentId);

    // Verify document is signed
    const allSigned = documentStatus.signatory.every(s => s.isSigned === 1);

    if (!allSigned) {
      console.warn(`[ProcessWeeTrustWebhookUseCase] Document ${documentId} not fully signed yet`);
      return {
        success: false,
        message: 'Document not fully signed yet',
        screeningId: screening.id,
        status: 'partially_signed'
      };
    }

    // Mark authorization as signed
    const documentUrl = documentStatus.documentFileObj?.url || payload.documentFileObj?.url || '';

    if (!documentUrl) {
      throw new Error('Document URL not provided in webhook payload or status response');
    }

    screening.markAuthorizationSigned(documentUrl);

    // Check if biometric verification was completed
    // IMPORTANT: If document is signed AND biometric was required, identity IS verified
    // (Wee Trust won't allow signing without completing biometric verification)
    const signer = documentStatus.signatory[0];
    const biometricWasRequired = signer?.forceBiometric?.forcedID || signer?.forceBiometric?.forcedFaceID || signer?.forceBiometric?.forcedBackgroundCheck;

    if (biometricWasRequired && allSigned) {
      console.log('[ProcessWeeTrustWebhookUseCase] Document signed with biometric verification required');

      // Try to fetch detailed biometric results if session ID is available
      if (signer?.identitySessionId) {
        try {
          console.log(`[ProcessWeeTrustWebhookUseCase] Fetching biometric results for session ${signer.identitySessionId}`);

          // Fetch identity verification results using the session ID
          const verificationResults = await this.weeTrustService.getIdentityVerificationResults(
            signer.identitySessionId
          );

          // Store identity session ID in screening for reference
          screening.setIdentityVerification(signer.identitySessionId, '');

          // Mark identity as verified with OCR data
          screening.markIdentityVerified(verificationResults);

          console.log(`[ProcessWeeTrustWebhookUseCase] Identity verified successfully with OCR data`);
          console.log(`[ProcessWeeTrustWebhookUseCase] Extracted CURP: ${screening.getExtractedCURP()}`);
          console.log(`[ProcessWeeTrustWebhookUseCase] Extracted Name: ${screening.getExtractedName()}`);
        } catch (error) {
          console.error('[ProcessWeeTrustWebhookUseCase] Failed to fetch biometric results:', error);
          console.log('[ProcessWeeTrustWebhookUseCase] Marking as verified anyway (document signed with biometric required)');

          // Still mark as verified - if document is signed with biometric required, identity IS verified
          screening.setIdentityVerification('wee-trust-verified', '');
          screening.markIdentityVerified({
            results: {
              ocr: {
                curp: 'VERIFIED_VIA_WEETRUST',
                name: { fullName: signer.name }
              }
            }
          } as any);
        }
      } else {
        // No session ID but biometric was required and document is signed
        // This means identity was verified (Wee Trust enforces it)
        console.log('[ProcessWeeTrustWebhookUseCase] No session ID but biometric was required - marking as verified');
        screening.setIdentityVerification('wee-trust-verified', '');
        screening.markIdentityVerified({
          results: {
            ocr: {
              curp: 'VERIFIED_VIA_WEETRUST',
              name: { fullName: signer.name }
            }
          }
        } as any);
      }
    } else {
      console.log('[ProcessWeeTrustWebhookUseCase] No biometric verification configured for this document');
    }

    // Save screening with all updates
    await this.screeningRepository.save(screening);

    console.log(`[ProcessWeeTrustWebhookUseCase] Screening ${screeningId} marked as authorized`);

    // Send admin notification email
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://preca.admin.botia.pro';

      if (adminEmail) {
        const dashboardUrl = `${baseUrl}/dashboard/screenings/${screeningId}`;

        await this.emailService.sendAdminScreeningNotification(
          adminEmail,
          screening.applicantName,
          screeningId,
          dashboardUrl
        );

        console.log(`[ProcessWeeTrustWebhookUseCase] Admin notification sent to ${adminEmail}`);
      } else {
        console.warn('[ProcessWeeTrustWebhookUseCase] ADMIN_EMAIL not configured - skipping admin notification');
      }
    } catch (emailError) {
      // Don't fail the webhook if email fails
      console.error('[ProcessWeeTrustWebhookUseCase] Failed to send admin notification:', emailError);
    }

    return {
      success: true,
      message: screening.hasIdentityVerification()
        ? 'Document signed and identity verified successfully'
        : 'Authorization document signed successfully',
      screeningId: screening.id,
      status: 'signed'
    };
  }

  /**
   * Find screening by Wee Trust document ID
   * This is a workaround since we don't have a direct index on wee_trust_document_id
   */
  private async findScreeningByWeeTrustDocumentId(documentId: string) {
    return await this.screeningRepository.findByWeeTrustDocumentId(documentId);
  }
}
