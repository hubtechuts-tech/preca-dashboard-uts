/**
 * File Upload API Route
 *
 * POST /api/files/upload - Upload a file with automatic compression
 *
 * Accepts multipart/form-data with a file field
 * Returns the uploaded file URL
 *
 * Security:
 * - Requires authentication
 * - File type validation
 * - File size limits (10MB max)
 * - Automatic image compression
 */

import { NextRequest, NextResponse } from 'next/server';
import { FileUploadController } from '../_controllers/FileUploadController';
import { UploadFileUseCase } from '@/application/use-cases/file/UploadFileUseCase';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { requireAuth, UnauthorizedError } from '@/lib/api-auth';

/**
 * Create controller with dependencies
 */
function createController(): FileUploadController {
  const storageService = SupabaseStorageService.getInstance();
  const uploadUseCase = new UploadFileUseCase(storageService);
  return new FileUploadController(uploadUseCase);
}

/**
 * POST /api/files/upload
 * Upload a file with automatic compression
 *
 * Request: multipart/form-data with 'file' field
 *
 * Response:
 * {
 *   "fileUrl": "https://storage.supabase.co/...",
 *   "fileKey": "form-uploads/1234567890-filename.jpg",
 *   "fileName": "filename.jpg",
 *   "contentType": "image/jpeg",
 *   "size": 123456,
 *   "uploadedAt": "2024-01-01T00:00:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Prepare file data
    const fileData = {
      fileBuffer,
      fileName: file.name,
      contentType: file.type,
      size: file.size
    };

    // Upload via controller
    const controller = createController();
    const response = await controller.upload(fileData);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Unexpected error in POST /api/files/upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
