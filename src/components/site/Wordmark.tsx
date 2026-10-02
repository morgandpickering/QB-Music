/**
 * The wordmark. Set in the display face rather than drawn, so it stays crisp
 * at any size and inherits the page's colour — the name is the logo, which is
 * how a shop that has had the same sign for decades would do it.
 */
export function Wordmark({
  className = '',
  size = 'md',
  /**
   * Drops the italic "Music" below the `sm` breakpoint. On a 375px masthead
   * the full wordmark and the cart controls cannot both fit, and a shop
   * everybody calls Quattlebaum loses nothing by being Quattlebaum on a
   * phone. The full mark returns the moment there is room for it.
   */
  responsive = false,
}: {
  className?: string;
  size?: 'md' | 'lg';
  responsive?: boolean;
}) {
  const scale = size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl';
  return (
    <span className={`flex items-baseline gap-[0.3em] font-display leading-none ${scale} ${className}`}>
      <span style={{ fontVariationSettings: '"SOFT" 20, "WONK" 1' }}>Quattlebaum</span>
      <span
        className={`text-[0.62em] italic text-brass-light ${responsive ? 'hidden sm:inline' : ''}`}
        style={{ fontVariationSettings: '"SOFT" 70, "WONK" 1' }}
      >
        Music
      </span>
    </span>
  );
}
