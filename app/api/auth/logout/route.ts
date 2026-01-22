import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Cookie'leri sil
    cookieStore.delete('auth_token');
    cookieStore.delete('auth_user');

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
