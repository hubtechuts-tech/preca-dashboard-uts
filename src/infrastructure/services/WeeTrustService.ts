/**
 * Infrastructure Layer - Wee Trust Service Implementation
 *
 * Implements IWeeTrustService for authorization document signing
 * Integrates with Wee Trust API for Buró de Crédito authorization workflow
 */

import * as FormDataPkg from 'form-data';
import axios from 'axios';

// Handle both CommonJS and ESM exports
const FormData = (FormDataPkg as any).default || FormDataPkg;
import {
  IWeeTrustService,
  SignerInfo,
  DocumentStatus,
  CreateDocumentResult,
  SendDocumentResult,
  IdentityVerificationRequest,
  IdentityVerificationResult,
  IdentityVerificationStatus,
  IdentityVerificationResults
} from '../../domain/interfaces/services/IWeeTrustService';

export class WeeTrustService implements IWeeTrustService {
  private readonly baseUrl: string;
  private readonly userId: string;
  private readonly apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    baseUrl: string = process.env.WEETRUST_BASE_URL || 'https://api-sandbox.weetrust.com.mx/',
    userId: string = process.env.WEETRUST_USER_ID || '',
    apiKey: string = process.env.WEETRUST_API_KEY || ''
  ) {
    // Ensure baseUrl ends with /
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.userId = userId;
    this.apiKey = apiKey;

    if (!this.userId || !this.apiKey) {
      throw new Error('Wee Trust credentials not configured. Set WEETRUST_USER_ID and WEETRUST_API_KEY.');
    }
  }

  /**
   * Get access token (auto-refresh if expired)
   * Tokens expire in 5 minutes
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new token
    const url = `${this.baseUrl}access/token`;

    console.log('[WeeTrustService] Requesting new access token...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'user-id': this.userId,
        'api-key': this.apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Wee Trust access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData?.accessToken) {
      throw new Error('Invalid response from Wee Trust authentication');
    }

    this.accessToken = data.responseData.accessToken;
    // Token expires in 5 minutes, we'll refresh at 4 minutes to be safe
    this.tokenExpiry = Date.now() + (4 * 60 * 1000);

    console.log('[WeeTrustService] Access token obtained successfully');

    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  /**
   * Upload document to Wee Trust
   * @param fileBuffer - PDF file buffer
   * @param fileName - File name
   */
  async createDocument(fileBuffer: Buffer, fileName: string): Promise<CreateDocumentResult> {
    const startTime = Date.now();
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}documents`;

    // Log detailed request information
    console.log(`[WeeTrustService] ========================================`);
    console.log(`[WeeTrustService] Starting document upload`);
    console.log(`[WeeTrustService] File: ${fileName}`);
    console.log(`[WeeTrustService] File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`[WeeTrustService] URL: ${url}`);
    console.log(`[WeeTrustService] User ID: ${this.userId}`);
    console.log(`[WeeTrustService] Timestamp: ${new Date().toISOString()}`);

    // Create FormData with file as multipart/form-data using form-data package
    // Node.js native fetch does NOT work with form-data streams - use axios
    const formData = new FormData();
    formData.append('document', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    console.log(`[WeeTrustService] Document prepared as multipart/form-data`);
    console.log(`[WeeTrustService] Starting HTTP request...`);

    try {
      const response = await axios.post(url, formData, {
        headers: {
          'token': token,
          'user-id': this.userId,
          // Add proper multipart headers with boundary from form-data
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000 // 30 second timeout
      });

      const elapsed = Date.now() - startTime;
      console.log(`[WeeTrustService] Response received after ${elapsed}ms`);
      console.log(`[WeeTrustService] Status: ${response.status} ${response.statusText}`);

      const data = response.data;

      if (!data.success || !data.responseData?.documentID) {
        console.error(`[WeeTrustService] ❌ Invalid response structure`);
        console.error(`[WeeTrustService] Response:`, JSON.stringify(data, null, 2));
        throw new Error('Invalid response from Wee Trust document upload');
      }

      const totalTime = Date.now() - startTime;
      console.log(`[WeeTrustService] ✅ Document uploaded successfully`);
      console.log(`[WeeTrustService] Document ID: ${data.responseData.documentID}`);
      console.log(`[WeeTrustService] Total time: ${totalTime}ms`);
      console.log(`[WeeTrustService] ========================================`);

      return {
        documentId: data.responseData.documentID,
        status: data.responseData.status,
        documentUrl: data.responseData.documentFileObj?.url || ''
      };

    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[WeeTrustService] ❌ Exception during upload`);
      console.error(`[WeeTrustService] Time before error: ${elapsed}ms`);

      // Handle axios errors
      if (axios.isAxiosError(error)) {
        console.error(`[WeeTrustService] Axios error: ${error.message}`);
        console.error(`[WeeTrustService] Status: ${error.response?.status || 'N/A'}`);
        console.error(`[WeeTrustService] Response:`, error.response?.data || 'No response data');

        const statusText = error.response?.status || 'Network Error';
        const errorData = typeof error.response?.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response?.data || {});

        throw new Error(`Failed to upload document to Wee Trust: ${statusText} ${errorData}`);
      }

      // Handle other errors
      console.error(`[WeeTrustService] Error type: ${error instanceof Error ? error.name : typeof error}`);
      console.error(`[WeeTrustService] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[WeeTrustService] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
      console.error(`[WeeTrustService] ========================================`);
      throw error;
    }
  }

  /**
   * Send document to signers
   */
  async sendDocumentToSign(
    documentId: string,
    signers: SignerInfo[],
    title: string,
    message: string
  ): Promise<SendDocumentResult> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}documents/signatory`;

    console.log(`[WeeTrustService] Sending document ${documentId} to ${signers.length} signer(s)`);

    // Map signers to Wee Trust format
    const signatoryList = signers.map((signer, index) => ({
      emailID: signer.email,
      name: signer.name,
      identification: signer.identification || 'face',
      check: signer.check !== undefined ? signer.check : false,
      order: signer.order !== undefined ? signer.order : index + 1
    }));

    const requestBody = {
      documentID: documentId,
      message,
      title,
      hasOrder: false, // Signers can sign in any order
      disableMailing: false, // Send email notifications
      signatory: signatoryList
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'token': token,
        'user-id': this.userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send document to sign: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData) {
      throw new Error('Invalid response from Wee Trust send to sign');
    }

    console.log(`[WeeTrustService] Document sent to sign successfully`);

    // Map response to our format
    const responseData = data.responseData;
    const signatory = responseData.signatory?.map((s: any) => ({
      emailID: s.emailID,
      name: s.name,
      signatoryID: s.signatoryID,
      signingUrl: s.signing?.url,
      signingExpiry: s.signing?.expiry
    })) || [];

    return {
      documentId: responseData.documentID,
      status: responseData.status,
      signatory
    };
  }

  /**
   * Set fixed signature position on document
   * This positions where the user's signature will appear on the PDF
   */
  async setFixedSignaturePosition(
    documentId: string,
    signerEmail: string,
    coordinates: {
      x: number;
      y: number;
      page?: number;
    }
  ): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}documents/fixed-signatory`;

    console.log(`[WeeTrustService] Setting fixed signature position for document ${documentId}`);

    const requestBody = {
      documentID: documentId,
      staticSignPositions: [
        {
          user: {
            email: signerEmail
          },
          coordinates: {
            x: coordinates.x,
            y: coordinates.y
          },
          page: coordinates.page || 1,
          pageY: coordinates.y,
          pageYv2: coordinates.y,
          color: '#FFD247',
          imageSize: {
            width: 101,
            height: 51
          },
          parentImageSize: {
            width: 612,
            height: 792
          },
          viewport: {
            width: 612,
            height: 792
          }
        }
      ]
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'token': token,
        'user-id': this.userId
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set fixed signature position: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to set fixed signature position');
    }

    console.log(`[WeeTrustService] Fixed signature position set successfully`);
  }

  /**
   * Get document status
   */
  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}documents/${documentId}`;

    console.log(`[WeeTrustService] Getting document status: ${documentId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': token,
        'user-id': this.userId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get document status: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData) {
      throw new Error('Invalid response from Wee Trust get document status');
    }

    const doc = data.responseData;

    return {
      documentId: doc.documentID,
      status: doc.status,
      signatory: doc.signatory || [],
      documentFileObj: doc.documentFileObj
    };
  }

  // ========================================
  // Identity Verification Methods
  // ========================================

  /**
   * Request identity verification (INE + biometric)
   * Wee Trust sends verification URL to user's email automatically
   */
  async requestIdentityVerification(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}identity/validation/request`;

    console.log(`[WeeTrustService] Requesting identity verification for ${request.email}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'token': token,
        'user-id': this.userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: request.email,
        type: request.type,
        backgroundCheck: request.backgroundCheck
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Identity verification request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData?.validationId) {
      throw new Error('Invalid response from Wee Trust identity verification request');
    }

    console.log(`[WeeTrustService] Identity verification requested successfully: ${data.responseData.validationId}`);

    return {
      url: data.responseData.url,
      validationId: data.responseData.validationId
    };
  }

  /**
   * Get identity verification status
   */
  async getIdentityVerificationStatus(
    validationId: string
  ): Promise<IdentityVerificationStatus> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}identity/validation/request/${validationId}`;

    console.log(`[WeeTrustService] Getting identity verification status: ${validationId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': token,
        'user-id': this.userId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get identity verification status: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData) {
      throw new Error('Invalid response from Wee Trust verification status');
    }

    console.log(`[WeeTrustService] Verification status: ${data.responseData.status}`);

    return data.responseData;
  }

  /**
   * Get identity verification results (OCR data, scores)
   */
  async getIdentityVerificationResults(
    sessionId: string
  ): Promise<IdentityVerificationResults> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}identity/session/results/${sessionId}`;

    console.log(`[WeeTrustService] Getting identity verification results: ${sessionId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': token,
        'user-id': this.userId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get identity verification results: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.responseData) {
      throw new Error('Invalid response from Wee Trust verification results');
    }

    console.log(`[WeeTrustService] Verification results retrieved successfully`);
    console.log(`[WeeTrustService] CURP: ${data.responseData.results?.ocr?.curp || 'N/A'}`);
    console.log(`[WeeTrustService] Name: ${data.responseData.results?.ocr?.name?.fullName || 'N/A'}`);

    return data.responseData;
  }
}
