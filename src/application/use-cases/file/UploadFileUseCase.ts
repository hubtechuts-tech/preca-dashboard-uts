/**
 * Application Layer - Upload File Use Case
 *
 * Business logic for uploading files with validation and compression
 */

import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { UploadFileDTO, UploadFileResponseDTO } from '@/application/dto/file/UploadFileDTO';

export class UploadFileUseCase {
  constructor(private storageService: SupabaseStorageService) {}

  /**
   * Execute file upload with automatic image compression
   */
  async execute(dto: UploadFileDTO): Promise<UploadFileResponseDTO> {
    // Upload file using storage service with compression
    const result = await this.storageService.uploadFormFile(
      dto.fileBuffer,
      dto.fileName,
      dto.contentType,
      {
        compress: true,
        quality: 85 // Good balance between quality and file size
      }
    );

    // Return response DTO
    return new UploadFileResponseDTO({
      fileUrl: result.fileUrl,
      fileKey: result.fileKey,
      fileName: dto.fileName,
      contentType: result.contentType,
      size: result.size,
      uploadedAt: result.uploadedAt
    });
  }
}
