import type { Metadata } from 'next';
import { LiveOffersClient } from './LiveOffersClient';

export const dynamic = 'force-dynamic'; // Render at request time — avoids self-fetch timeout during build

export const metadata: Metadata = {
  title: "Today's Curated Picks — Metro Cardz",
  description: "Hand-picked deals refreshed daily by the Metro Cardz team. Exclusive water park passes, dining privileges, weekend getaways, and more — all verified in the last 24 hours.",
};

export default async function LiveOffersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let deals: Array<Record<string, unknown>> = [];

  try {
    const res = await fetch(`${baseUrl}/api/deals?featured=true`, { cache: 'no-store' });
    if (res.ok) deals = await res.json();
  } catch {
    // Graceful degradation
  }

  return <LiveOffersClient deals={deals} />;
}
