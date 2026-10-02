/**
 * The site's own origin. Set NEXT_PUBLIC_SITE_URL in the deployment
 * environment; the fallback only serves local development.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
