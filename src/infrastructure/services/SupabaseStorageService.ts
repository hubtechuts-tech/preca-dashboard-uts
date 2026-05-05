/**
 * Infrastructure Layer - Cloudflare R2 Storage Service
 *
 * Implements IFileStorageService using Cloudflare R2 (S3-compatible storage)
 * Uses AWS SDK to interact with R2 storage endpoint
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
  HeadObjectCommandOutput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import {
  IFileStorageService,
  UploadFileOptions,
  UploadFileResult,
  GetFileUrlOptions
} from '../../domain/interfaces/services/IFileStorageService';
import {
  FileUploadError,
  FileNotFoundError,
  FileDeleteError,
  FileStorageError
} from '../../domain/errors/FileStorageErrors';

export class SupabaseStorageService implements IFileStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  private static instance: SupabaseStorageService;

  constructor(
    endpoint: string = process.env.R2_ENDPOINT || '',
    accessKeyId: string = process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: string = process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: string = process.env.R2_BUCKET || 'preca-files',
    accountId: string = process.env.R2_ACCOUNT_ID || ''
  ) {
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Cloudflare R2 configuration missing. Required: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
      );
    }

    this.bucket = bucket;

    // Cloudflare R2 public URL (if you have a custom domain configured)
    // For now, we'll use signed URLs which don't need public access
    this.publicUrl = endpoint;

    // Configure S3 client for Cloudflare R2
    this.s3Client = new S3Client({
      endpoint,
      region: 'auto', // Cloudflare R2 uses 'auto' for region
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: true, // Required for R2
    });

    console.log(`[CloudflareR2StorageService] Initialized with bucket: ${this.bucket}`);
    console.log(`[CloudflareR2StorageService] Endpoint: ${endpoint}`);
  }

  /**
   * Get Singleton instance
   */
  public static getInstance(): SupabaseStorageService {
    if (!SupabaseStorageService.instance) {
      SupabaseStorageService.instance = new SupabaseStorageService();
    }
    return SupabaseStorageService.instance;
  }

  /**
   * Upload file to Cloudflare R2 storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options?: UploadFileOptions
  ): Promise<UploadFileResult> {
    try {
      // Generate unique file key with timestamp prefix
      const timestamp = Date.now();
      const fileKey = `reports/${timestamp}-${fileName}`;

      console.log(`[CloudflareR2StorageService] Uploading file: ${fileKey}`);

      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: options?.contentType || 'application/pdf',
        Metadata: options?.metadata || {},
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Generate signed URL with 7 days expiration for confidential data
      // Reports contain sensitive credit information and should NOT be publicly accessible
      const fileUrl = await this.getFileUrl(fileKey, { expiresIn: 7 * 24 * 60 * 60 }); // 7 days

      console.log(`[CloudflareR2StorageService] File uploaded successfully: ${fileKey}`);
      console.log(`[CloudflareR2StorageService] Signed URL expires in 7 days`);

      return {
        fileKey,
        fileUrl,
        bucket: this.bucket,
        size: fileBuffer.length,
        contentType: options?.contentType || 'application/pdf',
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('[CloudflareR2StorageService] Upload error:', error);
      throw new FileUploadError(fileName, error as Error);
    }
  }

  /**
   * Upload form file with automatic image compression
   * Used for form uploads (ID cards, proof of address, etc.)
   */
  async uploadFormFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    options?: { compress?: boolean; quality?: number }
  ): Promise<UploadFileResult> {
    try {
      const timestamp = Date.now();
      const fileKey = `form-uploads/${timestamp}-${fileName}`;

      console.log(`[CloudflareR2StorageService] Uploading form file: ${fileKey}`);

      let processedBuffer = fileBuffer;
      let finalContentType = contentType;

      // Compress images automatically
      const isImage = contentType.startsWith('image/');
      const shouldCompress = options?.compress !== false && isImage;

      if (shouldCompress) {
        console.log(`[CloudflareR2StorageService] Compressing image: ${fileName}`);

        try {
          const quality = options?.quality || 85;

          // Convert to JPEG for maximum compatibility and compression
          processedBuffer = await sharp(fileBuffer)
            .resize(2048, 2048, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality, progressive: true })
            .toBuffer();

          finalContentType = 'image/jpeg';

          const originalSize = fileBuffer.length;
          const compressedSize = processedBuffer.length;
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

          console.log(`[CloudflareR2StorageService] Image compressed: ${originalSize} -> ${compressedSize} bytes (${savings}% reduction)`);
        } catch (compressionError) {
          console.error('[CloudflareR2StorageService] Compression failed, using original:', compressionError);
          processedBuffer = fileBuffer;
        }
      }

      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: fileKey,
        Body: processedBuffer,
        ContentType: finalContentType,
        Metadata: {
          originalFileName: fileName,
          uploadedAt: new Date().toISOString()
        }
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Generate signed URL with 7 days expiration for form files
      // Cloudflare R2 has a maximum limit of 7 days for presigned URLs
      const fileUrl = await this.getFileUrl(fileKey, { expiresIn: 7 * 24 * 60 * 60 }); // 7 days (max allowed)

      console.log(`[CloudflareR2StorageService] Form file uploaded successfully: ${fileKey}`);

      return {
        fileKey,
        fileUrl,
        bucket: this.bucket,
        size: processedBuffer.length,
        contentType: finalContentType,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('[CloudflareR2StorageService] Form file upload error:', error);
      throw new FileUploadError(fileName, error as Error);
    }
  }

  /**
   * Download file from Supabase storage
   */
  async downloadFile(fileKey: string): Promise<Buffer> {
    try {
      console.log(`[CloudflareR2StorageService] Downloading file: ${fileKey}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      console.log(`[CloudflareR2StorageService] File downloaded: ${buffer.length} bytes`);

      return buffer;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new FileNotFoundError(fileKey, error);
      }
      console.error('[CloudflareR2StorageService] Download error:', error);
      throw new FileStorageError(`Failed to download file: ${fileKey}`, error);
    }
  }

  /**
   * Get file URL with signature (private access only)
   * IMPORTANT: This bucket contains confidential credit reports - always use signed URLs
   */
  async getFileUrl(fileKey: string, options?: GetFileUrlOptions): Promise<string> {
    try {
      // Always generate signed URL for confidential data
      // Default expiration: 24 hours if not specified
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: options?.expiresIn || 24 * 60 * 60 // Default: 24 hours
      });

      return signedUrl;
    } catch (error) {
      console.error('[CloudflareR2StorageService] Get URL error:', error);
      throw new FileStorageError(`Failed to get file URL: ${fileKey}`, error as Error);
    }
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      console.log(`[CloudflareR2StorageService] Deleting file: ${fileKey}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      await this.s3Client.send(command);

      console.log(`[CloudflareR2StorageService] File deleted successfully`);
    } catch (error) {
      console.error('[CloudflareR2StorageService] Delete error:', error);
      throw new FileDeleteError(fileKey, error as Error);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new FileStorageError(`Failed to check file existence: ${fileKey}`, error);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileKey: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const response: HeadObjectCommandOutput = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new FileNotFoundError(fileKey, error);
      }
      throw new FileStorageError(`Failed to get file metadata: ${fileKey}`, error);
    }
  }
}
