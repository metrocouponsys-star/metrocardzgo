import type { Metadata } from 'next';
import '@/index.css';
import { JsonLd } from '@/components/seo/JsonLd';
import { localBusinessSchema, SITE_URL, BRAND_NAME } from '@/lib/seo';
import SentryInit from '@/components/SentryInit';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Custom Membership Cards & Loyalty Card Printing | ${BRAND_NAME}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'MetroCardz prints premium custom membership, loyalty, and gift cards for retail stores, restaurants, salons, gyms, hospitals, and supermarkets across India. Gold foil, QR codes, holograms — all in your brand.',
  keywords: [
    'custom membership cards',
    'membership card printing',
    'loyalty card printing India',
    'PVC card printing',
    'gift card printing',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: BRAND_NAME,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@metrocardz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <JsonLd data={localBusinessSchema} />

        {/* ── Non-blocking Google Fonts ─────────────────────────────────────────
            Strategy:
            1. preconnect: establishes TLS to Google's font servers in parallel
               with HTML parsing (saves ~200ms on first visit).
            2. rel="stylesheet": loads the CSS. Browser will swap fonts in
               once they're ready without blocking render.
            All four font families consolidated into ONE request (saves 3 DNS
            round-trips vs the old 4×@import pattern).
        ──────────────────────────────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Single consolidated stylesheet — Inter, Poppins, Space Mono, Material Symbols */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Landing page decorative fonts (Playfair, Cormorant, Dancing Script) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Dancing+Script:wght@500;600&display=swap"
        />
      </head>
      <body>
        <SentryInit />
        {children}
      </body>
    </html>
  );
}

