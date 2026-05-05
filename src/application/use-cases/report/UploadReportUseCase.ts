/**
 * Application Layer - Upload Report Use Case
 *
 * Handles uploading Buró de Crédito reports for screenings
 * Business logic: Validates screening status, uploads file, updates screening
 */

import { IScreeningRepository } from '../../../domain/interfaces/repositories/IScreeningRepository';
import { IFileStorageService } from '../../../domain/interfaces/services/IFileStorageService';
import { InvalidFileTypeError, FileSizeExceededError } from '../../../domain/errors/FileStorageErrors';

export interface UploadReportDTO {
  screeningId: string;
  adminUserId: string;
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
}

export interface UploadReportResult {
  success: boolean;
  reportUrl: string;
  fileKey: string;
  message: string;
}

export class UploadReportUseCase {
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    private screeningRepository: IScreeningRepository,
    private fileStorageService: IFileStorageService
  ) {}

  async execute(dto: UploadReportDTO): Promise<UploadReportResult> {
    const { screeningId, adminUserId, fileBuffer, fileName, contentType } = dto;

    console.log(`[UploadReportUseCase] Uploading report for screening ${screeningId}`);

    // 1. Validate file type
    if (!UploadReportUseCase.ALLOWED_TYPES.includes(contentType)) {
      throw new InvalidFileTypeError(fileName, UploadReportUseCase.ALLOWED_TYPES);
    }

    // 2. Validate file size
    if (fileBuffer.length > UploadReportUseCase.MAX_FILE_SIZE) {
      throw new FileSizeExceededError(fileName, fileBuffer.length, UploadReportUseCase.MAX_FILE_SIZE);
    }

    // 3. Get screening
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening) {
      throw new Error(`Screening ${screeningId} not found`);
    }

    // 4. Validate business rules
    if (!screening.isPaid()) {
      throw new Error('Cannot upload report for unpaid screening');
    }

    if (!screening.hasSignedAuthorization()) {
      throw new Error('Cannot upload report without signed authorization');
    }

    // 5. Start processing if not already started
    if (screening.isPaid() && !screening.isProcessing() && !screening.isCompleted()) {
      screening.startProcessing(adminUserId);
      await this.screeningRepository.save(screening);
    }

    // 6. Upload file to storage
    const uploadResult = await this.fileStorageService.uploadFile(
      fileBuffer,
      fileName,
      {
        contentType,
        metadata: {
          screeningId,
          adminUserId,
          uploadedBy: 'admin',
          originalFileName: fileName
        },
        isPublic: false // Reports should be private
      }
    );

    console.log(`[UploadReportUseCase] File uploaded: ${uploadResult.fileUrl}`);

    // 7. Add report URL and file key to screening (accumulates multiple files)
    // This allows the report to be visible in the UI before marking as completed
    // We store the short backend URL (not the presigned URL) to avoid expiration issues
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortReportUrl = `${baseUrl}/api/files/${uploadResult.fileKey}`;

    screening.addReportUrl(shortReportUrl);  // Store short URL, not presigned URL
    screening.addReportFileKey(uploadResult.fileKey);
    await this.screeningRepository.save(screening);

    console.log(`[UploadReportUseCase] Report URL and file key added to screening ${screeningId}`);

    // Note: We don't mark as completed here - that's a separate action
    // This allows admins to upload multiple files before completing

    return {
      success: true,
      reportUrl: shortReportUrl,  // Return short URL
      fileKey: uploadResult.fileKey,
      message: 'Report uploaded successfully'
    };
  }
}
