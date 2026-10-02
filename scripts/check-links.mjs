/**
 * Internal link check.
 *
 * Crawls every internal link reachable from the site's own pages and reports
 * anything that does not answer 200. It exists because navigation is generated
 * from `config/navigation.ts` and the catalogue, and a mistyped category slug
 * in that file produces a link that looks perfectly fine in review and 404s in
 * production.
 *
 *   npm run dev
 *   node scripts/check-links.mjs
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';

/** Where the crawl starts. Everything else is discovered from these. */
const SEEDS = [
  '/',
  '/shop',
  '/used',
  '/brands',
  '/lessons',
  '/repairs',
  '/pro-audio',
  '/about',
  '/contact',
  '/cart',
  '/wishlist',
  '/account',
  '/search',
];

/** Not crawled: they take a query the crawl cannot invent, or are dev-only. */
const SKIP = [/^\/api\//, /^\/checkout\/simulate/, /^\/order-success/];

const seen = new Map();
const queue = [...SEEDS];
const problems = [];

function internalLinksIn(html) {
  const hrefs = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]);
  return [...new Set(hrefs)];
}

while (queue.length > 0) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  if (SKIP.some((pattern) => pattern.test(path))) continue;
  seen.set(path, null);

  let response;
  try {
    response = await fetch(`${BASE}${path}`);
  } catch (error) {
    problems.push(`${path} — request failed: ${error.message}`);
    continue;
  }

  seen.set(path, response.status);
  if (response.status !== 200) {
    problems.push(`${path} — ${response.status}`);
    continue;
  }

  const html = await response.text();
  for (const href of internalLinksIn(html)) {
    // Query strings are filters over a page we are already checking; the
    // path is what can 404.
    const clean = href.split('?')[0] || '/';
    if (!seen.has(clean)) queue.push(clean);
  }
}

console.log(`Link check against ${BASE}\n`);
console.log(`  ${seen.size} internal URLs crawled`);

if (problems.length === 0) {
  console.log('\nNo broken internal links.');
  process.exit(0);
}

console.error(`\n${problems.length} problem(s):`);
for (const problem of problems) console.error(`  ${problem}`);
process.exit(1);
