/**
 * Domain Layer - Wee Trust Service Interface
 *
 * Contract for Wee Trust API integration (authorization document signing)
 * Used for Buró de Crédito authorization document workflow
 */

export interface SignerInfo {
  email: string;
  name: string;
  identification?: 'face' | 'none';
  check?: boolean;
  order?: number;
}

export interface DocumentStatus {
  documentId: string;
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'REJECTED';
  signatory: Array<{
    emailID: string;
    name: string;
    isSigned: number; // 0 = not signed, 1 = signed
    signatoryID: string;
    signing?: {
      url: string;
      expiry: number;
    };
    // Biometric verification fields (when identification: 'face' and check: true)
    identitySessionId?: string;  // Session ID to fetch identity verification results
    biometric?: any;  // Biometric log data
    hasBiometricDocument?: boolean;
    biometricApprovedByUser?: boolean;
    forceBiometric?: {
      forcedPhotoID: boolean;
      forcedID: boolean;
      forcedFaceID: boolean;
      forcedBackgroundCheck: boolean;
      forcedFaceLogin?: boolean;
      forcedOcr?: boolean;
    };
  }>;
  documentFileObj?: {
    url: string;
    size: string;
  };
}

export interface CreateDocumentResult {
  documentId: string;
  status: string;
  documentUrl: string;
}

export interface SendDocumentResult {
  documentId: string;
  status: string;
  signatory: Array<{
    emailID: string;
    name: string;
    signatoryID: string;
    signingUrl?: string;
    signingExpiry?: number;
  }>;
}

export interface IdentityVerificationRequest {
  email: string;
  type: 'FACE' | 'DOCUMENT';
  backgroundCheck: boolean;
}

export interface IdentityVerificationResult {
  url: string;              // User visits this URL to upload ID + selfie
  validationId: string;     // Track this verification request
}

export interface IdentityVerificationStatus {
  userId: string;
  emailId: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  sessionId: string | null;     // Available after user completes verification
  customerId: string | null;     // For future face_login feature
  url: string;
  backgroundCheck: boolean;
}

export interface IdentityVerificationResults {
  results: {
    score: {
      overall: { value: number; status: string };
      idValidation: { overall: { value: number; status: string } };
      liveness: { overall: { value: number; status: string } };
      faceRecognition: { overall: { value: number; status: string } };
    };
    ocr: {
      name: {
        fullName: string;
        firstName: string;
        lastName: string;
        paternalLastName: string;
        maternalLastName: string;
      };
      address: string;
      addressFields: {
        street: string;
        colony: string;
        postalCode: string;
        city: string;
        state: string;
        stateCode: string;
      };
      typeOfId: string;
      birthDate: number;
      gender: string;
      claveDeElector: string;
      curp: string;
      cic: string;
      documentNumber: string;
      expirationDate: string;
      registrationDate: string;
      nationality: string;
    };
  };
  customerId: string;
}

export interface IWeeTrustService {
  /**
   * Authenticate with Wee Trust API and get access token
   * Token expires in 5 minutes
   */
  getAccessToken(): Promise<string>;

  /**
   * Upload PDF document to Wee Trust
   * @param fileBuffer - PDF file as Buffer
   * @param fileName - Name of the file
   * @returns Document ID and URL
   */
  createDocument(fileBuffer: Buffer, fileName: string): Promise<CreateDocumentResult>;

  /**
   * Send document to signers
   * @param documentId - Wee Trust document ID
   * @param signers - Array of signer information
   * @param title - Email subject/title
   * @param message - Email message body
   * @returns Document status with signing URLs
   */
  sendDocumentToSign(
    documentId: string,
    signers: SignerInfo[],
    title: string,
    message: string
  ): Promise<SendDocumentResult>;

  /**
   * Set fixed signature position on document
   * Positions where the user's signature will appear on the PDF
   * @param documentId - Wee Trust document ID
   * @param signerEmail - Email of the signer
   * @param coordinates - X, Y coordinates and page number
   */
  setFixedSignaturePosition(
    documentId: string,
    signerEmail: string,
    coordinates: {
      x: number;
      y: number;
      page?: number;
    }
  ): Promise<void>;

  /**
   * Get document status (check if signed)
   * @param documentId - Wee Trust document ID
   */
  getDocumentStatus(documentId: string): Promise<DocumentStatus>;

  // ========================================
  // Identity Verification Methods
  // ========================================

  /**
   * Request identity verification (INE + biometric)
   * Wee Trust sends verification URL to user's email
   *
   * @param request - Verification request with user email
   * @returns Verification URL and validation ID
   */
  requestIdentityVerification(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult>;

  /**
   * Get identity verification status
   *
   * @param validationId - Validation ID from request
   * @returns Current verification status
   */
  getIdentityVerificationStatus(
    validationId: string
  ): Promise<IdentityVerificationStatus>;

  /**
   * Get identity verification results (OCR data, scores)
   * Only available after verification is completed
   *
   * @param sessionId - Session ID from status response
   * @returns Detailed verification results with OCR data
   */
  getIdentityVerificationResults(
    sessionId: string
  ): Promise<IdentityVerificationResults>;
}
