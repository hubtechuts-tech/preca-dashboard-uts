/**
 * Application Layer - Complete Screening Use Case
 *
 * Marks a screening as completed and sends report to client
 * Business logic: Validates report exists, marks completed, sends email with PDF
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IEmailService, EmailAttachment } from '../../../domain/interfaces/services/IEmailService';
import { IFileStorageService } from '../../../domain/interfaces/services/IFileStorageService';
import { IAdvisorRepository } from '../../../domain/interfaces/repositories/IAdvisorRepository';
import { generateSignedFileUrl } from '@/lib/file-token';

export interface CompleteScreeningDTO {
  screeningId: string;
  adminUserId: string;
  reportUrls: string[];
  adminNotes?: string;
  sendToAdvisor?: boolean;
}

export interface CompleteScreeningResult {
  success: boolean;
  screeningId: string;
  message: string;
}

export class CompleteScreeningUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private emailService: IEmailService,
    private fileStorageService: IFileStorageService,
    private advisorRepository: IAdvisorRepository
  ) {}

  async execute(dto: CompleteScreeningDTO): Promise<CompleteScreeningResult> {
    const { screeningId, adminUserId, reportUrls, adminNotes, sendToAdvisor = false } = dto;

    console.log(`[CompleteScreeningUseCase] Completing screening ${screeningId} with ${reportUrls.length} report(s)`);
    console.log(`[CompleteScreeningUseCase] Send to advisor: ${sendToAdvisor}`);

    // 1. Get screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // 2. Validate business rules
    if (!screening.isProcessing()) {
      throw new Error('Can only complete screenings that are being processed');
    }

    if (!reportUrls || reportUrls.length === 0) {
      throw new Error('At least one report URL is required to complete screening');
    }

    // 3. Add admin notes if provided
    if (adminNotes && adminNotes.trim().length > 0) {
      screening.addAdminNotes(adminNotes, adminUserId);
    }

    // 4. Mark as completed (use first URL for backward compatibility)
    screening.complete(reportUrls[0], adminUserId);
    await this.screeningRepository.save(screening);

    console.log(`[CompleteScreeningUseCase] Screening marked as completed`);

    // 5. Download all report files for email attachments
    // Use file keys directly from screening entity (preferred) or extract from URLs (backward compatibility)
    const fileKeys = screening.reportFileKeys.length > 0
      ? screening.reportFileKeys
      : reportUrls.map(url => this.extractFileKeyFromUrl(url)).filter(Boolean) as string[];

    const reportAttachments: EmailAttachment[] = [];
    for (let i = 0; i < fileKeys.length; i++) {
      try {
        const fileKey = fileKeys[i];
        const buffer = await this.fileStorageService.downloadFile(fileKey);
        console.log(`[CompleteScreeningUseCase] Report ${i + 1} downloaded for email: ${buffer.length} bytes`);

        // Extract filename from file key or use default with index
        const filename = fileKey.split('/').pop() || `reporte_${i + 1}.pdf`;

        reportAttachments.push({
          filename,
          content: buffer,
          contentType: 'application/pdf'
        });
      } catch (error) {
        console.error(`[CompleteScreeningUseCase] Failed to download report ${i + 1} for email:`, error);
        // Continue with other files - we'll still send the email with available attachments
      }
    }

    console.log(`[CompleteScreeningUseCase] Downloaded ${reportAttachments.length}/${reportUrls.length} reports for email`);

    // 6. Collect all recipients
    interface Recipient {
      email: string;
      name: string;
      type: 'applicant' | 'advisor' | 'additional';
    }

    const recipients: Recipient[] = [];

    // Always include applicant
    recipients.push({
      email: screening.applicantEmail,
      name: screening.applicantName,
      type: 'applicant'
    });

    // Conditionally include advisor
    if (sendToAdvisor && screening.advisorId) {
      try {
        const advisor = await this.advisorRepository.findById(screening.advisorId);

        if (advisor) {
          if (advisor.isActive) {
            // Prevent duplicate if advisor email matches applicant email
            if (advisor.email.toLowerCase() !== screening.applicantEmail.toLowerCase()) {
              recipients.push({
                email: advisor.email,
                name: advisor.name,
                type: 'advisor'
              });
              console.log(`[CompleteScreeningUseCase] Added advisor to recipients: ${advisor.email}`);
            } else {
              console.log(`[CompleteScreeningUseCase] Skipped advisor (same as applicant email)`);
            }
          } else {
            console.warn(`[CompleteScreeningUseCase] Advisor ${screening.advisorId} is inactive, skipping`);
          }
        } else {
          console.warn(`[CompleteScreeningUseCase] Advisor ${screening.advisorId} not found`);
        }
      } catch (error) {
        console.error(`[CompleteScreeningUseCase] Failed to fetch advisor:`, error);
        // Continue without advisor - don't fail completion
      }
    }

    // Include all additional emails
    const additionalEmails = screening.getAdditionalEmails();
    for (const email of additionalEmails) {
      // Prevent duplicates with applicant or advisor
      const isDuplicate = recipients.some(r => r.email.toLowerCase() === email.toLowerCase());

      if (!isDuplicate) {
        recipients.push({
          email,
          name: screening.applicantName, // Use applicant name as fallback
          type: 'additional'
        });
      } else {
        console.log(`[CompleteScreeningUseCase] Skipped duplicate additional email: ${email}`);
      }
    }

    console.log(`[CompleteScreeningUseCase] Total recipients: ${recipients.length}`);

    // 7. Generate signed URLs for email links (30-day expiration)
    // This allows applicants to access files without authentication
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signedReportUrls = fileKeys.map(fileKey =>
      generateSignedFileUrl(fileKey, baseUrl, 30) // 30 days
    );

    console.log(`[CompleteScreeningUseCase] Generated ${signedReportUrls.length} signed URLs for email links`);

    // 8. Send separate emails to each recipient
    // Add delay between sends to avoid Resend rate limit (2 requests/second)
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        await this.emailService.sendReportReady(
          recipient.email,
          recipient.name,
          signedReportUrls, // Use signed URLs with tokens instead of plain URLs
          reportAttachments.length > 0 ? reportAttachments : undefined
        );

        console.log(`[CompleteScreeningUseCase] Email sent to ${recipient.type}: ${recipient.email}`);
        successCount++;

        // Add 1000ms delay between emails to respect Resend's rate limit (2 req/sec)
        // Skip delay after the last email
        if (i < recipients.length - 1) {
          console.log(`[CompleteScreeningUseCase] Waiting 1000ms before next email (rate limit protection)`);
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`[CompleteScreeningUseCase] Failed to send email to ${recipient.email}:`, error);
        failureCount++;
        // Don't throw - continue sending to other recipients
      }
    }

    console.log(`[CompleteScreeningUseCase] Email summary: ${successCount} sent, ${failureCount} failed`);

    // Log warning if attachment bandwidth is high
    const totalAttachmentSize = reportAttachments.reduce((sum, att) =>
      sum + (Buffer.isBuffer(att.content) ? att.content.length : 0), 0
    );
    const totalBandwidth = totalAttachmentSize * recipients.length;

    if (totalBandwidth > 10 * 1024 * 1024) { // 10MB threshold
      console.warn(`[CompleteScreeningUseCase] High bandwidth usage: ${(totalBandwidth / 1024 / 1024).toFixed(2)} MB sent to ${recipients.length} recipients`);
    }

    return {
      success: true,
      screeningId: screening.id,
      message: `Screening completed. Reports sent to ${successCount} recipient(s).`
    };
  }

  /**
   * Delay helper to avoid rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract file key from URL (handles multiple URL formats)
   *
   * Supported formats:
   * 1. Short backend URL: http://localhost:3000/api/files/reports/123-file.pdf
   *    Returns: reports/123-file.pdf
   *
   * 2. Legacy presigned URL: https://xxx.r2.cloudflarestorage.com/bucket/reports/123-file.pdf?X-Amz-Algorithm=...
   *    Returns: reports/123-file.pdf
   *
   * 3. Legacy Supabase URL: https://xxx.supabase.co/storage/v1/s3/bucket/reports/123-file.pdf
   *    Returns: reports/123-file.pdf
   */
  private extractFileKeyFromUrl(url: string): string | null {
    try {
      // Remove query parameters from signed URLs
      const urlWithoutQuery = url.split('?')[0];

      // Decode URL-encoded characters (e.g., %20 -> space)
      const decodedUrl = decodeURIComponent(urlWithoutQuery);

      // Try to match short backend URL format: /api/files/{fileKey}
      const backendMatch = decodedUrl.match(/\/api\/files\/(.+)$/);
      if (backendMatch) {
        return backendMatch[1];
      }

      // Try to match R2/Cloudflare URL format: /bucket/{fileKey}
      const r2Match = decodedUrl.match(/\/preca-[^\/]+\/(.+)$/);
      if (r2Match) {
        return r2Match[1];
      }

      // Try legacy Supabase format: /preca-reports/{fileKey}
      const legacyMatch = decodedUrl.match(/\/preca-reports\/(.+)$/);
      if (legacyMatch) {
        return legacyMatch[1];
      }

      console.warn('[CompleteScreeningUseCase] Could not extract file key from URL:', url);
      return null;
    } catch (error) {
      console.error('[CompleteScreeningUseCase] Failed to extract file key from URL:', error);
      return null;
    }
  }

  /**
   * Extract filename from URL
   * Example: https://xxx.supabase.co/storage/v1/object/public/bucket/reports/my-report.pdf
   * Returns: my-report.pdf
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlWithoutQuery = url.split('?')[0];
      const parts = urlWithoutQuery.split('/');
      return parts[parts.length - 1] || null;
    } catch (error) {
      return null;
    }
  }
}
