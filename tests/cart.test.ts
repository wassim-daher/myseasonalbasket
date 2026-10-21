import { describe, expect, it } from 'vitest';
import { addToCart, cartCount, emptyCart, parseCart, priceCart, removeFromCart, setQuantity } from '@/lib/cart';
import type { Basket, CatalogProduct } from '@/lib/shop-types';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: A, slug: 'olive-oil', nameEn: 'Olive oil', nameAr: 'زيت', descriptionEn: '', descriptionAr: '', categoryId: null, imagePath: '', featured: false, isNew: false, comingSoon: false, salesRank: null,
  unitNameEn: '1 L', unitNameAr: '١ ل', priceUsd: '12.50', availableUnits: 5, ...over,
});
const basket = (over: Partial<Basket> = {}): Basket => ({
  id: B, slug: 'family', nameEn: 'Family', nameAr: 'عائلة', descriptionEn: '', descriptionAr: '', imagePath: '', priceUsd: '25.00',
  frequencies: ['once'], contents: [], availableUnits: 2, ...over,
});

describe('cart', () => {
  it('adds, merges, caps and removes lines', () => {
    let cart = addToCart(emptyCart, 'product', A);
    cart = addToCart(cart, 'product', A, 2);
    cart = addToCart(cart, 'basket', B);
    expect(cart.lines).toEqual([{ kind: 'product', id: A, quantity: 3 }, { kind: 'basket', id: B, quantity: 1 }]);
    expect(cartCount(cart)).toBe(4);
    expect(setQuantity(cart, 'product', A, 500).lines[0].quantity).toBe(99);
    expect(setQuantity(cart, 'product', A, 0).lines).toHaveLength(1);
    expect(removeFromCart(cart, 'basket', B).lines).toHaveLength(1);
  });

  it('reads only well-formed saved carts', () => {
    expect(parseCart(null)).toEqual(emptyCart);
    expect(parseCart('not json')).toEqual(emptyCart);
    const raw = JSON.stringify({ lines: [
      { kind: 'product', id: A, quantity: 2 },
      { kind: 'product', id: A, quantity: 4 },
      { kind: 'gift', id: B, quantity: 1 },
      { kind: 'basket', id: 'nope', quantity: 1 },
      { kind: 'basket', id: B, quantity: -3 },
    ] });
    expect(parseCart(raw).lines).toEqual([{ kind: 'product', id: A, quantity: 2 }]);
  });

  it('prices from the live catalog in cents and flags what cannot be bought', () => {
    const cart = { lines: [{ kind: 'product' as const, id: A, quantity: 3 }, { kind: 'basket' as const, id: B, quantity: 3 }] };
    const priced = priceCart(cart, [product()], [basket()]);
    expect(priced.lines[0].lineCents).toBe(3750);
    expect(priced.lines[1].available).toBe(false);
    expect(priced.subtotalCents).toBe(3750);
    expect(priced.allAvailable).toBe(false);
    const gone = priceCart({ lines: [{ kind: 'product', id: A, quantity: 1 }] }, [], []);
    expect(gone.lines[0].available).toBe(false);
    expect(gone.allAvailable).toBe(false);
  });
});
