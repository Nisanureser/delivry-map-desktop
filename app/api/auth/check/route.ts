import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { safeJsonParse } from '@/lib/input-sanitizer';
import { safeLogError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 60 istek / 1 dakika (daha sık kontrol edilebilir)
    const rateLimitResult = await checkRateLimit(request, {
      limit: 60,
      window: '1 m',
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    const userCookie = cookieStore.get('auth_user');

    if (!token || !userCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // Token validation
    if (!token.value || token.value.length < 10) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // Safe JSON parse
    const user = safeJsonParse(userCookie.value, null);

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    safeLogError(error, 'Auth Check API');
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
