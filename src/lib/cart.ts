import { toCents } from './money';
import type { Basket, CatalogProduct } from './shop-types';

// The cart is kept in the shopper's browser. It only stores what was chosen and
// how many; names, prices and stock are always read fresh from the catalog, and
// the database checks everything again when the order is placed.

export type CartKind = 'product' | 'basket';
export type CartLine = { kind: CartKind; id: string; quantity: number };
export type Cart = { lines: CartLine[] };

export const MAX_QUANTITY = 99;
export const emptyCart: Cart = { lines: [] };

const sameLine = (a: { kind: CartKind; id: string }, b: { kind: CartKind; id: string }) => a.kind === b.kind && a.id === b.id;
const clamp = (n: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.floor(n)));

export function addToCart(cart: Cart, kind: CartKind, id: string, quantity = 1): Cart {
  const existing = cart.lines.find((line) => sameLine(line, { kind, id }));
  if (existing) return setQuantity(cart, kind, id, existing.quantity + quantity);
  const q = clamp(quantity);
  return q > 0 ? { lines: [...cart.lines, { kind, id, quantity: q }] } : cart;
}

export function setQuantity(cart: Cart, kind: CartKind, id: string, quantity: number): Cart {
  const q = clamp(quantity);
  if (q === 0) return removeFromCart(cart, kind, id);
  return { lines: cart.lines.map((line) => (sameLine(line, { kind, id }) ? { ...line, quantity: q } : line)) };
}

export function removeFromCart(cart: Cart, kind: CartKind, id: string): Cart {
  return { lines: cart.lines.filter((line) => !sameLine(line, { kind, id })) };
}

export const cartCount = (cart: Cart) => cart.lines.reduce((sum, line) => sum + line.quantity, 0);

/** Reads a cart saved in the browser, dropping anything malformed. */
export function parseCart(raw: string | null | undefined): Cart {
  if (!raw) return emptyCart;
  try {
    const value = JSON.parse(raw) as { lines?: unknown };
    if (!Array.isArray(value.lines)) return emptyCart;
    const lines: CartLine[] = [];
    for (const item of value.lines) {
      if (!item || typeof item !== 'object') continue;
      const { kind, id, quantity } = item as Record<string, unknown>;
      if ((kind !== 'product' && kind !== 'basket') || typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) continue;
      if (typeof quantity !== 'number' || !Number.isFinite(quantity)) continue;
      const q = clamp(quantity);
      if (q > 0 && !lines.some((line) => sameLine(line, { kind, id }))) lines.push({ kind, id, quantity: q });
    }
    return { lines };
  } catch {
    return emptyCart;
  }
}

export type PricedLine = CartLine & {
  nameEn: string;
  nameAr: string;
  unitNameEn: string;
  unitNameAr: string;
  slug: string;
  unitCents: number;
  lineCents: number;
  available: boolean;
  availableUnits: number;
};

/** Joins the cart with the live catalog. Lines no longer on sale are marked unavailable. */
export function priceCart(cart: Cart, products: CatalogProduct[], baskets: Basket[]) {
  const lines: PricedLine[] = cart.lines.map((line) => {
    const found =
      line.kind === 'product'
        ? products.find((p) => p.id === line.id)
        : baskets.find((b) => b.id === line.id);
    if (!found) {
      return { ...line, nameEn: '', nameAr: '', unitNameEn: '', unitNameAr: '', slug: '', unitCents: 0, lineCents: 0, available: false, availableUnits: 0 };
    }
    const unitCents = toCents(found.priceUsd);
    const isProduct = line.kind === 'product';
    return {
      ...line,
      nameEn: found.nameEn,
      nameAr: found.nameAr,
      unitNameEn: isProduct ? (found as CatalogProduct).unitNameEn : '',
      unitNameAr: isProduct ? (found as CatalogProduct).unitNameAr : '',
      slug: found.slug,
      unitCents,
      lineCents: unitCents * line.quantity,
      available: found.availableUnits >= line.quantity,
      availableUnits: found.availableUnits,
    };
  });
  const subtotalCents = lines.filter((l) => l.available).reduce((sum, l) => sum + l.lineCents, 0);
  return { lines, subtotalCents, allAvailable: lines.length > 0 && lines.every((l) => l.available) };
}
