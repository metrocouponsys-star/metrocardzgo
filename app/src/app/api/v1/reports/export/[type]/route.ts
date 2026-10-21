import { NextRequest, NextResponse } from 'next/server';
import { GET as reportsGet } from '../../route';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ type: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { type } = await params;
  const url = new URL(request.url);
  url.searchParams.set('type', type);
  const modifiedRequest = new NextRequest(url, request);
  return reportsGet(modifiedRequest);
}
