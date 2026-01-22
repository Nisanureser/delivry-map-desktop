/**
 * Rate Limiting Utility
 * Brute force saldırılarını önlemek için rate limiting
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
const rateLimitStore = new Map<string, { count: number; reset: number }>();

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Window süresini parse et
  const windowMs = parseWindow(options.window);
  const reset = now + windowMs;
  
  const key = `${ip}:${options.window}`;
  const record = rateLimitStore.get(key);

  // Eski kayıtları temizle
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
