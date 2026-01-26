/**
 * API Authentication Middleware
 * Protected API route'lar için authentication kontrolü
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * API route'ları için authentication middleware
 * @param request NextRequest
 * @returns null eğer authenticated ise, NextResponse eğer değilse
 */
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    const userCookie = cookieStore.get('auth_user');

    if (!token || !userCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Token validation - basit kontrol (production'da JWT verify yapılabilir)
    if (!token.value || token.value.length < 10) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // User bilgisini parse et (güvenli)
    let user;
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid user data' },
        { status: 401 }
      );
    }
    
    // User validation
    if (!user || typeof user !== 'object' || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid user data' },
        { status: 401 }
      );
    }

    // User bilgisini request'e ekle (kullanılmıyorsa optional)
    // (request.user = user) - Next.js'de request extend edilemez, bu yüzden context kullanılmalı

    return null; // Authenticated
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Optional auth - authenticated ise user'ı döndürür, değilse null
 */
export async function getAuthUser(): Promise<{
  user: any;
  token: string | null;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    const userCookie = cookieStore.get('auth_user');

    if (!token || !userCookie) {
      return null;
    }

    // Güvenli JSON parse
    let user;
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      return null;
    }
    
    // User validation
    if (!user || typeof user !== 'object' || !user.id) {
      return null;
    }
    
    return { user, token: token.value };
  } catch {
    return null;
  }
}
