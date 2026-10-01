import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Always render on demand — never pre-built (requires live DB connection)
export const dynamic = 'force-dynamic';

/**
 * GET /api/cities
 * Returns all cities.
 */
export async function GET() {
  try {
    const cities = await prisma.dealCity.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      cities.map((c: any) => ({
        id:   c.id,
        name: c.name,
        slug: c.slug,
      }))
    );
  } catch (error) {
    console.error('[GET /api/cities]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
