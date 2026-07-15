import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    // Core marketing pages — highest priority
    { url: `${SITE_URL}/`, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${SITE_URL}/features/`, changeFrequency: 'monthly' as const, priority: 0.95 },
    { url: `${SITE_URL}/pricing/`, changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: `${SITE_URL}/how-it-works/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/roi-calculator/`, changeFrequency: 'monthly' as const, priority: 0.85 },
    { url: `${SITE_URL}/alternatives/`, changeFrequency: 'monthly' as const, priority: 0.85 },

    // Industry landing pages
    { url: `${SITE_URL}/gym-membership-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/salon-membership-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/restaurant-loyalty-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/retail-gift-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/hospital-health-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/supermarket-loyalty-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },
    { url: `${SITE_URL}/corporate-id-cards/`, changeFrequency: 'monthly' as const, priority: 0.90 },

    // About & Trust pages
    { url: `${SITE_URL}/about-us/`, changeFrequency: 'monthly' as const, priority: 0.80 },
    { url: `${SITE_URL}/company-info/`, changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${SITE_URL}/contact/`, changeFrequency: 'monthly' as const, priority: 0.80 },
    { url: `${SITE_URL}/compliance/`, changeFrequency: 'monthly' as const, priority: 0.70 },
    { url: `${SITE_URL}/status/`, changeFrequency: 'daily' as const, priority: 0.60 },

    // Legal pages
    { url: `${SITE_URL}/privacy-policy/`, changeFrequency: 'monthly' as const, priority: 0.50 },
    { url: `${SITE_URL}/terms-and-conditions/`, changeFrequency: 'monthly' as const, priority: 0.50 },
    { url: `${SITE_URL}/refund-policy/`, changeFrequency: 'monthly' as const, priority: 0.50 },
  ];

  return routes.map((route) => ({
    ...route,
    lastModified: now,
  }));
}
