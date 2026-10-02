'use client';

import Link from 'next/link';
import { useCallback, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * One button, three weights, two grounds.
 *
 * The magnetic pull is deliberately small (6px) and only runs on devices with
 * a real pointer that have not asked for reduced motion. It is a nicety, never
 * a requirement: the hit area does not move, so a click always lands.
 */

type Variant = 'solid' | 'outline' | 'quiet';
type Ground = 'dark' | 'light';
type Size = 'md' | 'lg';

const MAGNET_STRENGTH = 6;

const base =
  'relative inline-flex items-center justify-center gap-2.5 rounded-[var(--radius-xs)] font-medium tracking-[0.01em] transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50';

const sizes: Record<Size, string> = {
  // 44px+ tall on every size: touch targets are not negotiable.
  md: 'min-h-[2.875rem] px-6 text-[0.9375rem]',
  lg: 'min-h-[3.25rem] px-8 text-base',
};

const variants: Record<Ground, Record<Variant, string>> = {
  dark: {
    solid: 'bg-amber text-ink hover:bg-brass-light',
    outline:
      'border border-rule-dark text-paper hover:border-brass-light hover:text-brass-light',
    quiet: 'text-quiet-dark hover:text-paper',
  },
  light: {
    solid: 'bg-ink text-paper hover:bg-walnut',
    outline: 'border border-rule-light text-ink hover:border-brass-deep hover:text-brass-deep',
    quiet: 'text-quiet-light hover:text-ink',
  },
};

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  ground?: Ground;
  size?: Size;
  className?: string;
  /** Turns off the magnetic pull, e.g. inside the store where it distracts. */
  magnetic?: boolean;
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps & {
  href: string;
  /** External links open in a new tab and are labelled as doing so. */
  external?: boolean;
};

function useMagnet(enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const node = ref.current;
      if (!node || !enabled) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const rect = node.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      node.style.transform = `translate3d(${dx * MAGNET_STRENGTH}px, ${dy * MAGNET_STRENGTH}px, 0)`;
    },
    [enabled],
  );

  const onLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = '';
  }, []);

  return { ref, onMove, onLeave };
}

export function Button(props: ButtonProps | LinkProps) {
  const {
    children,
    variant = 'solid',
    ground = 'light',
    size = 'md',
    className = '',
    magnetic = true,
  } = props;

  const { ref, onMove, onLeave } = useMagnet(magnetic);
  const classes = `${base} ${sizes[size]} ${variants[ground][variant]} ${className}`;
  const motionStyle = { transition: 'transform 420ms var(--ease-out-soft), color var(--dur-base), background-color var(--dur-base), border-color var(--dur-base)' };

  if ('href' in props && props.href !== undefined) {
    const { href, external } = props;
    const extra = external
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        style={motionStyle}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...extra}
      >
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </Link>
    );
  }

  const { children: _c, variant: _v, ground: _g, size: _s, className: _cn, magnetic: _m, ...rest } =
    props as ButtonProps;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      style={motionStyle}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      {children}
    </button>
  );
}
