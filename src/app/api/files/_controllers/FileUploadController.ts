/**
 * Presentation Layer - File Upload Controller
 *
 * Handles HTTP concerns for file upload operations
 */

import { UploadFileUseCase } from '@/application/use-cases/file/UploadFileUseCase';
import { UploadFileDTO, ValidationError } from '@/application/dto/file/UploadFileDTO';
import {
  InvalidFileTypeError,
  FileSizeExceededError,
  FileUploadError
} from '@/domain/errors/FileStorageErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class FileUploadController {
  constructor(private uploadFileUseCase: UploadFileUseCase) {}

  /**
   * Handle file upload from multipart/form-data
   */
  async upload(fileData: {
    fileBuffer: Buffer;
    fileName: string;
    contentType: string;
    size: number;
  }): Promise<ApiResponse> {
    try {
      // Validate with DTO
      const dto = new UploadFileDTO(fileData);

      // Execute use case
      const result = await this.uploadFileUseCase.execute(dto);

      // Construct short backend URL instead of presigned URL
      // This provides a clean, short URL that won't expire in the database
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shortFileUrl = `${baseUrl}/api/files/${result.fileKey}`;

      return {
        success: true,
        data: {
          fileUrl: shortFileUrl,  // Short backend URL
          fileKey: result.fileKey,
          fileName: result.fileName,
          contentType: result.contentType,
          size: result.size,
          uploadedAt: result.uploadedAt
        },
        statusCode: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('FileUploadController error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof InvalidFileTypeError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof FileSizeExceededError) {
      return { success: false, error: error.message, statusCode: 413 }; // Payload Too Large
    }

    if (error instanceof FileUploadError) {
      return { success: false, error: error.message, statusCode: 500 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
