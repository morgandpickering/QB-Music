'use client';

import { useState } from 'react';
import { Plate } from '@/components/media/Plate';
import { directionsUrl, mapEmbedUrl } from '@/config/business';

/**
 * The map, loaded only when someone asks for it.
 *
 * An embedded Google map is roughly a megabyte of third-party JavaScript and a
 * set of cookies dropped on every visitor who never looks at it. So the panel
 * shows a drawn facade until it is clicked, which keeps it off the critical
 * path and out of the privacy conversation for everyone who just wanted the
 * address — which is printed right beside it either way.
 *
 * "Get directions" always works without loading anything.
 */
export function MapPanel({ ratio = '4 / 3' }: { ratio?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-walnut" style={{ aspectRatio: ratio }}>
      {loaded ? (
        <iframe
          src={mapEmbedUrl}
          title="Map showing Quattlebaum Music at 101 W. Arch St., Searcy, Arkansas"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          <Plate kind="storefront" tone="dark" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 grid place-items-center bg-ink/45 p-6 text-center">
            <div>
              <p className="measure-narrow mx-auto text-sm text-quiet-dark">
                The map loads from Google, so we leave it switched off until you want it.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-xs)] bg-amber px-5 font-medium text-ink transition-colors hover:bg-brass-light"
                >
                  Show the map
                </button>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-xs)] border border-rule-dark px-5 font-medium text-paper transition-colors hover:border-brass-light hover:text-brass-light"
                >
                  Get directions
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
