/**
 * GET /api/v1/health — Database connectivity diagnostic
 * Run this in browser to see exactly what's failing:
 *   https://metrocardz.com/api/v1/health
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check DATABASE_URL env var is set
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (!dbUrl) {
    checks.database_url = 'MISSING — not set in Hostinger hPanel Environment Variables';
  } else if (dbUrl.includes('YOUR_DB_PASSWORD') || dbUrl.includes('YOUR_PASSWORD')) {
    checks.database_url = 'PLACEHOLDER — still has YOUR_DB_PASSWORD, replace with real password';
  } else {
    // Mask password for safe display
    const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
    checks.database_url = `set → ${masked}`;
  }

  // 2. Check JWT secrets
  checks.jwt_secret = process.env.JWT_SECRET
    ? (process.env.JWT_SECRET.includes('GENERATE') ? 'PLACEHOLDER — set a real secret' : 'set ✓')
    : 'MISSING';
  checks.jwt_refresh_secret = process.env.JWT_REFRESH_SECRET
    ? (process.env.JWT_REFRESH_SECRET.includes('GENERATE') ? 'PLACEHOLDER — set a real secret' : 'set ✓')
    : 'MISSING';

  // 3. Try actual DB connection
  if (dbUrl && !dbUrl.includes('YOUR_DB_PASSWORD')) {
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      checks.db_connection = 'OK ✓ — connected to MySQL';

      // Check if email column exists on merchant_users
      const cols = await prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'merchant_users'
          AND COLUMN_NAME = 'email'
      `;
      checks.email_column = cols.length > 0
        ? 'exists ✓'
        : 'MISSING — run HOSTINGER_LOGIN_FIX.sql in phpMyAdmin';

      // Check card_design_url on merchants
      const cardCols = await prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'merchants'
          AND COLUMN_NAME = 'card_design_url'
      `;
      checks.card_design_url_column = cardCols.length > 0
        ? 'exists ✓'
        : 'MISSING — run HOSTINGER_LOGIN_FIX.sql in phpMyAdmin';

    } catch (err) {
      checks.db_connection = `FAILED — ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    checks.db_connection = 'SKIPPED — fix DATABASE_URL first';
  }

  const allOk = Object.values(checks).every(v => v.includes('✓') || v.includes('set →'));

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      checks,
      fix: allOk ? null : 'See checks above. Most common fix: set DATABASE_URL in hPanel → Web Apps → Your App → Environment Variables',
    },
    { status: allOk ? 200 : 503 }
  );
}
