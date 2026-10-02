import { business, DAY_ORDER } from '@/config/business';
import { effectivePrice, availabilityOf, type Product } from '@/lib/products/types';
import { absoluteUrl, SITE_URL } from './site';

/**
 * Structured data.
 *
 * Every builder omits fields that are still unconfirmed in config/business.ts.
 * Publishing a guessed telephone number or set of opening hours into schema.org
 * would push it straight into search results, so unverified means absent.
 */

const SCHEMA_DAY: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function localBusinessSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicStore',
    '@id': absoluteUrl('/#store'),
    name: business.name,
    url: SITE_URL,
    description:
      'Instruments, lessons, repairs, and professional audio in downtown Searcy, Arkansas.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
  };

  if (business.phone) schema.telephone = business.phone;
  if (business.email) schema.email = business.email;
  if (business.foundedYear) schema.foundingDate = String(business.foundedYear);
  if (business.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    };
  }

  if (business.hours) {
    const spec = DAY_ORDER.flatMap((day) => {
      const value = business.hours?.[day];
      if (!value) return [];
      return [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${SCHEMA_DAY[day]}`,
          opens: value.open,
          closes: value.close,
        },
      ];
    });
    if (spec.length > 0) schema.openingHoursSpecification = spec;
  }

  const sameAs = Object.values(business.social).filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );
  if (sameAs.length > 0) schema.sameAs = sameAs;

  return schema;
}

const AVAILABILITY_SCHEMA = {
  'in-stock': 'https://schema.org/InStock',
  limited: 'https://schema.org/LimitedAvailability',
  'out-of-stock': 'https://schema.org/OutOfStock',
} as const;

export function productSchema(product: Product): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.shortDescription,
    sku: product.sku,
    category: product.category,
    itemCondition:
      product.condition === 'new'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: 'USD',
      price: (effectivePrice(product) / 100).toFixed(2),
      availability: AVAILABILITY_SCHEMA[availabilityOf(product)],
      itemCondition:
        product.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      seller: { '@type': 'MusicStore', name: business.name },
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Serialises JSON-LD for inline embedding. Escapes `<` so a value containing
 * `</script>` can never break out of the tag, whatever ends up in the config.
 */
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
