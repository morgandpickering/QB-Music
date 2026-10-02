'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Photo } from '@/components/media/Photo';
import type { SearchEntry } from '@/lib/products/repository';
import { formatPrice } from '@/lib/products/types';

/**
 * Header search, with suggestions as you type.
 *
 * Matching runs in the browser against a small pre-built index handed down
 * from the server, so a suggestion appears on the keystroke rather than a
 * round trip later. Every word typed has to match something — "fender bass"
 * finds the Precision and not every Fender — and a term that looks like a
 * stock number is matched against the SKU first, because somebody typing
 * QM-EG-1102 is holding a tag and wants exactly one thing.
 *
 * ponytail: linear scan over the whole catalogue. Instant at this size. Past
 * a few hundred products, move `getSearchIndex` behind an API route and
 * debounce a fetch — the component's shape does not change.
 *
 * It is a real combobox: arrow keys move through the list, Enter opens the
 * highlighted row, Escape closes it, and `aria-activedescendant` tells a
 * screen reader which row it is on without moving focus out of the field.
 */

const MAX_SUGGESTIONS = 6;

function score(entry: SearchEntry, words: string[], raw: string): number {
  // A SKU typed in full beats everything else.
  if (entry.sku.toLowerCase() === raw) return 1000;
  if (!words.every((word) => entry.haystack.includes(word))) return -1;

  let points = 0;
  const name = `${entry.brand} ${entry.name}`.toLowerCase();
  if (name.startsWith(raw)) points += 40;
  if (name.includes(raw)) points += 20;
  if (entry.brand.toLowerCase().startsWith(words[0])) points += 10;
  if (entry.sku.toLowerCase().includes(raw)) points += 30;
  return points;
}

export function HeaderSearch({
  index,
  autoFocus = false,
}: {
  index: SearchEntry[];
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const suggestions = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (raw.length < 2) return [];
    const words = raw.split(/\s+/).filter(Boolean);
    return index
      .map((entry) => ({ entry, points: score(entry, words, raw) }))
      .filter((row) => row.points >= 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, MAX_SUGGESTIONS)
      .map((row) => row.entry);
  }, [query, index]);

  // A new set of results invalidates whichever row was highlighted.
  useEffect(() => setActive(-1), [query]);

  // Clicking anywhere else closes the list.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const listOpen = open && query.trim().length >= 2;

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(href);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    if (active >= 0 && suggestions[active]) {
      go(`/product/${suggestions[active].slug}`);
      return;
    }
    go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!listOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <form role="search" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          Search the shop
        </label>

        <div className="flex items-center border border-rule-dark bg-ink/40 transition-colors focus-within:border-brass-light">
          <span className="grid h-12 w-11 shrink-0 place-items-center text-quiet-dark" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>

          <input
            ref={inputRef}
            id={inputId}
            type="search"
            role="combobox"
            autoComplete="off"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search guitars, drums, keyboards, audio & more…"
            className="h-12 min-w-0 flex-1 bg-transparent pr-3 text-[0.9375rem] text-paper placeholder:text-quiet-dark/80 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />

          <button
            type="submit"
            className="h-12 shrink-0 border-l border-rule-dark px-4 text-sm font-medium text-brass-light transition-colors hover:bg-walnut hover:text-amber"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions. Announced politely rather than assertively — a count
          that interrupts on every keystroke is worse than no count at all. */}
      <p className="sr-only" aria-live="polite">
        {listOpen
          ? `${suggestions.length} ${suggestions.length === 1 ? 'suggestion' : 'suggestions'}`
          : ''}
      </p>

      {listOpen && (
        <div className="on-light absolute inset-x-0 top-full z-50 mt-1 border border-rule-light bg-paper text-ink">
          {suggestions.length === 0 ? (
            <p className="px-4 py-5 text-sm text-quiet-light">
              Nothing matches “{query.trim()}”. We keep more in the shop than we list
              online —{' '}
              <a href="/contact?topic=product" className="link-draw font-medium text-ink">
                ask us about it
              </a>
              .
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Product suggestions">
              {suggestions.map((entry, i) => (
                <li
                  key={entry.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(event) => {
                    // mousedown, not click: the input blurs first otherwise
                    // and the list is gone before the click lands.
                    event.preventDefault();
                    go(`/product/${entry.slug}`);
                  }}
                  className={`flex cursor-pointer items-center gap-3 border-b border-rule-light px-3 py-2.5 last:border-b-0 ${
                    active === i ? 'bg-parchment' : ''
                  }`}
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden bg-parchment">
                    <Photo
                      src={entry.image}
                      alt=""
                      plate={entry.plate}
                      tone="light"
                      ratio="1 / 1"
                      sizes="48px"
                      grain={false}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-quiet-light">{entry.brand}</span>
                    <span className="block truncate text-[0.9375rem] font-medium">{entry.name}</span>
                  </span>

                  <span className="shrink-0 text-sm tabular-nums">
                    {formatPrice(entry.salePrice ?? entry.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {suggestions.length > 0 && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                go(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="link-draw flex min-h-12 w-full items-center border-t border-rule-light px-4 text-left text-sm font-medium transition-colors hover:bg-parchment"
            >
              See all results for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
