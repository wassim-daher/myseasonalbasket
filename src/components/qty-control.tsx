'use client';

import { useCart } from './cart-context';
import type { CartKind } from '@/lib/cart';

type Labels = { less: string; more: string; quantity: string };

/**
 * The "− 0 +" control: shows how many of this item are in the cart and
 * changes it directly. Stops at the stock the farm can still sell.
 */
export function QtyControl({ kind, id, available, name, labels, large = false }: { kind: CartKind; id: string; available: number; name: string; labels: Labels; large?: boolean }) {
  const { cart, ready, set, add } = useCart();
  const inCart = ready ? cart.lines.find((l) => l.kind === kind && l.id === id)?.quantity ?? 0 : 0;
  const max = Math.min(99, available);
  return (
    <div className={large ? 'qty qty-large' : 'qty'} role="group" aria-label={`${labels.quantity}: ${name}`}>
      <button type="button" aria-label={`${labels.less}: ${name}`} disabled={inCart <= 0} onClick={() => set(kind, id, inCart - 1)}>
        −
      </button>
      <output aria-live="polite">{inCart}</output>
      <button type="button" aria-label={`${labels.more}: ${name}`} disabled={inCart >= max} onClick={() => (inCart === 0 ? add(kind, id, 1) : set(kind, id, inCart + 1))}>
        +
      </button>
    </div>
  );
}
