/**
 * Domain Layer - File Storage Errors
 *
 * Custom errors for file storage operations
 */

export class FileStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileStorageError';
  }
}

export class FileNotFoundError extends FileStorageError {
  constructor(fileKey: string, cause?: Error) {
    super(`File not found: ${fileKey}`, cause);
    this.name = 'FileNotFoundError';
  }
}

export class FileUploadError extends FileStorageError {
  constructor(fileName: string, cause?: Error) {
    super(`Failed to upload file: ${fileName}`, cause);
    this.name = 'FileUploadError';
  }
}

export class FileDeleteError extends FileStorageError {
  constructor(fileKey: string, cause?: Error) {
    super(`Failed to delete file: ${fileKey}`, cause);
    this.name = 'FileDeleteError';
  }
}

export class InvalidFileTypeError extends FileStorageError {
  constructor(fileName: string, allowedTypes: string[]) {
    super(`Invalid file type for ${fileName}. Allowed types: ${allowedTypes.join(', ')}`);
    this.name = 'InvalidFileTypeError';
  }
}

export class FileSizeExceededError extends FileStorageError {
  constructor(fileName: string, size: number, maxSize: number) {
    super(`File ${fileName} size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
    this.name = 'FileSizeExceededError';
  }
}
