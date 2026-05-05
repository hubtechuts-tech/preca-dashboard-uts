/**
 * API Route: GET /api/files/[...fileKey]
 *
 * Generates a presigned URL for a file stored in R2 and redirects to it.
 * This provides short, clean URLs that don't expose the presigned URL parameters.
 *
 * Security (Two Access Methods):
 * 1. Authenticated access (for admins viewing in dashboard):
 *    - Requires authentication
 *    - Admins can access all files
 *    - Regular users can only access files from their own screenings
 *
 * 2. Token-based access (for applicants via email links):
 *    - No authentication required
 *    - Must provide valid signed token in query string
 *    - Token grants access to specific file only
 *    - Tokens expire after 30 days
 *
 * Examples:
 *   GET /api/files/form-uploads/1767556610395-image.png (authenticated)
 *   GET /api/files/reports/123.pdf?token=xyz (token-based)
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService'
import { requireAuth, UnauthorizedError } from '@/lib/api-auth'
import { verifyFileToken } from '@/lib/file-token'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileKey: string[] }> }
): Promise<Response> {
  try {
    const params = await context.params

    // Reconstruct the file key from the array (handles slashes in the path)
    const fileKey = params.fileKey.join('/')

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    // Check for token-based access first (for email links)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    let accessGranted = false
    let accessMethod = ''

    if (token) {
      // Token-based access (for applicants via email)
      const tokenPayload = verifyFileToken(token)

      if (tokenPayload && tokenPayload.fileKey === fileKey) {
        accessGranted = true
        accessMethod = 'token'
        console.log(`[FileDownloadAPI] Token-based access granted for file: ${fileKey}`)
      } else {
        console.warn(`[FileDownloadAPI] Invalid or expired token for file: ${fileKey}`)
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 403 }
        )
      }
    } else {
      // Authentication-based access (for dashboard)
      try {
        const user = await requireAuth(request)
        console.log(`[FileDownloadAPI] User ${user.userId} (${user.role}) requesting file: ${fileKey}`)

        // Authorization check: Verify user has access to this file
        // Admins can access everything, regular users only their own screening files
        if (user.role !== 'admin' && user.role !== 'staff') {
          const hasAccess = await verifyFileAccess(fileKey, user.userId)

          if (!hasAccess) {
            console.warn(`[FileDownloadAPI] Access denied for user ${user.userId} to file: ${fileKey}`)
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            )
          }
        }

        accessGranted = true
        accessMethod = 'authenticated'
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return NextResponse.json(
            { error: 'Authentication required. Please log in or use a valid access token.' },
            { status: 401 }
          )
        }
        throw error
      }
    }

    if (!accessGranted) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Initialize storage service
    const storageService = SupabaseStorageService.getInstance()

    // Check if file exists
    const exists = await storageService.fileExists(fileKey)
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Generate presigned URL with 5 minute expiration
    const presignedUrl = await storageService.getFileUrl(fileKey, {
      expiresIn: 5 * 60 // 5 minutes
    })

    console.log(`[FileDownloadAPI] Access granted via ${accessMethod}. Redirecting to presigned URL (expires in 5 minutes)`)

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl)
  } catch (error) {
    console.error('[FileDownloadAPI] Error generating file URL:', error)

    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    )
  }
}

/**
 * Verify if a user has access to a file
 * Checks if the file belongs to any of the user's screenings
 */
async function verifyFileAccess(fileKey: string, userId: string): Promise<boolean> {
  try {
    // Find all screenings that contain this file key in their file arrays
    const screeningsWithFile = await prisma.screenings.findMany({
      where: {
        OR: [
          // Check if file is in report_file_keys
          {
            report_file_keys: {
              has: fileKey
            }
          },
          // Check if file is in report_urls (for backward compatibility)
          {
            report_urls: {
              has: fileKey
            }
          },
          // Check if file is authorization document
          {
            authorization_document_file_key: fileKey
          },
          // Check if file is identity verification
          {
            identity_verification_file_key: fileKey
          },
          // Check if URL contains the file key (backward compatibility with full URLs)
          {
            report_urls: {
              hasSome: await findUrlsContainingFileKey(fileKey, userId)
            }
          }
        ],
        // Must belong to this user
        user_id: userId
      },
      select: {
        id: true
      }
    })

    const hasAccess = screeningsWithFile.length > 0

    if (!hasAccess) {
      console.log(`[FileDownloadAPI] File ${fileKey} not found in any screenings for user ${userId}`)
    } else {
      console.log(`[FileDownloadAPI] File ${fileKey} found in ${screeningsWithFile.length} screening(s) for user ${userId}`)
    }

    return hasAccess
  } catch (error) {
    console.error('[FileDownloadAPI] Error verifying file access:', error)
    return false
  }
}

/**
 * Find URLs that contain the file key (for backward compatibility)
 */
async function findUrlsContainingFileKey(fileKey: string, userId: string): Promise<string[]> {
  try {
    const screenings = await prisma.screenings.findMany({
      where: {
        user_id: userId
      },
      select: {
        report_urls: true
      }
    })

    const allUrls = screenings.flatMap(s => s.report_urls)
    return allUrls.filter(url => url.includes(fileKey))
  } catch (error) {
    console.error('[FileDownloadAPI] Error finding URLs with file key:', error)
    return []
  }
}
