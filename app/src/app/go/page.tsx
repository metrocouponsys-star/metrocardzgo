import type { Metadata } from 'next';
import { NFCLandingClient } from './NFCLandingClient';

export const revalidate = 21600; // ISR: 6 hours

export const metadata: Metadata = {
  title: 'Metro Cardz — Explore Deals & Experiences',
  description: 'Tap to unlock exclusive Mumbai deals — water parks, dining, gaming, resorts, and more. 450+ verified offers for Metro Cardz members.',
  openGraph: {
    title: 'Metro Cardz — Exclusive Member Deals',
    description: 'Your NFC Gold Card just unlocked 450+ exclusive experiences across Mumbai & beyond.',
    images: [{ url: 'https://metrocardz.in/og-deals.jpg', width: 1200, height: 630 }],
  },
};

export default async function GoPage() {
  // Fetch categories and a sample of deals server-side for initial render
  let categories: Array<{ id: number; name: string; slug: string; icon: string | null }> = [];
  let featuredDeal: { id: number; offerTitle: string; brand: { name: string }; heroImageUrl: string | null; endDate: string } | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const [catRes, featuredRes] = await Promise.all([
      fetch(`${baseUrl}/api/categories`, { next: { revalidate: 21600 } }),
      fetch(`${baseUrl}/api/deals?featured=true`, { next: { revalidate: 1800 } }),
    ]);

    if (catRes.ok) categories = await catRes.json();
    if (featuredRes.ok) {
      const featured = await featuredRes.json();
      if (featured.length > 0) featuredDeal = featured[0];
    }
  } catch {
    // Graceful degradation — render with empty data, client will fetch
  }

  return <NFCLandingClient categories={categories} featuredDeal={featuredDeal} />;
}
