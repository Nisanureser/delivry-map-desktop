/**
 * Error Handling Utilities
 * Production-safe error handling - hassas bilgileri expose etmez
 */

import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generic error response oluşturur
 * Production'da detaylı hata mesajları gizlenir
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 500
): NextResponse {
  // Development'da detaylı hata göster
  if (isDevelopment && error instanceof Error) {
    return NextResponse.json(
      {
        error: defaultMessage,
        message: error.message,
        stack: error.stack,
      },
      { status: statusCode }
    );
  }

  // Production'da generic mesaj
  return NextResponse.json(
    {
      error: defaultMessage,
    },
    { status: statusCode }
  );
}

/**
 * Validation error response
 */
export function createValidationError(message: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation error',
      message: isDevelopment ? message : 'Invalid input provided',
    },
    { status: 400 }
  );
}

/**
 * Authentication error response
 */
export function createAuthError(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: isDevelopment ? message : 'Authentication required',
    },
    { status: 401 }
  );
}

/**
 * Rate limit error response
 */
export function createRateLimitError(resetTime: number): NextResponse {
  const secondsUntilReset = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: secondsUntilReset,
    },
    {
      status: 429,
      headers: {
        'Retry-After': secondsUntilReset.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

/**
 * External API error response
 */
export function createExternalApiError(): NextResponse {
  return NextResponse.json(
    {
      error: 'External service error',
      message: isDevelopment
        ? 'Failed to communicate with external service'
        : 'Service temporarily unavailable',
    },
    { status: 502 }
  );
}

/**
 * Timeout error response
 */
export function createTimeoutError(): NextResponse {
  return NextResponse.json(
    {
      error: 'Request timeout',
      message: 'The request took too long to process',
    },
    { status: 504 }
  );
}

/**
 * Safe error logging - production'da hassas bilgileri loglamaz
 */
export function safeLogError(error: unknown, context?: string): void {
  if (isDevelopment) {
    console.error(`[${context || 'Error'}]`, error);
  } else {
    // Production'da sadece error type'ı logla
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    console.error(`[${context || 'Error'}]`, errorType);
  }
}
