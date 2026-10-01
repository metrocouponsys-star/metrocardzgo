import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DealDetailClient } from './DealDetailClient';

export const dynamic = 'force-dynamic'; // Always SSR — freshness critical

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/deals/${id}`);
    if (!res.ok) return { title: 'Deal — Metro Cardz' };
    const deal = await res.json();
    return {
      title: `${deal.brand.name} — ${deal.offerTitle} | Metro Cardz`,
      description: deal.terms ?? `${deal.offerTitle} at ${deal.brand.name}. Exclusive Metro Cardz member privilege.`,
    };
  } catch {
    return { title: 'Deal — Metro Cardz' };
  }
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/deals/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();

  const deal = await res.json();
  return <DealDetailClient deal={deal} />;
}
