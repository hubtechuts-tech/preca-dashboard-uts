/**
 * Domain Layer - File Storage Service Interface
 *
 * Contract for file storage operations (S3, local, etc.)
 * Used for storing Buró de Crédito reports
 */

export interface UploadFileOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadFileResult {
  fileKey: string;      // Unique identifier for the file
  fileUrl: string;      // Public or signed URL to access the file
  bucket: string;       // Storage bucket name
  size: number;         // File size in bytes
  contentType: string;  // MIME type
  uploadedAt: Date;     // Upload timestamp
}

export interface GetFileUrlOptions {
  expiresIn?: number;   // Expiration time in seconds (for signed URLs)
}

export interface IFileStorageService {
  /**
   * Upload a file to storage
   * @param fileBuffer - File content as Buffer
   * @param fileName - Name of the file
   * @param options - Upload options (content type, metadata, etc.)
   * @returns Upload result with file URL and metadata
   */
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options?: UploadFileOptions
  ): Promise<UploadFileResult>;

  /**
   * Download a file from storage
   * @param fileKey - Unique identifier of the file
   * @returns File content as Buffer
   */
  downloadFile(fileKey: string): Promise<Buffer>;

  /**
   * Get file URL (public or signed)
   * @param fileKey - Unique identifier of the file
   * @param options - URL options (expiration, etc.)
   * @returns File URL
   */
  getFileUrl(fileKey: string, options?: GetFileUrlOptions): Promise<string>;

  /**
   * Delete a file from storage
   * @param fileKey - Unique identifier of the file
   */
  deleteFile(fileKey: string): Promise<void>;

  /**
   * Check if file exists
   * @param fileKey - Unique identifier of the file
   * @returns True if file exists
   */
  fileExists(fileKey: string): Promise<boolean>;

  /**
   * Get file metadata
   * @param fileKey - Unique identifier of the file
   * @returns File metadata
   */
  getFileMetadata(fileKey: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>;
}
