import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildProductSchema, SITE_URL } from '@/lib/seo';
import LandingPage from '@/views/landing/LandingPage';

// ─── Server-rendered metadata ─────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Custom Membership Cards & Loyalty Card Printing | MetroCardz',
  description:
    'MetroCardz prints premium custom membership, loyalty, and gift cards for retail stores, restaurants, salons, gyms, hospitals, and supermarkets across India. Gold foil, QR codes, holograms, free design mockup.',
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: 'Custom Membership Cards & Loyalty Card Printing | MetroCardz',
    description:
      'Premium PVC membership and loyalty cards with gold foil, QR codes, and holograms — designed and printed for every business in India.',
    url: `${SITE_URL}/`,
  },
};

// Product schemas for homepage card categories
const productSchemas = buildProductSchema([
  {
    name: 'Custom Gym Membership Card',
    description: 'Premium PVC gym membership card with gold foil, QR code, and custom member tier design.',
    image: `${SITE_URL}/images/gym-membership-card.jpg`,
    category: 'Gym Membership Card',
    url: `${SITE_URL}/gym-membership-cards/`,
  },
  {
    name: 'Custom Salon Membership Card',
    description: 'Luxury PVC salon membership card with rose-gold foil and loyalty offer grid.',
    image: `${SITE_URL}/images/salon-membership-card.jpg`,
    category: 'Salon Membership Card',
    url: `${SITE_URL}/salon-membership-cards/`,
  },
  {
    name: 'Custom Restaurant Loyalty Card',
    description: 'Restaurant loyalty card with offer grid and QR code for dining programmes.',
    image: `${SITE_URL}/images/restaurant-loyalty-card.jpg`,
    category: 'Restaurant Loyalty Card',
    url: `${SITE_URL}/restaurant-loyalty-cards/`,
  },
  {
    name: 'Custom Retail Gift Card',
    description: 'Premium gift card with gold foil and barcode for retail stores.',
    image: `${SITE_URL}/images/retail-gift-card.jpg`,
    category: 'Retail Gift Card',
    url: `${SITE_URL}/retail-gift-cards/`,
  },
]);

// ─── Landing page (homepage) ──────────────────────────────────────────────────
// All sections are client components — the surrounding layout is server-rendered.
// This means the HTML frame, metadata, and JSON-LD are all in the initial response.

export default function HomePage() {
  return (
    <>
      <JsonLd data={productSchemas} />
      <LandingPage />
    </>
  );
}

