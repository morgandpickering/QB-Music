/**
 * Structural accessibility checks across every page.
 *
 * Static analysis of the rendered HTML — it does not replace a screen reader or
 * a keyboard pass, but it catches the regressions that creep in silently:
 * a missing alt, an input that lost its label, a heading level skipped, a
 * duplicate landmark, a page that lost its <h1>.
 *
 *   npm run dev
 *   node scripts/check-a11y.mjs
 */

import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';

const PAGES = [
  '/',
  '/shop',
  '/shop/electric-guitars',
  '/product/yamaha-fg800-natural',
  '/product/gretsch-g2622-streamliner-used',
  '/admin/login',
  '/used',
  '/brands',
  '/search?q=fender',
  '/wishlist',
  '/account',
  '/lessons',
  '/repairs',
  '/pro-audio',
  '/about',
  '/contact',
  '/cart',
  '/checkout',
  '/policies/shipping',
  '/policies/privacy',
  '/order-cancelled',
  '/this-page-does-not-exist',
];

let failures = 0;

function report(page, problems) {
  if (problems.length === 0) {
    console.log(`  PASS  ${page}`);
    return;
  }
  failures += problems.length;
  console.error(`  FAIL  ${page}`);
  for (const problem of problems) console.error(`        ${problem}`);
}

/** Crude but dependency-free tag scanning over the server-rendered HTML. */
function audit(html) {
  const problems = [];

  // --- One h1, and headings that do not skip a level -------------------
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const h1Count = headings.filter((level) => level === 1).length;
  if (h1Count === 0) problems.push('no <h1>');
  if (h1Count > 1) problems.push(`${h1Count} <h1> elements, expected exactly 1`);

  let previous = 0;
  for (const level of headings) {
    if (previous !== 0 && level > previous + 1) {
      problems.push(`heading level jumps from h${previous} to h${level}`);
      break;
    }
    previous = level;
  }

  // --- Images need alt text -------------------------------------------
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt\s*=/.test(tag)) problems.push(`<img> without alt: ${tag.slice(0, 90)}`);
  }

  // --- Inputs need a label, an aria-label, or aria-labelledby ----------
  const labelledIds = new Set(
    [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]),
  );
  for (const [tag] of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)) {
    if (/type="(hidden|submit|button|radio|checkbox)"/.test(tag)) continue;
    const id = tag.match(/\sid="([^"]+)"/)?.[1];
    const hasAria = /aria-label(?:ledby)?=/.test(tag);
    if (!hasAria && (!id || !labelledIds.has(id))) {
      problems.push(`unlabelled form control: ${tag.slice(0, 90)}`);
    }
  }

  // --- Landmarks -------------------------------------------------------
  const mains = (html.match(/<main\b/g) ?? []).length;
  if (mains !== 1) problems.push(`${mains} <main> landmarks, expected 1`);

  // Multiple <nav>s are fine, but each needs a distinguishing name.
  const navs = [...html.matchAll(/<nav\b[^>]*>/g)];
  const unnamedNavs = navs.filter((m) => !/aria-label(?:ledby)?=/.test(m[0]));
  if (unnamedNavs.length > 1) {
    problems.push(`${unnamedNavs.length} <nav> elements without an accessible name`);
  }

  // --- Language and title ----------------------------------------------
  if (!/<html[^>]*\slang="/.test(html)) problems.push('<html> has no lang attribute');
  if (!/<title>/.test(html)) problems.push('no <title>');

  // --- Zoom must not be disabled ---------------------------------------
  if (/user-scalable\s*=\s*(no|0)/.test(html) || /maximum-scale\s*=\s*1/.test(html)) {
    problems.push('viewport disables zoom');
  }

  // --- Links must have discernible text ---------------------------------
  for (const [, inner] of html.matchAll(/<a\b[^>]*>([\s\S]{0,400}?)<\/a>/g)) {
    const text = inner.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim();
    if (text.length === 0) {
      // Acceptable only if the <a> itself carries a name.
      problems.push('link with no discernible text');
      break;
    }
  }

  return problems;
}

console.log(`\nAccessibility structure checks against ${BASE}\n`);

for (const page of PAGES) {
  const response = await fetch(`${BASE}${page}`);
  const html = await response.text();
  report(page, audit(html));
}

console.log(
  failures === 0
    ? '\nNo structural accessibility problems found.\n'
    : `\n${failures} problem(s) found.\n`,
);
process.exit(failures === 0 ? 0 : 1);
