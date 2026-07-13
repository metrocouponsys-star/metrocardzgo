import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${SITE_URL}/gym-membership-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/salon-membership-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/restaurant-loyalty-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/retail-gift-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/hospital-health-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/supermarket-loyalty-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/corporate-id-cards/`, changeFrequency: 'monthly' as const, priority: 0.9 },
  ];

  return routes.map((route) => ({
    ...route,
    lastModified: now,
  }));
}
