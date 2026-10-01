import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Always render on demand — never pre-built (requires live DB connection)
export const dynamic = 'force-dynamic';

/**
 * GET /api/categories
 * Returns all deal categories.
 */
export async function GET() {
  try {
    const categories = await prisma.dealCategory.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(
      categories.map((c: any) => ({
        id:   c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      }))
    );
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
