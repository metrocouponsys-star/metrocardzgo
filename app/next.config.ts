import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // ── Hostinger Web App Hosting (Node.js standalone) ───────────────────────
  // Build:   npm run build
  // Start:   npm run start  (Hostinger sets PORT automatically)
  // Node.js: 22.x (recommended)
  // Deploy:  Upload build output OR connect GitHub repo
  //
  // 'standalone' creates a self-contained bundle in .next/standalone/
  // This is what Hostinger Web App Hosting expects.
  output: 'standalone',
  trailingSlash: false,

  // Workspace root for file tracing (required with multiple lockfiles)
  outputFileTracingRoot: path.join(__dirname),

  // ── Image Optimisation — 100% Hostinger hosted ──────────────────────────
  // All images served from Hostinger disk at /public/ or uploaded via API.
  // No Supabase. No external CDN.
  images: {
    remotePatterns: [
      // Production domain (metrocardz.com)
      { protocol: 'https', hostname: 'metrocardz.com' },
      { protocol: 'https', hostname: 'www.metrocardz.com' },
      // Dev placeholders only
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Optimize images on the server (no CDN needed — Hostinger handles it)
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,  // 24 hours
  },

  // ── Prisma + bcrypt must run server-side (not Edge runtime) ────────────
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'prisma'],

  // ── Compression (Hostinger serves gzip/brotli at CDN level) ─────────────
  compress: true,

  // ── Security Headers — applied to every route ────────────────────────────
  // Additional fine-grained headers are in src/lib/security.ts
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    return [
      {
        // Apply to ALL routes
        source: '/(.*)',
        headers: [
          // ── Basic security ─────────────────────────────────────────────
          { key: 'X-Content-Type-Options',        value: 'nosniff' },
          { key: 'X-Frame-Options',               value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control',        value: 'on' },
          { key: 'Referrer-Policy',               value: 'strict-origin-when-cross-origin' },

          // ── Permissions policy — disable sensitive browser APIs ────────
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), bluetooth=()',
          },

          // ── HSTS — forces HTTPS (only in production) ──────────────────
          ...(isDev ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          }]),

          // ── Content Security Policy ────────────────────────────────────
          // Adjust 'script-src' if you add external scripts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://images.unsplash.com https://metrocardz.com https://www.metrocardz.com",
              "connect-src 'self' https://metrocardz.com https://www.metrocardz.com https://www.google-analytics.com",
              "media-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },

      // ── Static assets — long cache (1 year, immutable) ─────────────────
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // ── Public uploads — 30-day cache ─────────────────────────────────
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },

      // ── API routes — no cache, CORS for same domain ─────────────────
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Access-Control-Allow-Origin',   value: process.env.NEXT_PUBLIC_BASE_URL || 'https://metrocardz.com' },
          { key: 'Access-Control-Allow-Methods',  value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers',  value: 'Authorization, Content-Type, X-Request-ID' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect www → non-www (or vice versa — choose one canonical)
      // Hostinger allows you to configure this in hPanel → Domains too
    ];
  },

  // ── Webpack — suppress Prisma warnings in build logs ─────────────────────
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
