/**
 * Screening Entity
 *
 * Core business transaction representing a tenant screening request.
 * Following Clean Architecture: NO dependencies on external frameworks.
 */

import { RFC } from '../value-objects/RFC';
import { Address } from '../value-objects/Address';
import { PersonType } from './ServiceCatalog';

export enum ScreeningStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING_BUREAU = 'processing_bureau',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface ScreeningProps {
  id: string;
  userId: string | null;        // Who requested it (can be null for anonymous)
  serviceId: number;            // Which service was purchased (auto-incremented ID)
  advisorId: number | null;     // Real estate advisor who referred this client (optional)
  status: ScreeningStatus;

  // Applicant information
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;

  // Applicant detail fields (optional)
  applicantPersonType: PersonType | null;
  applicantLegalRepresentative: string | null;
  applicantRFC: RFC | null;
  applicantAddress: Address | null;

  // Dynamic form data (stored as JSON)
  formData: Record<string, any>;

  // Report data (filled by admin for dynamic PDF generation)
  reportData: Record<string, any> | null;

  // Payment tracking
  stripeSessionId: string | null;
  clientReferenceId: string | null;  // For reconciliation
  paymentLinkUrl: string | null;     // Stripe payment link URL
  paymentAmount: number | null;
  paymentCompletedAt: Date | null;

  // Verification
  isIdentityVerified: boolean;
  verificationCompletedAt: Date | null;

  // Wee Trust authorization document (Buró de Crédito permission)
  weeTrustDocumentId: string | null;
  authorizationDocumentUrl: string | null;
  authorizationSignedAt: Date | null;

  // Wee Trust identity verification (INE + biometric)
  identityVerificationId: string | null;
  identityVerificationUrl: string | null;
  identityVerifiedAt: Date | null;
  identityVerificationData: Record<string, any> | null;

  // Admin workflow
  adminUserId: string | null;
  adminNotes: string | null;
  reportUrl: string | null;
  reportUrls: string[];
  reportFileKeys: string[];  // File keys for reports (replaces URLs for storage)
  authorizationDocumentFileKey: string | null;  // File key for authorization document
  identityVerificationFileKey: string | null;  // File key for identity verification
  additionalEmails: string[];  // Additional email addresses to receive reports

  // Manual payment tracking (for admin-marked payments)
  manualPaymentMarkedBy: string | null;  // Admin user ID who marked as paid
  manualPaymentMarkedAt: Date | null;    // When the admin marked as paid
  manualPaymentReason: string | null;    // Reason for manual payment

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export class Screening {
  private constructor(private props: ScreeningProps) { }

  // Factory method for creating a new screening
  static create(
    serviceId: number,
    applicantName: string,
    applicantEmail: string,
    formData: Record<string, any>,
    userId: string | null = null,
    applicantPhone: string | null = null,
    adminUserId: string | null = null,
    advisorId: number | null = null,
    // New optional parameters for applicant details
    applicantPersonType: PersonType | null = null,
    applicantLegalRepresentative: string | null = null,
    applicantRFC: RFC | null = null,
    applicantAddress: Address | null = null
  ): Screening {
    // Business rule: Applicant name is required
    if (!applicantName || applicantName.trim().length === 0) {
      throw new Error('Applicant name is required');
    }

    // Business rule: Applicant email must be valid
    if (!Screening.isValidEmail(applicantEmail)) {
      throw new Error('Invalid applicant email format');
    }

    // Business rule: Service ID is required
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    // Business rule: Validate applicant details consistency
    if (applicantPersonType === PersonType.MORAL) {
      // Legal representative required for PM (Persona Moral)
      if (!applicantLegalRepresentative || applicantLegalRepresentative.trim().length === 0) {
        throw new Error('Legal representative is required for Persona Moral');
      }
    } else if (applicantPersonType === PersonType.PHYSICAL) {
      // Legal representative not allowed for PFAE (Persona Física)
      if (applicantLegalRepresentative) {
        throw new Error('Legal representative only valid for Persona Moral');
      }
    }

    // Generate unique client reference ID for tracking
    const clientReferenceId = `PRECA_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    return new Screening({
      id: crypto.randomUUID(),
      userId,
      serviceId,
      advisorId,
      status: ScreeningStatus.PENDING_PAYMENT,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.toLowerCase().trim(),
      applicantPhone: applicantPhone?.trim() || null,
      applicantPersonType,
      applicantLegalRepresentative: applicantLegalRepresentative?.trim() || null,
      applicantRFC,
      applicantAddress,
      formData,
      reportData: null,
      stripeSessionId: null,
      clientReferenceId,
      paymentLinkUrl: null,
      paymentAmount: null,
      paymentCompletedAt: null,
      isIdentityVerified: false,
      verificationCompletedAt: null,
      weeTrustDocumentId: null,
      authorizationDocumentUrl: null,
      authorizationSignedAt: null,
      identityVerificationId: null,
      identityVerificationUrl: null,
      identityVerifiedAt: null,
      identityVerificationData: null,
      adminUserId,
      adminNotes: null,
      reportUrl: null,
      reportUrls: [],
      reportFileKeys: [],
      authorizationDocumentFileKey: null,
      identityVerificationFileKey: null,
      additionalEmails: [],
      manualPaymentMarkedBy: null,
      manualPaymentMarkedAt: null,
      manualPaymentReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    });
  }

  // Factory method for reconstituting from database
  static reconstitute(props: ScreeningProps): Screening {
    return new Screening(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get userId(): string | null { return this.props.userId; }
  get serviceId(): number { return this.props.serviceId; }
  get advisorId(): number | null { return this.props.advisorId; }
  get status(): ScreeningStatus { return this.props.status; }
  get applicantName(): string { return this.props.applicantName; }
  get applicantEmail(): string { return this.props.applicantEmail; }
  get applicantPhone(): string | null { return this.props.applicantPhone; }
  get applicantPersonType(): PersonType | null { return this.props.applicantPersonType; }
  get applicantLegalRepresentative(): string | null { return this.props.applicantLegalRepresentative; }
  get applicantRFC(): RFC | null { return this.props.applicantRFC; }
  get applicantAddress(): Address | null { return this.props.applicantAddress; }
  get formData(): Record<string, any> { return { ...this.props.formData }; }
  get reportData(): Record<string, any> | null { return this.props.reportData ? { ...this.props.reportData } : null; }
  get stripeSessionId(): string | null { return this.props.stripeSessionId; }
  get clientReferenceId(): string | null { return this.props.clientReferenceId; }
  get paymentLinkUrl(): string | null { return this.props.paymentLinkUrl; }
  get paymentAmount(): number | null { return this.props.paymentAmount; }
  get paymentCompletedAt(): Date | null { return this.props.paymentCompletedAt; }
  get isIdentityVerified(): boolean { return this.props.isIdentityVerified; }
  get verificationCompletedAt(): Date | null { return this.props.verificationCompletedAt; }
  get weeTrustDocumentId(): string | null { return this.props.weeTrustDocumentId; }
  get authorizationDocumentUrl(): string | null { return this.props.authorizationDocumentUrl; }
  get authorizationSignedAt(): Date | null { return this.props.authorizationSignedAt; }
  get identityVerificationId(): string | null { return this.props.identityVerificationId; }
  get identityVerificationUrl(): string | null { return this.props.identityVerificationUrl; }
  get identityVerifiedAt(): Date | null { return this.props.identityVerifiedAt; }
  get identityVerificationData(): Record<string, any> | null { return this.props.identityVerificationData; }
  get adminUserId(): string | null { return this.props.adminUserId; }
  get adminNotes(): string | null { return this.props.adminNotes; }
  get reportUrl(): string | null { return this.props.reportUrl; }
  get reportUrls(): string[] { return [...this.props.reportUrls]; }
  get reportFileKeys(): string[] { return [...this.props.reportFileKeys]; }
  get authorizationDocumentFileKey(): string | null { return this.props.authorizationDocumentFileKey; }
  get identityVerificationFileKey(): string | null { return this.props.identityVerificationFileKey; }
  get additionalEmails(): string[] { return [...this.props.additionalEmails]; }
  get manualPaymentMarkedBy(): string | null { return this.props.manualPaymentMarkedBy; }
  get manualPaymentMarkedAt(): Date | null { return this.props.manualPaymentMarkedAt; }
  get manualPaymentReason(): string | null { return this.props.manualPaymentReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get completedAt(): Date | null { return this.props.completedAt; }

  // Business methods - Payment workflow
  assignFolio(folio: string): void {
    if (!folio || folio.trim().length === 0) {
      throw new Error('Folio is required');
    }
    this.props.clientReferenceId = folio;
    this.props.updatedAt = new Date();
  }

  setPaymentLink(paymentLinkUrl: string): void {
    // Business rule: Can only set payment link if pending payment
    if (this.props.status !== ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Can only set payment link for pending screenings');
    }

    if (!paymentLinkUrl || paymentLinkUrl.trim().length === 0) {
      throw new Error('Payment link URL is required');
    }

    this.props.paymentLinkUrl = paymentLinkUrl.trim();
    this.props.updatedAt = new Date();
  }

  markAsPaid(stripeSessionId: string, paymentAmount: number): void {
    // Business rule: Can only mark as paid if pending payment
    if (this.props.status !== ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Can only mark pending screenings as paid');
    }

    // Business rule: Payment amount must be positive
    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    this.props.stripeSessionId = stripeSessionId;
    this.props.paymentAmount = paymentAmount;
    this.props.paymentCompletedAt = new Date();
    this.props.status = ScreeningStatus.PAID;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark a screening as paid manually by an admin
   * Used for alternative payment methods or exceptional cases
   */
  markAsPaidManually(adminUserId: string, paymentAmount: number, reason: string): void {
    // Business rule: Can only mark as paid if pending payment
    if (this.props.status !== ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Solo se pueden marcar como pagadas las solicitudes pendientes de pago');
    }

    // Business rule: Payment amount must be positive
    if (paymentAmount <= 0) {
      throw new Error('El monto del pago debe ser mayor a cero');
    }

    // Business rule: Admin user ID is required
    if (!adminUserId || adminUserId.trim().length === 0) {
      throw new Error('Se requiere el ID del administrador');
    }

    // Business rule: Reason is required
    if (!reason || reason.trim().length === 0) {
      throw new Error('Se requiere una razón para marcar el pago manualmente');
    }

    // Generate a manual reference ID
    const manualReferenceId = `MANUAL_${Date.now()}_${adminUserId.substring(0, 8)}`;

    this.props.stripeSessionId = manualReferenceId;
    this.props.paymentAmount = paymentAmount;
    this.props.paymentCompletedAt = new Date();
    this.props.status = ScreeningStatus.PAID;
    this.props.manualPaymentMarkedBy = adminUserId;
    this.props.manualPaymentMarkedAt = new Date();
    this.props.manualPaymentReason = reason.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if this screening was manually marked as paid
   */
  isManuallyMarkedAsPaid(): boolean {
    return this.props.manualPaymentMarkedBy !== null && this.props.manualPaymentMarkedAt !== null;
  }

  // Business methods - Verification workflow
  markAsVerified(): void {
    // Business rule: Must be paid before verification
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot verify unpaid screening');
    }

    this.props.isIdentityVerified = true;
    this.props.verificationCompletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  // Business methods - Authorization document workflow
  setWeeTrustDocument(documentId: string): void {
    // Business rule: Can only set document if paid
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot set authorization document for unpaid screening');
    }

    if (!documentId || documentId.trim().length === 0) {
      throw new Error('Document ID is required');
    }

    this.props.weeTrustDocumentId = documentId.trim();
    this.props.updatedAt = new Date();
  }

  markAuthorizationSigned(documentUrl: string): void {
    // Business rule: Must be paid
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot mark authorization signed for unpaid screening');
    }

    // Business rule: Document URL is required
    if (!documentUrl || documentUrl.trim().length === 0) {
      throw new Error('Document URL is required');
    }

    // Business rule: Must have Wee Trust document ID
    if (!this.props.weeTrustDocumentId) {
      throw new Error('Wee Trust document ID must be set first');
    }

    this.props.authorizationDocumentUrl = documentUrl.trim();
    this.props.authorizationSignedAt = new Date();
    this.props.isIdentityVerified = true;
    this.props.verificationCompletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  hasSignedAuthorization(): boolean {
    return !!this.props.authorizationSignedAt && !!this.props.authorizationDocumentUrl;
  }

  // Business methods - Identity verification workflow
  setIdentityVerification(validationId: string, verificationUrl: string): void {
    // Business rule: Can only set identity verification if paid
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot set identity verification for unpaid screening');
    }

    if (!validationId || validationId.trim().length === 0) {
      throw new Error('Identity verification ID is required');
    }

    if (!verificationUrl || verificationUrl.trim().length === 0) {
      throw new Error('Identity verification URL is required');
    }

    this.props.identityVerificationId = validationId.trim();
    this.props.identityVerificationUrl = verificationUrl.trim();
    this.props.updatedAt = new Date();
  }

  markIdentityVerified(verificationData: Record<string, any>): void {
    // Business rule: Must have verification ID set first
    if (!this.props.identityVerificationId) {
      throw new Error('Identity verification ID must be set first');
    }

    this.props.identityVerifiedAt = new Date();
    this.props.identityVerificationData = verificationData;
    this.props.isIdentityVerified = true;
    this.props.verificationCompletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  hasIdentityVerification(): boolean {
    return !!this.props.identityVerifiedAt && !!this.props.identityVerificationData;
  }

  // Business method - Reset authorization document for retry
  resetAuthorizationDocument(): void {
    // Business rule: Can only reset if screening is paid
    if (this.props.status !== ScreeningStatus.PAID) {
      throw new Error('Can only reset authorization for paid screenings');
    }

    // Reset document-related fields to allow retry
    this.props.weeTrustDocumentId = null;
    this.props.authorizationDocumentUrl = null;
    this.props.authorizationSignedAt = null;

    // Also reset identity verification since it's embedded in the document
    this.props.identityVerificationId = null;
    this.props.identityVerificationUrl = null;
    this.props.identityVerifiedAt = null;
    this.props.identityVerificationData = null;
    this.props.isIdentityVerified = false;

    this.props.updatedAt = new Date();
  }

  // Helper to get extracted CURP from verification data
  getExtractedCURP(): string | null {
    return this.props.identityVerificationData?.results?.ocr?.curp || null;
  }

  // Helper to get extracted full name from verification data
  getExtractedName(): string | null {
    return this.props.identityVerificationData?.results?.ocr?.name?.fullName || null;
  }

  // Helper to get extracted address from verification data
  getExtractedAddress(): string | null {
    return this.props.identityVerificationData?.results?.ocr?.address || null;
  }

  // Business methods - Admin workflow
  startProcessing(adminUserId: string): void {
    // Business rule: Must be paid and verified
    if (this.props.status !== ScreeningStatus.PAID) {
      throw new Error('Can only process paid screenings');
    }

    if (!this.props.isIdentityVerified) {
      throw new Error('Cannot process unverified screening');
    }

    this.props.adminUserId = adminUserId;
    this.props.status = ScreeningStatus.PROCESSING_BUREAU;
    this.props.updatedAt = new Date();
  }

  addAdminNotes(notes: string, adminUserId: string): void {
    // Business rule: Only processing or completed screenings can have notes
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot add notes to unpaid screening');
    }

    // Business rule: If already assigned, must be same admin
    if (this.props.adminUserId && this.props.adminUserId !== adminUserId) {
      throw new Error('Only assigned admin can add notes');
    }

    this.props.adminNotes = notes;
    this.props.adminUserId = adminUserId;
    this.props.updatedAt = new Date();
  }

  setReportUrl(reportUrl: string): void {
    // Business rule: Must be paid or processing
    if (!this.isPaid()) {
      throw new Error('Cannot set report URL for unpaid screening');
    }

    // Business rule: Report URL is required
    if (!reportUrl || reportUrl.trim().length === 0) {
      throw new Error('Report URL is required');
    }

    this.props.reportUrl = reportUrl.trim();
    this.props.updatedAt = new Date();
  }

  addReportUrl(reportUrl: string): void {
    // Business rule: Must be paid or processing
    if (!this.isPaid()) {
      throw new Error('Cannot add report URL for unpaid screening');
    }

    // Business rule: Must have signed authorization
    if (!this.hasSignedAuthorization()) {
      throw new Error('Cannot add report URL without signed authorization');
    }

    // Business rule: Report URL is required
    if (!reportUrl || reportUrl.trim().length === 0) {
      throw new Error('Report URL is required');
    }

    // Add to array if not already present
    const trimmedUrl = reportUrl.trim();
    if (!this.props.reportUrls.includes(trimmedUrl)) {
      this.props.reportUrls.push(trimmedUrl);
    }

    // Also update reportUrl for backward compatibility (use first URL)
    if (this.props.reportUrls.length > 0) {
      this.props.reportUrl = this.props.reportUrls[0];
    }

    this.props.updatedAt = new Date();
  }

  addReportFileKey(fileKey: string): void {
    // Business rule: Must be paid or processing
    if (!this.isPaid()) {
      throw new Error('Cannot add report file key for unpaid screening');
    }

    // Business rule: Must have signed authorization
    if (!this.hasSignedAuthorization()) {
      throw new Error('Cannot add report file key without signed authorization');
    }

    // Business rule: File key is required
    if (!fileKey || fileKey.trim().length === 0) {
      throw new Error('File key is required');
    }

    // Add to array if not already present
    const trimmedKey = fileKey.trim();
    if (!this.props.reportFileKeys.includes(trimmedKey)) {
      this.props.reportFileKeys.push(trimmedKey);
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Remove a report by its file key
   * This removes both the file key and the corresponding URL
   */
  removeReport(fileKey: string): boolean {
    if (!fileKey || fileKey.trim().length === 0) {
      return false;
    }

    const trimmedKey = fileKey.trim();
    const keyIndex = this.props.reportFileKeys.indexOf(trimmedKey);

    if (keyIndex === -1) {
      return false; // Report not found
    }

    // Remove file key
    this.props.reportFileKeys.splice(keyIndex, 1);

    // Remove corresponding URL (they should be at the same index)
    if (this.props.reportUrls.length > keyIndex) {
      this.props.reportUrls.splice(keyIndex, 1);
    }

    // Update main reportUrl (use first URL or null)
    this.props.reportUrl = this.props.reportUrls.length > 0
      ? this.props.reportUrls[0]
      : null;

    this.props.updatedAt = new Date();
    return true;
  }

  /**
   * Get report count
   */
  getReportCount(): number {
    return this.props.reportFileKeys.length;
  }

  setAuthorizationDocumentFileKey(fileKey: string): void {
    // Business rule: Must be paid
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot set authorization document file key for unpaid screening');
    }

    if (!fileKey || fileKey.trim().length === 0) {
      throw new Error('File key is required');
    }

    this.props.authorizationDocumentFileKey = fileKey.trim();
    this.props.updatedAt = new Date();
  }

  setIdentityVerificationFileKey(fileKey: string): void {
    // Business rule: Can only set identity verification file key if paid
    if (this.props.status === ScreeningStatus.PENDING_PAYMENT) {
      throw new Error('Cannot set identity verification file key for unpaid screening');
    }

    if (!fileKey || fileKey.trim().length === 0) {
      throw new Error('File key is required');
    }

    this.props.identityVerificationFileKey = fileKey.trim();
    this.props.updatedAt = new Date();
  }

  // Business methods - Additional email recipients management
  addAdditionalEmail(email: string): void {
    // Validate email format
    if (!email || email.trim().length === 0) {
      throw new Error('Email address is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!Screening.isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicates (case-insensitive)
    if (this.props.additionalEmails.some(e => e.toLowerCase() === normalizedEmail)) {
      throw new Error('Email already exists in additional emails list');
    }

    // Prevent adding applicant's own email
    if (normalizedEmail === this.props.applicantEmail.toLowerCase()) {
      throw new Error('Cannot add applicant email to additional emails');
    }

    this.props.additionalEmails.push(normalizedEmail);
    this.props.updatedAt = new Date();
  }

  removeAdditionalEmail(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();

    const index = this.props.additionalEmails.findIndex(
      e => e.toLowerCase() === normalizedEmail
    );

    if (index === -1) {
      throw new Error('Email not found in additional emails list');
    }

    this.props.additionalEmails.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  getAdditionalEmails(): string[] {
    return [...this.props.additionalEmails];
  }

  hasAdditionalEmail(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    return this.props.additionalEmails.some(e => e.toLowerCase() === normalizedEmail);
  }

  // Business methods - Report data for dynamic PDF generation
  setReportData(data: Record<string, any>): void {
    // Business rule: Must be paid before setting report data
    if (!this.isPaid()) {
      throw new Error('Cannot set report data for unpaid screening');
    }

    // Business rule: Must have signed authorization
    if (!this.hasSignedAuthorization()) {
      throw new Error('Cannot set report data without signed authorization');
    }

    // Business rule: Data cannot be empty
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Report data cannot be empty');
    }

    this.props.reportData = { ...data };
    this.props.updatedAt = new Date();
  }

  hasReportData(): boolean {
    return this.props.reportData !== null && Object.keys(this.props.reportData).length > 0;
  }

  clearReportData(): void {
    this.props.reportData = null;
    this.props.updatedAt = new Date();
  }

  complete(reportUrl: string, adminUserId: string): void {
    // Business rule: Must be in processing state
    if (this.props.status !== ScreeningStatus.PROCESSING_BUREAU) {
      throw new Error('Can only complete screenings that are being processed');
    }

    // Business rule: Report URL is required
    if (!reportUrl || reportUrl.trim().length === 0) {
      throw new Error('Report URL is required to complete screening');
    }

    // Business rule: Must be same admin who started processing
    if (this.props.adminUserId !== adminUserId) {
      throw new Error('Only assigned admin can complete screening');
    }

    this.props.reportUrl = reportUrl.trim();
    this.props.status = ScreeningStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(reason: string, adminUserId: string): void {
    // Business rule: Cannot reject completed screenings
    if (this.props.status === ScreeningStatus.COMPLETED) {
      throw new Error('Cannot reject completed screening');
    }

    this.props.adminNotes = reason;
    this.props.adminUserId = adminUserId;
    this.props.status = ScreeningStatus.REJECTED;
    this.props.updatedAt = new Date();
  }

  // Status checks
  isPending(): boolean {
    return this.props.status === ScreeningStatus.PENDING_PAYMENT;
  }

  isPaid(): boolean {
    return this.props.paymentCompletedAt !== null;
  }

  isProcessing(): boolean {
    return this.props.status === ScreeningStatus.PROCESSING_BUREAU;
  }

  isCompleted(): boolean {
    return this.props.status === ScreeningStatus.COMPLETED;
  }

  isRejected(): boolean {
    return this.props.status === ScreeningStatus.REJECTED;
  }

  isReadyForProcessing(): boolean {
    // Ready for processing means: paid AND has signed authorization
    return this.props.status === ScreeningStatus.PAID && this.hasSignedAuthorization();
  }

  isFullyVerified(): boolean {
    // Fully verified means: paid AND has signed authorization AND identity verified
    return this.isPaid() && this.hasSignedAuthorization() && this.hasIdentityVerification();
  }

  // Business methods - Applicant details
  hasApplicantDetails(): boolean {
    return this.props.applicantPersonType !== null &&
      this.props.applicantRFC !== null &&
      this.props.applicantAddress !== null;
  }

  isPersonaMoral(): boolean {
    return this.props.applicantPersonType === PersonType.MORAL;
  }

  isPersonaFisica(): boolean {
    return this.props.applicantPersonType === PersonType.PHYSICAL;
  }

  // Helper to get display type for PDFs/UI (PFAE/PM)
  getPersonTypeDisplay(): 'PFAE' | 'PM' | null {
    if (!this.props.applicantPersonType) return null;
    return this.props.applicantPersonType === PersonType.MORAL ? 'PM' : 'PFAE';
  }

  updateApplicantDetails(
    personType: PersonType,
    rfc: RFC,
    address: Address,
    legalRepresentative: string | null = null
  ): void {
    // Business rule: Legal rep only for PM
    if (legalRepresentative && personType !== PersonType.MORAL) {
      throw new Error('Legal representative only valid for Persona Moral');
    }

    // Business rule: Legal rep required for PM
    if (personType === PersonType.MORAL && !legalRepresentative) {
      throw new Error('Legal representative is required for Persona Moral');
    }

    this.props.applicantPersonType = personType;
    this.props.applicantRFC = rfc;
    this.props.applicantAddress = address;
    this.props.applicantLegalRepresentative = legalRepresentative?.trim() || null;
    this.props.updatedAt = new Date();
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to plain object (for serialization)
  toObject(): ScreeningProps {
    return {
      ...this.props,
      formData: { ...this.props.formData },
      reportData: this.props.reportData ? { ...this.props.reportData } : null
    };
  }
}
