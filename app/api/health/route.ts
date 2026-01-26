/**
 * Health Check Endpoint
 * Monitoring ve load balancer health check için
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnvConfig } from '@/lib/env-validation';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// Environment validation'ı import et (otomatik çalışır)
import '@/lib/init-env';

export async function GET(request: NextRequest) {
  try {
    // Hafif rate limiting - DoS koruması (health check'ler genelde rate limit'e tabi değildir ama güvenlik için)
    const rateLimitResult = await checkRateLimit(request, {
      limit: 100, // Yüksek limit (monitoring için)
      window: '1 m',
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }
    // Environment variable kontrolü
    let envStatus = 'ok';
    try {
      getEnvConfig();
    } catch (error) {
      envStatus = 'error';
    }

    // Health check response
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        environment: envStatus,
        api: 'ok',
      },
    };

    // Eğer environment variable'lar eksikse, status'u degraded yap
    const statusCode = envStatus === 'error' ? 503 : 200;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
