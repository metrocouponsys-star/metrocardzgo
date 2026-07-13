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
      </head>
      <body>
        <SentryInit />
        {children}
      </body>
    </html>
  );
}

