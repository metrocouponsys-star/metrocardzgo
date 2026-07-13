import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/gym-membership-cards/',
          '/salon-membership-cards/',
          '/restaurant-loyalty-cards/',
          '/retail-gift-cards/',
          '/hospital-health-cards/',
          '/supermarket-loyalty-cards/',
          '/corporate-id-cards/',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/members/',
          '/offers/',
          '/membership-types/',
          '/reports/',
          '/campaigns/',
          '/settings/',
          '/cards/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
