import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString, validateBodySize } from '@/lib/input-sanitizer';
import { createErrorResponse, createValidationError, createTimeoutError, safeLogError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting kontrolü - Brute force saldırılarını önlemek için
    // 5 istek / 1 dakika limiti
    const rateLimitResult = await checkRateLimit(request, {
      limit: 5,
      window: '1 m', // 1 dakika
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }

    // Request body'yi oku (sadece bir kez!)
    let rawBody: string;
    let body: any;
    
    try {
      rawBody = await request.text();
      
      // Body size kontrolü
      if (!validateBodySize(rawBody, 1024)) { // 1KB limit
        return createValidationError('Request body too large');
      }
      
      // JSON parse et
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return createValidationError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }
    
    // Input validation
    if (!body.email || !body.password) {
      return createValidationError('Email and password are required');
    }

    // Email sanitization ve validation
    const email = sanitizeEmail(body.email);
    if (!email) {
      return createValidationError('Invalid email format');
    }

    // Password validation - güçlü şifre gereksinimleri
    const password = sanitizeString(body.password);
    if (password.length < 8) {
      return createValidationError('Password must be at least 8 characters long');
    }
    
    // Şifre uzunluğu kontrolü (DoS saldırılarını önlemek için)
    if (password.length > 128) {
      return createValidationError('Password too long');
    }

    // Harici API'ye istek at
    const apiUrl = process.env.API_URL;
    
    if (!apiUrl) {
      safeLogError(new Error('API_URL is not set'), 'Login API');
      return createErrorResponse(
        new Error('Configuration error'),
        'Configuration error',
        500
      );
    }

    // Timeout ekleyin (5 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return createTimeoutError();
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Specific error handling
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      safeLogError(new Error(`External API error: ${response.status}`), 'Login API');
      return createErrorResponse(
        new Error('Login failed'),
        'Login failed',
        response.status >= 500 ? 502 : response.status
      );
    }

    const data = await response.json();

    // Token varlığını kontrol edin
    if (!data.accessToken || !data.user) {
      safeLogError(new Error('Invalid response from auth service'), 'Login API');
      return createErrorResponse(
        new Error('Invalid response from auth service'),
        'Authentication service error',
        502
      );
    }

    const cookieStore = await cookies();
    
    // Cookie options - Production güvenlik ayarları
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax' as const, // CSRF koruması
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
      // httpOnly: true için ayrı ayrı set edilecek
    };

    // Auth token - HttpOnly, Secure (production'da)
    cookieStore.set('auth_token', data.accessToken, {
      ...cookieOptions,
      httpOnly: true, // XSS koruması
      secure: isProduction,
    });

    // User data - HttpOnly değil (client-side'da okunabilir olmalı)
    // Ancak hassas bilgileri içermemeli
    cookieStore.set('auth_user', JSON.stringify(data.user), {
      ...cookieOptions,
      httpOnly: false, // Client-side'da okunabilir
      secure: isProduction,
    });

    return NextResponse.json({
      user: data.user,
      message: 'Login successful',
    });
  } catch (error) {
    // AbortError'u handle edin
    if (error instanceof Error && error.name === 'AbortError') {
      return createTimeoutError();
    }
    
    safeLogError(error, 'Login API');
    return createErrorResponse(error, 'Internal server error', 500);
  }
}
