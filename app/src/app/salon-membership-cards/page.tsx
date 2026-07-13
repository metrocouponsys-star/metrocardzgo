import type { Metadata } from 'next';
import { INDUSTRY_PAGES } from '@/lib/seo';
import { IndustryPageTemplate, generateIndustryMetadata } from '@/app/_industry-template';

const data = INDUSTRY_PAGES.find(p => p.slug === 'salon-membership-cards')!;

export const metadata: Metadata = generateIndustryMetadata(data);

export default function SalonMembershipCardsPage() {
  return <IndustryPageTemplate data={data} />;
}
