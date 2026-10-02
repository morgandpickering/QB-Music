/**
 * Normalises the team portraits.
 *
 * The originals are diamond-masked PNGs with transparent corners, each padded
 * differently — some sit in a tall canvas with half of it empty. Dropped into a
 * grid as-is they render at wildly different sizes.
 *
 * This trims each one to its visible content and pads it back to a square, so
 * every diamond lands the same size in the same place. The diamond mask itself
 * is kept: it is Quattlebaum's existing portrait treatment, and it is more
 * characterful than another row of rectangles.
 *
 *   node scripts/normalise-team-photos.mjs
 *
 * Idempotent — safe to re-run after adding a new portrait.
 */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'public', 'photos', 'team');
const SIZE = 720;

const files = (await readdir(DIR)).filter((f) => f.endsWith('.png'));

for (const file of files) {
  const source = path.join(DIR, file);
  const input = sharp(source);
  const before = await input.metadata();

  // Trim fully transparent edges, then letterbox back to a square so every
  // portrait shares one frame.
  const trimmed = await sharp(source)
    .trim({ threshold: 0 })
    .toBuffer();

  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);

  await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: trimmed,
        top: Math.round((side - height) / 2),
        left: Math.round((side - width) / 2),
      },
    ])
    .png()
    .toBuffer()
    .then((square) =>
      sharp(square)
        .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, quality: 88 })
        .toFile(path.join(DIR, `tmp-${file}`)),
    );

  const { renameSync } = await import('node:fs');
  renameSync(path.join(DIR, `tmp-${file}`), source);

  const after = await sharp(source).metadata();
  console.log(
    `${file.padEnd(24)} ${before.width}x${before.height} -> ${after.width}x${after.height}`,
  );
}

console.log(`\nNormalised ${files.length} portraits to ${SIZE}x${SIZE}.`);
