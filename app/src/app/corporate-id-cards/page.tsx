import type { Metadata } from 'next';
import { INDUSTRY_PAGES } from '@/lib/seo';
import { IndustryPageTemplate, generateIndustryMetadata } from '@/app/_industry-template';

const data = INDUSTRY_PAGES.find(p => p.slug === 'corporate-id-cards')!;

export const metadata: Metadata = generateIndustryMetadata(data);

export default function CorporateIdCardsPage() {
  return <IndustryPageTemplate data={data} />;
}
