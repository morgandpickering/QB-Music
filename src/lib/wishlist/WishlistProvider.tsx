'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

/**
 * The wishlist.
 *
 * Product *ids only*. The cart keeps a display snapshot because a cart line
 * has to survive a product being withdrawn mid-checkout; a wishlist does not,
 * and storing names and prices in the browser would mean showing somebody a
 * price from six months ago. Pages hold the ids and look the products up from
 * the repository at render time, so a wishlist is always current or gone.
 *
 * Persisted to localStorage until there is a real customer account to hang it
 * on. When accounts arrive, this provider is the one place that changes: swap
 * the storage calls for an API and every button already works.
 */

const STORAGE_KEY = 'qm.wishlist.v1';
/** A wishlist is a shortlist. Past this it is a browsing history nobody reads. */
const MAX_ENTRIES = 100;

interface WishlistState {
  ids: string[];
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean;
}

type WishlistAction =
  | { type: 'hydrate'; ids: string[] }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

function reducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'hydrate':
      return { ids: action.ids, hydrated: true };
    case 'toggle':
      return state.ids.includes(action.id)
        ? { ...state, ids: state.ids.filter((id) => id !== action.id) }
        : { ...state, ids: [action.id, ...state.ids].slice(0, MAX_ENTRIES) };
    case 'remove':
      return { ...state, ids: state.ids.filter((id) => id !== action.id) };
    case 'clear':
      return { ...state, ids: [] };
  }
}

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Anything could be in localStorage — another tab, an old version, a
    // person with the console open. Take only what still looks like an id.
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

interface WishlistContextValue {
  ids: string[];
  count: number;
  hydrated: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ids: [], hydrated: false });

  useEffect(() => {
    dispatch({ type: 'hydrate', ids: read() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ids));
    } catch {
      // Private browsing, or a full quota. A wishlist is not worth an error.
    }
  }, [state.ids, state.hydrated]);

  const toggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), []);
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids: state.ids,
      count: state.ids.length,
      hydrated: state.hydrated,
      has: (id: string) => state.ids.includes(id),
      toggle,
      remove,
      clear,
    }),
    [state.ids, state.hydrated, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>.');
  return ctx;
}
