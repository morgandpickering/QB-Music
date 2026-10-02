import Link from 'next/link';
import { STATIC_PAGES } from '@/config/navigation';

/**
 * 404. An empty screen is an invitation to act, so this one points at the
 * places people were most likely trying to reach rather than apologising.
 */
export default function NotFound() {
  return (
    <div
      className="flex min-h-[70svh] items-center bg-ink pb-24 pt-16 text-paper md:pt-24"
    >
      <div className="shell shell-tight">
        <p className="marker text-brass-light">404</p>
        <h1 className="mt-4 text-5xl md:text-6xl">That page is not on the wall.</h1>
        <p className="measure mt-6 text-lg text-quiet-dark">
          It may have moved, or the link may have been mistyped. Here is everything
          else.
        </p>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <li>
            <Link href="/" className="link-draw font-medium">
              Home
            </Link>
          </li>
          {STATIC_PAGES.filter((l) => l.href !== '/').map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="link-draw font-medium">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/shop"
          className="mt-12 inline-flex min-h-12 items-center rounded-[var(--radius-xs)] bg-amber px-7 font-medium text-ink transition-colors hover:bg-brass-light"
        >
          Shop instruments
        </Link>
      </div>
    </div>
  );
}
