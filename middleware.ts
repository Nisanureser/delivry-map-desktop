import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Middleware
 * Tüm isteklere güvenlik header'ları ekler ve CORS kontrolü yapar
 */

// Production'da izin verilen origin'ler
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(origin => origin.length > 0)
  : [];

// Development için localhost'a izin ver
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // CORS kontrolü
  if (origin) {
    let isAllowed = false;

    if (isDevelopment) {
      // Development'ta localhost ve 127.0.0.1'e izin ver
      isAllowed = origin.includes('localhost') || origin.includes('127.0.0.1');
    } else if (isProduction) {
      // Production'da sadece ALLOWED_ORIGINS listesindeki origin'lere izin ver
      // Eğer ALLOWED_ORIGINS boşsa, hiçbir origin'e izin verilmez (güvenlik)
      if (ALLOWED_ORIGINS.length === 0) {
        // Production'da ALLOWED_ORIGINS zorunlu olmalı (env-validation'da kontrol ediliyor)
        // Ancak yine de burada da kontrol edelim
        console.error('  SECURITY ERROR: ALLOWED_ORIGINS is not set in production! CORS requests will be blocked.');
        isAllowed = false;
      } else {
        isAllowed = ALLOWED_ORIGINS.includes(origin);
      }
    } else {
      // Test environment için de sadece ALLOWED_ORIGINS'e izin ver
      isAllowed = ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin);
    }

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 saat
    } else {
      // CORS hatası - origin'e izin verilmedi
      // OPTIONS request için bile CORS header'ları eklenmez
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 403,
          headers: {
            ...response.headers,
            'Access-Control-Allow-Origin': 'null', // CORS hatası
          },
        });
      }
    }
  }

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS - Sadece production'da HTTPS kullanılıyorsa
  if (process.env.NODE_ENV === 'production' && request.url.startsWith('https://')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // OPTIONS request için CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

// Middleware'in çalışacağı route'lar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
