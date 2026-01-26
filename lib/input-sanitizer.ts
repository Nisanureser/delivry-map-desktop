/**
 * Input Sanitization Utilities
 * XSS ve injection saldırılarına karşı koruma
 */

/**
 * HTML tag'lerini temizler
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * String input'u temizler (trim, normalize)
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim().replace(/\s+/g, ' ');

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Email formatını validate eder ve temizler
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Email uzunluk kontrolü
  if (trimmed.length > 254) {
    return null;
  }

  return trimmed;
}

/**
 * URL'yi validate eder
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    // Sadece http ve https protokollerine izin ver
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Koordinat değerini validate eder
 */
export function sanitizeCoordinate(
  value: string | number,
  min: number,
  max: number
): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * JSON input'u güvenli şekilde parse eder
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Request body size kontrolü
 */
export function validateBodySize(body: string, maxSize: number = 1024 * 1024): boolean {
  // 1MB default limit
  return body.length <= maxSize;
}
