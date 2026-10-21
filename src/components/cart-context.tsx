'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addToCart, cartCount, emptyCart, parseCart, removeFromCart, setQuantity, type Cart, type CartKind } from '@/lib/cart';

const STORAGE_KEY = 'msb-cart-v1';

type CartApi = {
  cart: Cart;
  ready: boolean;
  count: number;
  add: (kind: CartKind, id: string, quantity?: number) => void;
  set: (kind: CartKind, id: string, quantity: number) => void;
  remove: (kind: CartKind, id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

function load(): Cart {
  try {
    return parseCart(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyCart;
  }
}

function save(cart: Cart) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Private browsing or blocked storage: the cart still works for this visit.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read the saved cart once the page is in the browser (the server has none).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(load());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setCart(parseCart(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((change: (current: Cart) => Cart) => {
    setCart((current) => {
      const next = change(current);
      save(next);
      return next;
    });
  }, []);

  const api = useMemo<CartApi>(
    () => ({
      cart,
      ready,
      count: cartCount(cart),
      add: (kind, id, quantity = 1) => update((c) => addToCart(c, kind, id, quantity)),
      set: (kind, id, quantity) => update((c) => setQuantity(c, kind, id, quantity)),
      remove: (kind, id) => update((c) => removeFromCart(c, kind, id)),
      clear: () => update(() => emptyCart),
    }),
    [cart, ready, update],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const api = useContext(CartContext);
  if (!api) throw new Error('useCart must be used inside CartProvider');
  return api;
}
