/**
 * Rate Limiting Utility
 * Brute force saldırılarını önlemek için rate limiting
 * 
 *   Production için Redis kullanılması önerilir
 * Şu anda in-memory store kullanılıyor (server restart'ta sıfırlanır)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  limit: number;
  window: string; // '1 m', '5 m', '1 h' gibi
}

interface RateLimitResult {
  success: boolean;
  reset: number; // Unix timestamp
}

// In-memory store (production'da Redis kullanılmalı)
// Production için Redis adapter eklenebilir
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Cleanup interval - lazy initialization ile (Next.js uyumluluğu için)
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Eski kayıtları temizler (memory leak önleme)
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.reset < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Cleanup interval'ı başlatır (lazy initialization)
 * Next.js'de modül seviyesinde setInterval kullanmak sorun yaratabilir
 */
function startCleanupInterval(): void {
  // Sadece bir kez başlat
  if (cleanupInterval === null && typeof setInterval !== 'undefined') {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 dakika
    cleanupInterval = setInterval(cleanupExpiredRecords, CLEANUP_INTERVAL);
    
    // Process exit'te temizle (memory leak önleme)
    if (typeof process !== 'undefined' && process.on) {
      process.on('SIGTERM', () => {
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          cleanupInterval = null;
        }
      });
    }
  }
}

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  // Cleanup interval'ı başlat (lazy initialization)
  startCleanupInterval();

  // IP adresini güvenli şekilde al
  // x-forwarded-for header'ından ilk IP'yi al (proxy arkasında)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : realIp || 'unknown';
  
  const now = Date.now();
  
  // Window süresini parse et
  const windowMs = parseWindow(options.window);
  const reset = now + windowMs;
  
  const key = `${ip}:${options.window}`;
  const record = rateLimitStore.get(key);

  // Eski kayıtları temizle (her istekte de kontrol et - double safety)
  if (record && record.reset < now) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // Yeni kayıt oluştur
    rateLimitStore.set(key, { count: 1, reset });
    return { success: true, reset };
  }

  if (current.count >= options.limit) {
    // Limit aşıldı
    return { success: false, reset: current.reset };
  }

  // Count'u artır
  current.count++;
  rateLimitStore.set(key, current);

  return { success: true, reset: current.reset };
}

export function createRateLimitResponse(reset: number): NextResponse {
  const resetDate = new Date(reset);
  const secondsUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 1000);

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
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  );
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(m|h|s)$/);
  if (!match) return 60000; // Default 1 dakika

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 60000;
  }
}
