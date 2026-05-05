/**
 * Application Layer - Send Authorization Document Use Case
 *
 * Orchestrates the authorization document workflow:
 * 1. Upload authorization PDF to Wee Trust
 * 2. Send document to applicant for signature
 * 3. Update screening with Wee Trust document ID
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IWeeTrustService } from '../../../domain/interfaces/services/IWeeTrustService';
import { IPDFFillerService, PDFFieldData } from '../../../domain/interfaces/services/IPDFFillerService';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { Screening } from '../../../domain/entities/Screening';
import { promises as fs } from 'fs';
import path from 'path';

export interface SendAuthorizationDocumentDTO {
  screeningId: string;
}

export interface SendAuthorizationDocumentResult {
  success: boolean;
  documentId: string;
  signingUrl?: string;
  signingExpiry?: number;
  message: string;
}

export class SendAuthorizationDocumentUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private weeTrustService: IWeeTrustService,
    private pdfFillerService: IPDFFillerService,
    private serviceCatalogRepository: IServiceCatalogRepository,
    private authorizationDocumentPath?: string
  ) {
    // Default path to authorization document template
    this.authorizationDocumentPath = authorizationDocumentPath ||
      process.env.AUTHORIZATION_DOCUMENT_PATH ||
      path.join(process.cwd(), 'public', 'documents', 'Formato_Autorizacion.pdf');
  }

  async execute(dto: SendAuthorizationDocumentDTO): Promise<SendAuthorizationDocumentResult> {
    const { screeningId } = dto;

    // 1. Get screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // 2. Get service to determine person type
    const service = await this.serviceCatalogRepository.findById(screening.serviceId);
    if (!service) {
      throw new Error(`Service ${screening.serviceId} not found`);
    }

    // 3. Validate business rules
    if (!screening.isPaid()) {
      throw new Error('Cannot send authorization document for unpaid screening');
    }

    if (screening.weeTrustDocumentId) {
      throw new Error('Authorization document already sent for this screening');
    }

    // 4. Read authorization document template
    const templateBuffer = await this.readAuthorizationDocument();

    // 5. Fill PDF with user data
    console.log(`[SendAuthorizationDocumentUseCase] Filling PDF with user data for screening ${screeningId}`);
    console.log(`[SendAuthorizationDocumentUseCase] Service type: ${service.targetPersonType}`);

    const pdfData = this.extractPDFData(screening, service.targetPersonType);
    const filledDocumentBuffer = await this.pdfFillerService.fillAuthorizationDocument(
      templateBuffer,
      pdfData
    );

    console.log(`[SendAuthorizationDocumentUseCase] PDF filled successfully`);

    // 5. Upload filled document to Wee Trust
    const fileName = `autorizacion_${screening.applicantName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    console.log(`[SendAuthorizationDocumentUseCase] Uploading document for screening ${screeningId}`);

    const uploadResult = await this.weeTrustService.createDocument(filledDocumentBuffer, fileName);

    // 5. Set fixed signature position BEFORE sending (document must be in Draft status)
    console.log(`[SendAuthorizationDocumentUseCase] Setting fixed signature position`);

    try {
      await this.weeTrustService.setFixedSignaturePosition(
        uploadResult.documentId,
        screening.applicantEmail,
        {
          x: 251,
          y: 557,
          page: 1
        }
      );
      console.log(`[SendAuthorizationDocumentUseCase] Fixed signature position set successfully`);
    } catch (error) {
      console.error(`[SendAuthorizationDocumentUseCase] Failed to set signature position:`, error);
      // Don't fail the whole process if signature positioning fails
      // The user can still sign anywhere on the document
    }

    // 6. Send document to applicant for signature with identity verification
    const signers = [
      {
        email: screening.applicantEmail,
        name: screening.applicantName,
        identification: 'face' as const, // Biometric verification (INE + selfie)
        check: true // Enable identity verification and background check
      }
    ];

    const title = 'Autorización para Consulta de Buró de Crédito';
    const message = `Hola ${screening.applicantName}, te enviamos la carta de autorización para consultar tu historial crediticio en Buró de Crédito. Por favor firma el documento para continuar con tu solicitud.`;

    console.log(`[SendAuthorizationDocumentUseCase] Sending document to ${screening.applicantEmail}`);

    const sendResult = await this.weeTrustService.sendDocumentToSign(
      uploadResult.documentId,
      signers,
      title,
      message
    );

    // 6. Update screening with Wee Trust document ID
    screening.setWeeTrustDocument(uploadResult.documentId);
    await this.screeningRepository.save(screening);

    console.log(`[SendAuthorizationDocumentUseCase] Authorization document sent successfully`);

    // 7. Return result
    const signer = sendResult.signatory[0];

    return {
      success: true,
      documentId: uploadResult.documentId,
      signingUrl: signer?.signingUrl,
      signingExpiry: signer?.signingExpiry,
      message: `Authorization document sent to ${screening.applicantEmail}`
    };
  }

  /**
   * Extract PDF field data from screening
   * Tries dedicated columns first, falls back to formData for backward compatibility
   */
  private extractPDFData(screening: Screening, targetPersonType: string): PDFFieldData {
    const formData = screening.formData;

    // Determine person type: 'physical' => PFAE, 'moral' => PM
    const personType = targetPersonType === 'moral' ? 'PM' : 'PFAE';
    const isPersonaMoral = targetPersonType === 'moral';

    // Format date as DD/MM/YYYY
    const today = new Date();
    const date = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    // Try to use dedicated columns first, fallback to formData for backward compatibility
    const rfc = screening.applicantRFC?.getValue() ||
                (isPersonaMoral ? (formData.rfc || formData.RFC || '') : '');

    const legalRepresentative = screening.applicantLegalRepresentative ||
                                (isPersonaMoral ? (formData.legalRepresentative || formData.representante_legal || null) : null);

    const street = screening.applicantAddress?.street ||
                   (isPersonaMoral ? (formData.street || formData.calle || formData.direccion || '') : '');

    const colony = screening.applicantAddress?.colony ||
                   (isPersonaMoral ? (formData.colony || formData.colonia || '') : '');

    const municipality = screening.applicantAddress?.municipality ||
                         (isPersonaMoral ? (formData.municipality || formData.municipio || formData.ciudad || '') : '');

    const state = screening.applicantAddress?.state ||
                  (isPersonaMoral ? (formData.state || formData.estado || '') : '');

    const zipCode = screening.applicantAddress?.zipCode ||
                    (isPersonaMoral ? (formData.zipCode || formData.codigo_postal || formData.cp || '') : '');

    const phone = screening.applicantPhone ||
                  (isPersonaMoral ? (formData.phone || formData.telefono || '') : '');

    // Validate critical fields for Persona Moral with dedicated columns
    if (isPersonaMoral && screening.applicantPersonType) {
      const hasRFC = !!rfc;
      const hasAddress = !!(street && colony && municipality && state && zipCode);

      if (!hasRFC || !hasAddress) {
        console.warn(
          `[SendAuthorizationDocumentUseCase] WARNING: Screening ${screening.id} is missing applicant details ` +
          `(RFC: ${hasRFC}, Address: ${hasAddress}). PDF may be incomplete.`
        );
      }
    }

    return {
      personType,
      // Name is ALWAYS filled (from screening)
      applicantName: screening.applicantName,
      // Legal representative only for PM
      legalRepresentative,
      // RFC, address, phone ONLY for Persona Moral (PM)
      rfc,
      street,
      colony,
      municipality,
      state,
      zipCode,
      phone,
      date
    };
  }

  /**
   * Read authorization document template from filesystem
   */
  private async readAuthorizationDocument(): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(this.authorizationDocumentPath!);
      return buffer;
    } catch (error) {
      // If file doesn't exist, provide helpful error message
      if ((error as any).code === 'ENOENT') {
        throw new Error(
          `Authorization document template not found at: ${this.authorizationDocumentPath}. ` +
          `Please create the PDF template or set AUTHORIZATION_DOCUMENT_PATH environment variable.`
        );
      }
      throw error;
    }
  }
}
