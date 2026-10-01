import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DealsGridClient } from './DealsGridClient';

export const revalidate = 3600; // ISR: 1 hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  return {
    title: `${name} Deals — Metro Cardz`,
    description: `Exclusive ${name} deals for Metro Cardz members in Mumbai & beyond. Verified offers, partner discounts, and direct merchant privileges.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  let deals: Array<Record<string, unknown>> = [];
  let cities: Array<{ id: number; name: string; slug: string }> = [];
  let categoryName = slug.replace(/-/g, ' ');

  try {
    const [dealsRes, citiesRes] = await Promise.all([
      fetch(`${baseUrl}/api/deals?category=${slug}`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/cities`, { next: { revalidate: 21600 } }),
    ]);

    if (dealsRes.status === 404) notFound();
    if (dealsRes.ok) {
      deals = await dealsRes.json();
      if (deals.length > 0) {
        // Extract category name from first deal
        categoryName = (deals[0] as { brand: { category: string } }).brand?.category ?? categoryName;
      }
    }
    if (citiesRes.ok) cities = await citiesRes.json();
  } catch {
    // Graceful degradation
  }

  return (
    <DealsGridClient
      categorySlug={slug}
      categoryName={categoryName}
      initialDeals={deals}
      cities={cities}
    />
  );
}
