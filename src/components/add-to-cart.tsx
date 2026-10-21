'use client';

import { useState } from 'react';
import { useCart } from './cart-context';
import type { CartKind } from '@/lib/cart';

type Labels = { add: string; added: string; soldOut: string; soldOutShort: string; quantity: string; less: string; more: string };

/** A compact Add button for product cards. */
export function AddButton({ kind, id, available, labels, name }: { kind: CartKind; id: string; available: number; labels: Labels; name: string }) {
  const { add, cart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = cart.lines.find((l) => l.kind === kind && l.id === id)?.quantity ?? 0;
  const canAdd = available > inCart;
  return (
    <button
      type="button"
      className="btn btn-soft"
      disabled={!canAdd}
      aria-label={`${labels.add}: ${name}`}
      onClick={() => {
        add(kind, id, 1);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
      }}
    >
      {available <= 0 ? labels.soldOutShort : justAdded ? labels.added : labels.add}
    </button>
  );
}

/** Quantity stepper plus Add, for product and basket pages. */
export function AddWithQuantity({ kind, id, available, labels }: { kind: CartKind; id: string; available: number; labels: Labels }) {
  const { add, cart } = useCart();
  const inCart = cart.lines.find((l) => l.kind === kind && l.id === id)?.quantity ?? 0;
  const room = Math.max(0, available - inCart);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const q = Math.min(quantity, Math.max(room, 1));

  if (available <= 0) return <p className="stock stock-out">{labels.soldOut}</p>;

  return (
    <div className="buy-row">
      <div className="stepper" role="group" aria-label={labels.quantity}>
        <button type="button" aria-label={labels.less} disabled={q <= 1} onClick={() => setQuantity(Math.max(1, q - 1))}>−</button>
        <output aria-live="polite">{q}</output>
        <button type="button" aria-label={labels.more} disabled={q >= room} onClick={() => setQuantity(Math.min(room, q + 1))}>+</button>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-large"
        style={{ flex: '1 1 220px' }}
        disabled={room <= 0}
        onClick={() => {
          add(kind, id, q);
          setQuantity(1);
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 1600);
        }}
      >
        {justAdded ? labels.added : labels.add}
      </button>
    </div>
  );
}
