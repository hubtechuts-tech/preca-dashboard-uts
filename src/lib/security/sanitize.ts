/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input and prevent XSS attacks
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Removes: <, >, &, ", ', /, \, script tags, event handlers
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim();
}

/**
 * Sanitize email - only allow valid email characters
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Only allow alphanumeric, @, ., -, _, +
  return email
    .replace(/[^a-zA-Z0-9@.\-_+]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Sanitize phone number - only allow digits, +, -, (), spaces
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  return phone.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitize an object recursively
 * - Limits object depth to prevent JSON bombs
 * - Sanitizes all string values
 * - Limits key and value sizes
 */
export function sanitizeObject(
  obj: any,
  maxDepth: number = 5,
  currentDepth: number = 0
): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }

  if (currentDepth >= maxDepth) {
    throw new Error('Object nesting too deep');
  }

  const sanitized: Record<string, any> = {};
  const MAX_KEY_LENGTH = 100;
  const MAX_VALUE_LENGTH = 1000;
  const MAX_KEYS = 50;

  const keys = Object.keys(obj);
  if (keys.length > MAX_KEYS) {
    throw new Error(`Too many keys in object (max ${MAX_KEYS})`);
  }

  for (const key of keys) {
    // Sanitize key
    const sanitizedKey = sanitizeString(key);

    if (sanitizedKey.length === 0) {
      continue; // Skip invalid keys
    }

    if (sanitizedKey.length > MAX_KEY_LENGTH) {
      throw new Error(`Key too long: ${sanitizedKey.substring(0, 20)}...`);
    }

    const value = obj[key];

    // Handle different value types
    if (typeof value === 'string') {
      const sanitizedValue = sanitizeString(value);
      if (sanitizedValue.length > MAX_VALUE_LENGTH) {
        throw new Error(`Value too long for key: ${sanitizedKey}`);
      }
      sanitized[sanitizedKey] = sanitizedValue;
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      // Limit array size
      if (value.length > 100) {
        throw new Error('Array too large');
      }
      sanitized[sanitizedKey] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[sanitizedKey] = sanitizeObject(value, maxDepth, currentDepth + 1);
    }
  }

  return sanitized;
}

/**
 * Validate that a string is a valid positive integer
 */
export function isValidPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && parseInt(value, 10) > 0;
}
