/**
 * Fetches the DEMO photography set from Wikimedia Commons.
 *
 * WHY THIS EXISTS
 * ---------------
 * The site needs to look like a photography-led shop before Quattlebaum's own
 * photographs exist. These images are stand-ins: freely licensed pictures of
 * the *kind* of instrument each listing describes. They are not photographs of
 * Quattlebaum's stock, premises, staff, or installation work, and nothing in
 * the UI claims otherwise — see the demo notice in `components/site/DemoNotice`
 * and the per-slot notes in `lib/images.ts`.
 *
 * WHY COMMONS
 * -----------
 * Every file carries machine-readable licence and author metadata, so the
 * credits file below can be generated rather than asserted. Only licences that
 * permit commercial reuse are accepted (public domain, CC0, CC BY, CC BY-SA);
 * anything else is skipped rather than quietly downloaded.
 *
 * ATTRIBUTION IS NOT OPTIONAL for the CC BY and CC BY-SA files. The generated
 * `public/photos/demo/CREDITS.json` is rendered by the /credits page, which is
 * linked from the footer. If these images are replaced with Quattlebaum's own
 * photography, delete that page and this script together.
 *
 *   node scripts/fetch-demo-photos.mjs
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Commons throttles hard. Be a good citizen: one request at a time, paced. */
const PACE_MS = 1400;
const MAX_RETRIES = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch with backoff on 429/503, so a throttle is a wait rather than a loss. */
async function polite(url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'quattlebaum-music-demo/1.0 (local build script)' },
    });
    if (response.status !== 429 && response.status !== 503) return response;
    const wait = PACE_MS * 2 ** (attempt + 1);
    console.warn(`        throttled, waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
  throw new Error('still throttled after retries');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const OUT = join(process.cwd(), 'public', 'photos', 'demo');
const API = 'https://commons.wikimedia.org/w/api.php';

/** Licences that allow commercial reuse. Everything else is skipped. */
const ALLOWED = [
  /^public domain/i,
  /^cc0/i,
  /^cc by(-sa)? [1-4]\.0/i,
  /^cc by(-sa)?$/i,
];

/**
 * `slug` is the filename written; `q` is the Commons search.
 * `orient` filters the result set so product shots stay upright and editorial
 * shots stay wide — a portrait shop-interior crop is not usable as a banner.
 */
const WANTED = [
  // ---- Products -------------------------------------------------------
  { slug: 'electric-guitar-1', q: 'electric guitar solid body full', orient: 'portrait' },
  { slug: 'electric-guitar-2', q: 'stratocaster guitar body full', orient: 'portrait' },
  { slug: 'electric-guitar-3', q: 'les paul guitar full', orient: 'portrait' },
  { slug: 'semi-hollow-guitar', q: 'semi hollow electric guitar', orient: 'portrait' },
  { slug: 'acoustic-guitar-1', q: 'acoustic guitar dreadnought', orient: 'portrait' },
  { slug: 'acoustic-guitar-2', q: 'steel string acoustic guitar', orient: 'portrait' },
  { slug: 'classical-guitar', q: 'classical guitar nylon', orient: 'portrait' },
  { slug: 'ukulele', q: 'ukulele soprano instrument', orient: 'portrait' },
  { slug: 'bass-guitar-1', q: 'electric bass guitar precision', orient: 'portrait' },
  { slug: 'bass-guitar-2', q: 'jazz bass guitar instrument', orient: 'portrait' },
  { slug: 'amplifier-1', q: 'guitar combo amplifier', orient: 'any' },
  { slug: 'amplifier-2', q: 'valve guitar amplifier', orient: 'any' },
  { slug: 'pedal-1', q: 'guitar effects pedal stompbox', orient: 'any' },
  { slug: 'pedal-2', q: 'overdrive pedal guitar effect', orient: 'any' },
  { slug: 'keyboard-1', q: 'digital piano keyboard instrument', orient: 'any' },
  { slug: 'keyboard-2', q: 'stage piano synthesizer keyboard', orient: 'any' },
  { slug: 'drums-1', q: 'drum kit drum set', orient: 'any' },
  { slug: 'drums-2', q: 'acoustic drum kit studio', orient: 'any' },
  { slug: 'snare-drum', q: 'snare drum instrument', orient: 'any' },
  { slug: 'cymbal', q: 'crash cymbal drum', orient: 'any' },
  { slug: 'drumsticks', q: 'drumsticks wooden pair', orient: 'any' },
  { slug: 'saxophone', q: 'alto saxophone instrument', orient: 'portrait' },
  { slug: 'trumpet', q: 'trumpet brass instrument', orient: 'any' },
  { slug: 'violin', q: 'violin instrument full', orient: 'portrait' },
  { slug: 'clarinet', q: 'clarinet woodwind instrument', orient: 'portrait' },
  { slug: 'pa-speaker', q: 'pa loudspeaker stage monitor', orient: 'any' },
  { slug: 'mixing-console', q: 'audio mixing console mixer', orient: 'any' },
  { slug: 'microphone-1', q: 'dynamic microphone sm58', orient: 'any' },
  { slug: 'microphone-2', q: 'condenser microphone studio', orient: 'portrait' },
  { slug: 'strings', q: 'guitar strings packet set', orient: 'any' },
  { slug: 'cable', q: 'instrument jack cable audio', orient: 'any' },
  { slug: 'guitar-case', q: 'guitar case gig bag', orient: 'any' },

  // ---- Editorial ------------------------------------------------------
  { slug: 'shop-interior-1', q: 'music shop guitars wall interior', orient: 'landscape' },
  { slug: 'shop-interior-2', q: 'musical instrument store interior', orient: 'landscape' },
  { slug: 'workbench', q: 'luthier workshop guitar repair', orient: 'landscape' },
  { slug: 'lesson', q: 'guitar lesson teaching student', orient: 'landscape' },
  { slug: 'live-sound', q: 'sound engineer mixing desk live', orient: 'landscape' },
  { slug: 'band', q: 'live band performing stage small venue', orient: 'landscape' },
];

function licenceOk(name) {
  return typeof name === 'string' && ALLOWED.some((re) => re.test(name.trim()));
}

function stripHtml(value) {
  return (value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function search({ q, orient }) {
  const url =
    `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}` +
    `&gsrlimit=14&gsrnamespace=6&prop=imageinfo` +
    `&iiprop=url|size|extmetadata&iiurlwidth=1400&format=json&origin=*`;

  const response = await polite(url);
  if (!response.ok) throw new Error(`search failed: ${response.status}`);
  const data = await response.json();
  const pages = Object.values(data?.query?.pages ?? {});

  const candidates = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      const ratio = info.width / info.height;
      return {
        title: page.title,
        licence: stripHtml(meta.LicenseShortName?.value),
        author: stripHtml(meta.Artist?.value) || 'Unknown',
        descriptionUrl: info.descriptionurl,
        src: info.thumburl ?? info.url,
        width: info.thumbwidth ?? info.width,
        height: info.thumbheight ?? info.height,
        ratio,
      };
    })
    .filter(Boolean)
    .filter((c) => licenceOk(c.licence))
    .filter((c) => c.width >= 600)
    .filter((c) => {
      if (orient === 'portrait') return c.ratio < 1.05;
      if (orient === 'landscape') return c.ratio > 1.2;
      return true;
    });

  return candidates[0] ?? null;
}

await mkdir(OUT, { recursive: true });

// Resume: anything already downloaded keeps its existing credit entry.
let credits = [];
try {
  const previous = JSON.parse(await readFile(join(OUT, 'CREDITS.json'), 'utf8'));
  credits = previous.credits ?? [];
} catch {
  credits = [];
}

const missing = [];

for (const want of WANTED) {
  try {
    if (await exists(join(OUT, `${want.slug}.jpg`))) {
      console.log(`  SKIP  ${want.slug} — already downloaded`);
      continue;
    }

    await sleep(PACE_MS);
    const hit = await search(want);
    if (!hit) {
      missing.push(want.slug);
      console.warn(`  MISS  ${want.slug} — no permissively licensed match`);
      continue;
    }

    await sleep(PACE_MS);
    const image = await polite(hit.src);
    if (!image.ok) throw new Error(`download failed: ${image.status}`);

    const file = `${want.slug}.jpg`;
    await writeFile(join(OUT, file), Buffer.from(await image.arrayBuffer()));

    credits = credits.filter((c) => c.slug !== want.slug);
    credits.push({
      file: `/photos/demo/${file}`,
      slug: want.slug,
      title: hit.title.replace(/^File:/, ''),
      author: hit.author,
      licence: hit.licence,
      source: hit.descriptionUrl,
      width: hit.width,
      height: hit.height,
    });
    console.log(`  OK    ${want.slug}  [${hit.licence}]  ${hit.width}x${hit.height}`);
  } catch (error) {
    missing.push(want.slug);
    console.warn(`  FAIL  ${want.slug} — ${error.message}`);
  }
}

await writeFile(
  join(OUT, 'CREDITS.json'),
  `${JSON.stringify({ generatedBy: 'scripts/fetch-demo-photos.mjs', credits }, null, 2)}\n`,
);

console.log(`\n${credits.length} downloaded, ${missing.length} missing.`);
if (missing.length) console.log(`missing: ${missing.join(', ')}`);
