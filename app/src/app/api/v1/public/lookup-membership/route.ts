import { NextRequest, NextResponse } from 'next/server';
import { GET as lookupGET, POST as lookupPOST } from '../../members/lookup/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return lookupGET(request);
}

export async function POST(request: NextRequest) {
  return lookupPOST(request);
}
