'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlateKind } from '@/lib/products/types';

/**
 * Cart state.
 *
 * What is stored in the browser: product ids, quantities, and a small display
 * snapshot (name, price, art) so the cart can render instantly on reload.
 * That snapshot is for display only — the server re-prices every line from the
 * product repository before a payment session is created, so a customer
 * editing localStorage changes what they see and nothing they pay.
 *
 * What is never stored in the browser: anything resembling payment detail.
 */

export const MAX_QUANTITY_PER_LINE = 10;
const STORAGE_KEY = 'qm.cart.v1';

export interface CartItemDisplay {
  slug: string;
  name: string;
  brand: string;
  /** Cents. Display only; see note above. */
  unitAmount: number;
  plate: PlateKind;
  image: string | null;
  imageAlt: string;
  pickupOnly: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  display: CartItemDisplay;
}

interface CartState {
  items: CartItem[];
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean;
}

type CartAction =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'remove'; productId: string }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'clear' };

function clampQuantity(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, Math.floor(n)));
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items, hydrated: true };

    case 'add': {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: clampQuantity(i.quantity + action.item.quantity) }
              : i,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: clampQuantity(action.item.quantity) }],
      };
    }

    case 'remove':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };

    case 'setQuantity': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: clampQuantity(action.quantity) } : i,
        ),
      };
    }

    case 'clear':
      return { ...state, items: [] };

    default:
      return state;
  }
}

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Shape-check rather than trust: storage is user-editable.
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as CartItem).productId === 'string' &&
        typeof (i as CartItem).quantity === 'number' &&
        typeof (i as CartItem).display === 'object',
    );
  } catch {
    return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  /** Indicative subtotal in cents, from the display snapshot. */
  subtotal: number;
  hasPickupOnlyItem: boolean;
  isOpen: boolean;
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  /** Increments each time an item is added — drives the cart badge animation. */
  addPulse: number;
  /** Whatever had focus when the drawer opened, so closing can return it
   *  there explicitly rather than trusting Radix's default restore, which
   *  was unreliable for a controlled Sheet with no <SheetTrigger>. */
  opener: React.RefObject<HTMLElement | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);
  const [addPulse, setAddPulse] = useState(0);
  const hydratedRef = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch({ type: 'hydrate', items: readStorage() });
    hydratedRef.current = true;
  }, []);

  // Persist after hydration only, so an empty first render never wipes storage.
  useEffect(() => {
    if (!hydratedRef.current || !state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Private browsing or a full quota. The cart still works this session.
    }
  }, [state.items, state.hydrated]);

  // Keep tabs in step with each other.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) dispatch({ type: 'hydrate', items: readStorage() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((item: CartItem) => {
    opener.current = document.activeElement as HTMLElement | null;
    dispatch({ type: 'add', item });
    setAddPulse((n) => n + 1);
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: string) => dispatch({ type: 'remove', productId }), []);

  const setQuantity = useCallback(
    (productId: string, quantity: number) => dispatch({ type: 'setQuantity', productId, quantity }),
    [],
  );

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const openCart = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = state.items.reduce((n, i) => n + i.display.unitAmount * i.quantity, 0);
    return {
      items: state.items,
      hydrated: state.hydrated,
      count,
      subtotal,
      hasPickupOnlyItem: state.items.some((i) => i.display.pickupOnly),
      isOpen,
      add,
      remove,
      setQuantity,
      clear,
      openCart,
      closeCart,
      addPulse,
      opener,
    };
  }, [state.items, state.hydrated, isOpen, add, remove, setQuantity, clear, openCart, closeCart, addPulse]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>.');
  return ctx;
}
