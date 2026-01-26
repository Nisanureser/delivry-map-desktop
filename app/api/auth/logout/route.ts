import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { createErrorResponse, safeLogError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 istek / 1 dakika
    const rateLimitResult = await checkRateLimit(request, {
      limit: 10,
      window: '1 m',
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }

    const cookieStore = await cookies();
    
    // Cookie'leri sil
    cookieStore.delete('auth_token');
    cookieStore.delete('auth_user');

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    safeLogError(error, 'Logout API');
    return createErrorResponse(error, 'Internal server error', 500);
  }
}
