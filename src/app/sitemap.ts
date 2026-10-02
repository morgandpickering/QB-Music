import type { MetadataRoute } from 'next';
import { ALL_PAGES } from '@/config/navigation';
import { getAllProducts, getCategories } from '@/lib/products/repository';
import { absoluteUrl } from '@/lib/site';

/**
 * Built from the same navigation config and product repository the site
 * renders from, so a new page or product is listed without anyone remembering
 * to add it here.
 */
/**
 * Pages that carry `robots: noindex` in their own metadata. Listing a page in
 * the sitemap while telling crawlers not to index it is a contradiction search
 * engines report as an error, so they are filtered out here rather than being
 * remembered twice.
 */
const NOINDEX = new Set(['/cart', '/wishlist', '/search', '/account']);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const now = new Date();

  return [
    ...ALL_PAGES.filter((page) => !NOINDEX.has(page.href)).map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: page.href === '/' ? 1 : 0.8,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/shop/${category.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: new Date(product.arrivedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
