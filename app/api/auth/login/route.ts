import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

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

    const body = await request.json();
    
    // Input validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation - güçlü şifre gereksinimleri
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Şifre uzunluğu kontrolü (DoS saldırılarını önlemek için)
    if (body.password.length > 128) {
      return NextResponse.json(
        { error: 'Password too long' },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    // Harici API'ye istek at
    const apiUrl = process.env.API_URL;
    
    if (!apiUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API_URL is not set');
      }
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Timeout ekleyin
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Specific error handling
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error || 'Login failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Token varlığını kontrol edin
    if (!data.accessToken || !data.user) {
      return NextResponse.json(
        { error: 'Invalid response from auth service' },
        { status: 502 }
      );
    }

    const cookieStore = await cookies();
    
    // Cookie options'ı bir yerde tanımlayın (DRY)
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
    };

    cookieStore.set('auth_token', data.accessToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    cookieStore.set('auth_user', JSON.stringify(data.user), {
      ...cookieOptions,
      httpOnly: false,
    });

    return NextResponse.json({
      user: data.user,
      message: 'Login successful',
    });
  } catch (error) {
    // AbortError'u handle edin
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Login API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
