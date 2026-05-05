/**
 * File Access Token Generation and Verification
 *
 * Generates signed tokens for secure file access without requiring user authentication.
 * Used for email links sent to applicants who don't have accounts.
 */

import crypto from 'crypto'

const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret-key'

export interface FileTokenPayload {
  fileKey: string
  expiresAt: number // Unix timestamp
}

/**
 * Generate a signed token for file access
 *
 * @param fileKey - The file key to grant access to
 * @param expiresInDays - Number of days until token expires (default: 30)
 * @returns Signed token string
 */
export function generateFileToken(fileKey: string, expiresInDays: number = 30): string {
  const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)

  const payload: FileTokenPayload = {
    fileKey,
    expiresAt
  }

  // Create base64 encoded payload
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

  // Create signature using HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payloadBase64)
    .digest('base64url')

  // Combine payload and signature
  return `${payloadBase64}.${signature}`
}

/**
 * Verify and decode a file access token
 *
 * @param token - The token to verify
 * @returns Decoded payload if valid, null if invalid or expired
 */
export function verifyFileToken(token: string): FileTokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
      console.warn('[FileToken] Invalid token format')
      return null
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadBase64)
      .digest('base64url')

    if (signature !== expectedSignature) {
      console.warn('[FileToken] Invalid token signature')
      return null
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const payload: FileTokenPayload = JSON.parse(payloadJson)

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      console.warn('[FileToken] Token expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('[FileToken] Error verifying token:', error)
    return null
  }
}

/**
 * Generate a complete file URL with signed token
 *
 * @param fileKey - The file key
 * @param baseUrl - Base URL (e.g., https://preca.admin.botia.pro)
 * @param expiresInDays - Number of days until token expires (default: 30)
 * @returns Complete URL with token
 */
export function generateSignedFileUrl(
  fileKey: string,
  baseUrl: string,
  expiresInDays: number = 30
): string {
  const token = generateFileToken(fileKey, expiresInDays)
  return `${baseUrl}/api/files/${fileKey}?token=${token}`
}
