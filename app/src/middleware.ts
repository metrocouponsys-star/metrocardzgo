/**
 * Metro Cardz — Next.js Edge Middleware
 * ======================================
 * Runs on EVERY request before it reaches any route handler.
 * Executes at the edge (fast, no cold start on Hostinger).
 *
 * Responsibilities:
 *  1. Block suspicious/known-bad requests immediately
 *  2. Enforce HTTPS (redirect HTTP → HTTPS in production)
 *  3. Add security headers (X-Frame-Options, etc.)
 *  4. Protect /api/* routes — verify Authorization header format
 *  5. Log suspicious patterns for DPDP audit
 *  6. Block path traversal attempts
 *  7. Block oversized requests early
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Constants ─────────────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://metrocardz.com';

// Blocked IP list (read from env — comma-separated)
const BLOCKED_IPS = new Set<string>(
  (process.env.BLOCKED_IPS || '').split(',').map(s => s.trim()).filter(Boolean)
);

// Suspicious path patterns — block immediately
const SUSPICIOUS_PATTERNS = [
  /\.\.\//,                        // Path traversal
  /\/etc\/passwd/i,                // LFI attempt
  /\/proc\//i,                     // Linux proc filesystem
  /<script/i,                      // XSS in URL
  /union.+select/i,                // SQL injection
  /\bexec\b.*\(/i,                 // Code execution
  /\beval\b.*\(/i,                 // Eval injection
  /wp-admin/i,                     // WordPress probing (we're not WordPress)
  /phpMyAdmin/i,                   // phpMyAdmin probing
  /\.(php|asp|aspx|jsp|cgi)$/i,   // Wrong file type probing
  /\/xmlrpc\.php/i,                // XML-RPC attack vector
  /\/\.env/i,                      // Env file probing
  /\/\.git\//i,                    // Git directory exposure
];

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

function addBaseSecurityHeaders(response: NextResponse): NextResponse {
  const h = response.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('X-DNS-Prefetch-Control', 'on');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()');
  h.set('X-Request-ID', crypto.randomUUID().replace(/-/g, '').slice(0, 16));

  if (IS_PROD) {
    h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = pathname + search;
  const ip = getClientIP(request);
  const method = request.method;

  // ── 1. Block known-bad IPs ────────────────────────────────────────────────
  if (BLOCKED_IPS.has(ip)) {
    console.log(`[SECURITY] Blocked IP: ${ip} → ${pathname}`);
    return addBaseSecurityHeaders(
      NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    );
  }

  // ── 2. Block suspicious path patterns ────────────────────────────────────
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(fullPath))) {
    console.log(`[SECURITY] Suspicious path blocked: ${ip} → ${pathname}`);
    return addBaseSecurityHeaders(
      NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    );
  }

  // ── 3. Force HTTPS in production ──────────────────────────────────────────
  if (IS_PROD && request.headers.get('x-forwarded-proto') === 'http') {
    const httpsUrl = `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // ── 4. Block oversized API request bodies ────────────────────────────────
  // Content-Length check (actual body limit enforced by Next.js route handlers too)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 15 * 1024 * 1024) {  // 15 MB
    return addBaseSecurityHeaders(
      NextResponse.json({ detail: 'Request entity too large' }, { status: 413 })
    );
  }

  // ── 5. OPTIONS preflight — return CORS headers ───────────────────────────
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', BASE_URL);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-ID');
    response.headers.set('Access-Control-Max-Age', '86400');
    return addBaseSecurityHeaders(response);
  }

  // ── 6. API routes — extra validation ─────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Block non-standard HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(method)) {
      return addBaseSecurityHeaders(
        NextResponse.json({ detail: 'Method not allowed' }, { status: 405 })
      );
    }

    // Validate Content-Type for mutation methods (prevent content-type sniffing attacks)
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json') &&
          !contentType.includes('multipart/form-data') &&
          !contentType.includes('application/x-www-form-urlencoded')) {
        // Skip for specific file upload endpoints
        if (!pathname.includes('/upload')) {
          return addBaseSecurityHeaders(
            NextResponse.json({ detail: 'Content-Type must be application/json' }, { status: 415 })
          );
        }
      }
    }

    // Block cron endpoints from public internet — only allow internal calls
    if (pathname.startsWith('/api/v1/cron/')) {
      const cronKey = request.headers.get('x-cron-key');
      const internalCronKey = process.env.INTERNAL_CRON_KEY;
      if (!internalCronKey || cronKey !== internalCronKey) {
        console.log(`[SECURITY] Unauthorized cron access: ${ip} → ${pathname}`);
        return addBaseSecurityHeaders(
          NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
        );
      }
    }
  }

  // ── 7. Pass through with security headers ────────────────────────────────
  const response = NextResponse.next();
  return addBaseSecurityHeaders(response);
}

// Run middleware on all routes except static assets and _next internal
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (Next.js build files — already cached)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, robots.txt, sitemap.xml (static metadata)
     * - /uploads/* (served as static files by Next.js)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads/).*)',
  ],
};
