/**
 * IEmailService Interface
 *
 * Contract for sending transactional emails.
 * The infrastructure layer will implement this using Resend, SendGrid, or console logging.
 */

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
}

export interface IEmailService {
  /**
   * Send a generic email
   */
  send(options: EmailOptions): Promise<void>;

  /**
   * Send payment confirmation email
   * @param toEmail - Recipient email
   * @param applicantName - Name of the applicant
   * @param serviceName - Name of the service purchased
   * @param amount - Amount paid
   */
  sendPaymentConfirmation(
    toEmail: string,
    applicantName: string,
    serviceName: string,
    amount: number
  ): Promise<void>;

  /**
   * Send report ready notification email
   * @param toEmail - Recipient email
   * @param applicantName - Name of the applicant
   * @param reportUrls - URLs to download the reports
   * @param reportAttachments - Optional report file attachments
   */
  sendReportReady(
    toEmail: string,
    applicantName: string,
    reportUrls: string[],
    reportAttachments?: EmailAttachment[]
  ): Promise<void>;

  /**
   * Send verification reminder email
   * @param toEmail - Recipient email
   * @param applicantName - Name of the applicant
   * @param verificationUrl - URL to complete verification
   */
  sendVerificationReminder(
    toEmail: string,
    applicantName: string,
    verificationUrl: string
  ): Promise<void>;

  /**
   * Send rejection notification email
   * @param toEmail - Recipient email
   * @param applicantName - Name of the applicant
   * @param reason - Reason for rejection
   */
  sendRejectionNotification(
    toEmail: string,
    applicantName: string,
    reason: string
  ): Promise<void>;

  /**
   * Send admin notification about new screening ready to process
   * @param toEmail - Admin email
   * @param applicantName - Name of the applicant
   * @param screeningId - Screening ID
   * @param dashboardUrl - URL to the screening in the dashboard
   */
  sendAdminScreeningNotification(
    toEmail: string,
    applicantName: string,
    screeningId: string,
    dashboardUrl: string
  ): Promise<void>;
}
