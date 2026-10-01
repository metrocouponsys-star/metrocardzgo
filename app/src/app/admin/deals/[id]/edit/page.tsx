'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { DealForm } from '../../DealForm';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDealPage({ params }: PageProps) {
  const { id } = use(params);
  const dealId = parseInt(id, 10);
  const [deal, setDeal] = useState<Record<string, unknown> | null | false>(null);

  useEffect(() => {
    fetch(`/api/admin/deals`, { credentials: 'include' })
      .then((r) => r.json())
      .then((deals: Array<Record<string, unknown>>) => {
        const found = deals.find((d) => d.id === dealId);
        setDeal(found ?? false);
      })
      .catch(() => setDeal(false));
  }, [dealId]);

  if (deal === null) return <div style={{ background: '#0D0F12', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Loading...</div>;
  if (deal === false) { notFound(); return null; }

  const brand = deal.brand as Record<string, unknown>;

  return (
    <DealForm
      isEdit
      dealId={dealId}
      initialData={{
        brandId:          brand.id as number,
        offerTitle:       deal.offerTitle as string,
        offerPercentage:  String(deal.offerPercentage ?? ''),
        offerType:        deal.offerType as string,
        startDate:        (deal.startDate as string).split('T')[0],
        endDate:          (deal.endDate as string).split('T')[0],
        bookingUrl:       deal.bookingUrl as string ?? '',
        affiliateUrl:     deal.affiliateUrl as string ?? '',
        terms:            deal.terms as string ?? '',
        lastVerifiedDate: (deal.lastVerifiedDate as string).split('T')[0],
        featured:         deal.featured as boolean,
        active:           deal.active as boolean,
        heroImageUrl:     deal.heroImageUrl as string ?? '',
      }}
    />
  );
}
