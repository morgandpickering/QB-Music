import Image from 'next/image';
import type { PlateKind } from '@/lib/products/types';
import { Plate } from './Plate';

/**
 * The single image primitive for the whole site.
 *
 * Give it a real `src` and it renders an optimised, lazily-loaded, correctly
 * sized <Image>. Give it `null` and it renders the drawn plate instead. Either
 * way the box reserves its own space from the aspect ratio, so swapping a
 * plate for a photograph never shifts the layout (CLS stays at zero).
 */

export interface PhotoProps {
  src: string | null;
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 5". */
  ratio?: string;
  plate: PlateKind;
  tone?: 'dark' | 'light';
  /** `sizes` for the responsive srcset. Always pass a real value in a grid. */
  sizes?: string;
  /** Set on the one image above the fold; everything else stays lazy. */
  priority?: boolean;
  /** `cover` crops to fill (editorial imagery); `contain` shows the whole
   *  frame letterboxed (product photography — the complete instrument,
   *  uncropped, per the brief). Defaults to `cover`. */
  fit?: 'cover' | 'contain';
  /** Adds film grain over the image. */
  grain?: boolean;
  /**
   * Stretch to fill the nearest positioned ancestor instead of reserving its
   * own aspect-ratio box. For full-bleed backgrounds behind other content.
   */
  fill?: boolean;
  className?: string;
  imgClassName?: string;
}

export function Photo({
  src,
  alt,
  ratio = '4 / 3',
  plate,
  tone = 'dark',
  sizes = '100vw',
  priority = false,
  fit = 'cover',
  grain = true,
  fill = false,
  className = '',
  imgClassName = '',
}: PhotoProps) {
  return (
    <div
      className={`overflow-hidden ${fill ? 'absolute inset-0 h-full w-full' : 'relative'} ${
        grain ? 'grain' : ''
      } ${className}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${imgClassName}`}
        />
      ) : (
        <>
          <Plate kind={plate} tone={tone} className={`h-full w-full object-cover ${imgClassName}`} />
          {/* The plate is decorative, so the description lives here instead. */}
          <span className="sr-only">{alt}</span>
        </>
      )}
    </div>
  );
}
