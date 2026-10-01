/** POST /api/v1/auth/refresh — issue new access token from valid refresh token */
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();
    const payload = await verifyRefreshToken(refresh_token ?? '');
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json({ detail: 'Invalid refresh token' }, { status: 401 });
    }
    return NextResponse.json(await buildLoginResponse(payload.sub!));
  } catch (err) {
    console.error('[auth/refresh]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
