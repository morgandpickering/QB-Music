import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing useful to a crawler, and order URLs are per-customer.
      disallow: ['/api/', '/admin', '/cart', '/checkout', '/order-success', '/order-cancelled'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
