/**
 * Application Layer - Upload File DTO
 *
 * Data Transfer Object for file upload validation
 */

import { InvalidFileTypeError, FileSizeExceededError } from '@/domain/errors/FileStorageErrors';

export class UploadFileDTO {
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
  size: number;

  constructor(data: {
    fileBuffer: Buffer;
    fileName: string;
    contentType: string;
    size: number;
  }) {
    this.fileBuffer = data.fileBuffer;
    this.fileName = data.fileName;
    this.contentType = data.contentType;
    this.size = data.size;

    this.validate();
  }

  private validate(): void {
    // Validate file buffer exists
    if (!this.fileBuffer || this.fileBuffer.length === 0) {
      throw new ValidationError('File buffer is empty');
    }

    // Validate file name
    if (!this.fileName || this.fileName.trim().length === 0) {
      throw new ValidationError('File name is required');
    }

    // Sanitize file name (remove special characters, keep extension)
    this.fileName = this.sanitizeFileName(this.fileName);

    // Validate content type
    if (!this.contentType) {
      throw new ValidationError('Content type is required');
    }

    // Validate file size (max 10MB for form uploads)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (this.size > MAX_FILE_SIZE) {
      throw new FileSizeExceededError(this.fileName, this.size, MAX_FILE_SIZE);
    }

    // Validate allowed file types
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!ALLOWED_TYPES.includes(this.contentType)) {
      throw new InvalidFileTypeError(this.fileName, ALLOWED_TYPES);
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Remove path separators and special characters
    let sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure file has an extension
    if (!sanitized.includes('.')) {
      const ext = this.getExtensionFromContentType(this.contentType);
      sanitized = `${sanitized}${ext}`;
    }

    return sanitized;
  }

  private getExtensionFromContentType(contentType: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };

    return typeMap[contentType] || '.bin';
  }
}

export class UploadFileResponseDTO {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;

  constructor(data: {
    fileUrl: string;
    fileKey: string;
    fileName: string;
    contentType: string;
    size: number;
    uploadedAt: Date;
  }) {
    this.fileUrl = data.fileUrl;
    this.fileKey = data.fileKey;
    this.fileName = data.fileName;
    this.contentType = data.contentType;
    this.size = data.size;
    this.uploadedAt = data.uploadedAt;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
