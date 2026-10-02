import type { PlateKind } from '@/lib/products/types';

/**
 * DRAWN PLATES
 *
 * Quattlebaum's own photography does not exist in this build yet, and filling
 * the site with generic stock would undercut the whole point of it. So every
 * image slot falls back to a line engraving in the house palette — the kind of
 * drawing a instrument catalogue would have used before it could afford
 * photographs.
 *
 * They are an intentional art direction, not a grey placeholder box, and they
 * are ~1 KB of inline SVG rather than a network request. Supply a real `src`
 * to any `<Photo>` and the photograph takes over; see `src/lib/images.ts`.
 */

type Tone = 'dark' | 'light';

const INK = '#14100e';
const WALNUT = '#2b211b';
const PAPER = '#f4efe6';
const PARCHMENT = '#e5d9c6';
const BRASS = '#a9803c';
const BRASS_LIGHT = '#c3a05a';

/** Shared stroke treatment: a steady engraver's line. */
function line(tone: Tone) {
  return {
    fill: 'none',
    stroke: tone === 'dark' ? BRASS_LIGHT : BRASS,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
}

function hair(tone: Tone) {
  return {
    fill: 'none',
    stroke: tone === 'dark' ? BRASS_LIGHT : BRASS,
    strokeWidth: 1,
    strokeLinecap: 'round' as const,
    opacity: 0.5,
    vectorEffect: 'non-scaling-stroke' as const,
  };
}

function Drawing({ kind, tone }: { kind: PlateKind; tone: Tone }) {
  const s = line(tone);
  const h = hair(tone);

  switch (kind) {
    case 'electric-guitar':
      return (
        <g>
          <path {...s} d="M232 118c-14-10-34-12-48-4-10 6-14 16-24 20-14 6-30 0-42 10-14 12-14 36-2 50 12 14 34 14 46 2 8-8 8-20 16-26 12-8 30-2 42-12 12-10 14-30 12-40Z" />
          <path {...s} d="M236 122 318 74" />
          <path {...s} d="M244 134 326 86" />
          <path {...h} d="M240 128 322 80" />
          <path {...s} d="M318 74c6-4 12-2 16 4l6 10c4 6 2 12-4 16l-12 6-18-30Z" />
          <circle {...h} cx="150" cy="166" r="26" />
          <path {...s} d="M186 128h16v20h-16zM168 148h16v20h-16z" />
          <path {...h} d="M262 106 272 122M276 98 286 114M290 90 300 106" />
        </g>
      );

    case 'acoustic-guitar':
      return (
        <g>
          <path {...s} d="M172 100c-24 0-42 18-42 40 0 14 8 24 8 36s-10 22-10 38c0 26 20 46 46 46s46-20 46-46c0-16-10-26-10-38s8-22 8-36c0-22-18-40-42-40Z" />
          <circle {...s} cx="174" cy="176" r="24" />
          <circle {...h} cx="174" cy="176" r="31" />
          <path {...s} d="M150 228h48v10h-48z" />
          <path {...s} d="M166 100V44h16v56" />
          <path {...s} d="M162 44c0-8 4-12 12-12s12 4 12 12v16c0 6-4 10-12 10s-12-4-12-10Z" />
          <path {...h} d="M168 100v128M174 100v128M180 100v128" />
        </g>
      );

    case 'bass':
      return (
        <g>
          <path {...s} d="M214 132c-12-8-30-10-42-4-9 6-12 15-21 19-12 5-26 0-37 9-12 11-12 33-1 45 11 13 30 13 41 2 7-7 7-18 14-23 11-8 26-2 37-11 11-9 12-28 9-37Z" />
          <path {...s} d="M218 136 330 66" />
          <path {...s} d="M226 150 338 80" />
          <path {...s} d="M330 66c6-4 13-1 16 6l4 10c3 7 0 13-7 15l-14 4-17-30Z" />
          <path {...h} d="M246 122 254 136M262 112 270 126M278 102 286 116M294 92 302 106" />
          <path {...s} d="M172 146h14v18h-14z" />
        </g>
      );

    case 'amplifier':
      return (
        <g>
          <path {...s} d="M96 96h208v128H96z" />
          <path {...s} d="M108 132h184v80H108z" />
          <path {...s} d="M108 108h184v16H108z" />
          <circle {...s} cx="130" cy="116" r="4" />
          <circle {...s} cx="152" cy="116" r="4" />
          <circle {...s} cx="174" cy="116" r="4" />
          <circle {...s} cx="196" cy="116" r="4" />
          <path {...h} d="M120 140h160M120 152h160M120 164h160M120 176h160M120 188h160M120 200h160" />
          <path {...s} d="M172 86h56c0 6-4 10-10 10h-36c-6 0-10-4-10-10Z" />
          <path {...h} d="M120 224v12M280 224v12" />
        </g>
      );

    case 'pedal':
      return (
        <g>
          <path {...s} d="M124 96h152v128H124z" />
          <path {...s} d="M124 184h152" />
          <circle {...s} cx="164" cy="132" r="16" />
          <circle {...s} cx="236" cy="132" r="16" />
          <path {...s} d="M164 132v-10M236 132v-10" />
          <circle {...s} cx="200" cy="164" r="10" />
          <circle {...s} cx="200" cy="204" r="14" />
          <path {...h} d="M124 240h152" />
          <path {...h} d="M112 140h12M276 140h12" />
        </g>
      );

    case 'keyboard':
      return (
        <g>
          <path {...s} d="M72 120h256v80H72z" />
          <path {...s} d="M72 144h256" />
          <path {...h} d="M96 144v56M120 144v56M144 144v56M168 144v56M192 144v56M216 144v56M240 144v56M264 144v56M288 144v56M312 144v56" />
          <path {...s} d="M86 144h16v34H86zM134 144h16v34h-16zM158 144h16v34h-16zM206 144h16v34h-16zM230 144h16v34h-16zM254 144h16v34h-16zM302 144h16v34h-16z" fill={tone === 'dark' ? WALNUT : PARCHMENT} />
          <circle {...h} cx="96" cy="132" r="4" />
          <circle {...h} cx="114" cy="132" r="4" />
          <path {...h} d="M140 128h60" />
        </g>
      );

    case 'drums':
      return (
        <g>
          <circle {...s} cx="164" cy="184" r="62" />
          <circle {...h} cx="164" cy="184" r="52" />
          <circle {...s} cx="266" cy="146" r="34" />
          <circle {...h} cx="266" cy="146" r="27" />
          <path {...s} d="M242 92h72" />
          <path {...s} d="M278 92v-6" />
          <path {...h} d="M258 96c10 4 30 4 40 0" />
          <path {...s} d="M112 246h104M164 246v14" />
          <path {...h} d="M164 122v12M120 168h12M196 168h12" />
        </g>
      );

    case 'band':
      return (
        <g>
          <path {...s} d="M108 152h130" />
          <path {...s} d="M238 128c22 0 40 11 40 24s-18 24-40 24Z" />
          <path {...s} d="M108 138h14v28h-14Z" />
          <path {...s} d="M138 130v22M166 130v22M194 130v22" />
          <circle {...s} cx="138" cy="124" r="7" />
          <circle {...s} cx="166" cy="124" r="7" />
          <circle {...s} cx="194" cy="124" r="7" />
          <path {...h} d="M252 140c12 2 18 7 18 12s-6 10-18 12" />
          <path {...h} d="M122 176c0 16 14 26 34 26h60" />
        </g>
      );

    case 'pro-audio':
      return (
        <g>
          <path {...s} d="M126 76h148v168H126z" />
          <circle {...s} cx="200" cy="180" r="40" />
          <circle {...h} cx="200" cy="180" r="26" />
          <circle {...s} cx="200" cy="180" r="10" />
          <circle {...s} cx="200" cy="118" r="18" />
          <circle {...h} cx="200" cy="118" r="9" />
          <path {...h} d="M126 250h148" />
          <path {...h} d="M296 120c12 24 12 60 0 84M316 104c18 34 18 88 0 122" />
        </g>
      );

    case 'microphone':
      return (
        <g>
          <path {...s} d="M200 72c18 0 30 12 30 30v48c0 18-12 30-30 30s-30-12-30-30V102c0-18 12-30 30-30Z" />
          <path {...h} d="M172 92h56M172 106h56M172 120h56M172 134h56" />
          <path {...s} d="M152 146c0 26 22 46 48 46s48-20 48-46" />
          <path {...s} d="M200 192v34" />
          <path {...s} d="M168 250c0-14 14-24 32-24s32 10 32 24Z" />
        </g>
      );

    case 'accessory':
      return (
        <g>
          <circle {...s} cx="152" cy="160" r="48" />
          <circle {...h} cx="152" cy="160" r="38" />
          <circle {...h} cx="152" cy="160" r="28" />
          <path {...s} d="M198 148c26-6 52-2 64 8" />
          <path {...s} d="M262 156c-14 14-38 18-62 12" />
          <path {...s} d="M244 196l30 30M274 226l-10 4 4-10Z" />
          <path {...h} d="M120 214c14 10 50 10 66 0" />
        </g>
      );

    case 'storefront':
      return (
        <g>
          <path {...s} d="M76 112h248v132H76z" />
          <path {...s} d="M64 112 90 72h220l26 40Z" />
          <path {...h} d="M96 112 116 72M136 112 152 72M176 112 188 72M216 112 224 72M256 112 260 72M296 112 296 72" />
          <path {...s} d="M100 144h96v64h-96z" />
          <path {...s} d="M224 144h72v100h-72z" />
          <path {...h} d="M148 144v64M100 176h96" />
          <circle {...h} cx="236" cy="196" r="4" />
          <path {...h} d="M76 244h248" />
        </g>
      );

    case 'workshop':
      return (
        <g>
          <path {...s} d="M64 196h272" />
          <path {...s} d="M96 196v52M304 196v52" />
          <path {...s} d="M120 196c0-30 26-54 58-54s58 24 58 54" />
          <path {...h} d="M140 196c0-20 17-36 38-36s38 16 38 36" />
          <path {...s} d="M252 150l38-38M290 112l12 4-4 12Z" />
          <path {...s} d="M92 168h40v12H92z" />
          <path {...h} d="M100 168v-14M116 168v-14" />
          <circle {...h} cx="178" cy="196" r="6" />
        </g>
      );

    case 'lesson':
      return (
        <g>
          <path {...s} d="M124 92h152v92H124z" />
          <path {...s} d="M200 184v58M164 250h72" />
          <path {...h} d="M144 116h112M144 132h112M144 148h112M144 164h112" />
          <circle {...s} cx="178" cy="152" r="9" />
          <circle {...s} cx="228" cy="140" r="9" />
          <path {...s} d="M187 152v-42l50-12v42" />
          <path {...h} d="M187 122l50-12" />
        </g>
      );

    case 'community':
      return (
        <g>
          <path {...s} d="M56 248h288" />
          <path {...s} d="M76 248v-76h56v76M132 248v-104h60v104M192 248v-64h52v64M244 248v-92h56v92" />
          <path {...h} d="M92 192h24M92 214h24M148 168h28M148 192h28M148 214h28M206 204h24M262 180h20M262 204h20" />
          <path {...s} d="M160 144l2-14 2 14M272 156l-6-16-6 16" />
          <path {...h} d="M56 248h288" />
        </g>
      );

    case 'install':
      return (
        <g>
          <path {...s} d="M64 68v208" />
          <path {...s} d="M96 104h72v96H96z" />
          <path {...s} d="M64 132h32M64 172h32" />
          <circle {...s} cx="132" cy="152" r="24" />
          <circle {...h} cx="132" cy="152" r="12" />
          <path {...h} d="M192 116c16 22 16 72 0 94M220 96c24 32 24 112 0 144M248 76c32 42 32 152 0 194" />
          <path {...s} d="M96 236h72" />
        </g>
      );

    default:
      return <circle {...s} cx="200" cy="160" r="60" />;
  }
}

/**
 * The two ground gradients, defined ONCE for the whole document.
 *
 * They used to live inside each <Plate>, which meant a store page carrying
 * twenty-four plates emitted twenty-four elements sharing the same id —
 * invalid HTML, and `url(#id)` silently resolving to whichever happened to be
 * first. The gradient only ever depended on the tone, so one pair serves every
 * plate on the page. Rendered once from the root layout.
 */
export function PlateDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute' }}
    >
      <defs>
        <radialGradient id="qm-plate-ground-dark" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stopColor={WALNUT} />
          <stop offset="100%" stopColor={INK} />
        </radialGradient>
        <radialGradient id="qm-plate-ground-light" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stopColor={PARCHMENT} />
          <stop offset="100%" stopColor={PAPER} />
        </radialGradient>
      </defs>
    </svg>
  );
}

export interface PlateProps {
  kind: PlateKind;
  tone?: Tone;
  className?: string;
}

export function Plate({ kind, tone = 'dark', className }: PlateProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="300" fill={`url(#qm-plate-ground-${tone})`} />
      <Drawing kind={kind} tone={tone} />
    </svg>
  );
}
