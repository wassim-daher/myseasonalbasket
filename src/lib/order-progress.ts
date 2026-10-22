import type { OrderSummary } from './shop-types';

export type StepKey = 'placed' | 'confirmed' | 'confirmedWaiting' | 'paid' | 'payOnDelivery' | 'payWaiting' | 'delivery';
export type Step = { key: StepKey; state: 'done' | 'current' | 'next' };

type Tracked = Pick<OrderSummary, 'status' | 'paymentMethod' | 'paymentStatus'>;

/**
 * The steps shown to the shopper for an open order: placed → confirmed by the farm →
 * payment → delivery. Rejected and cancelled orders have no steps (null).
 */
export function orderSteps(order: Tracked): Step[] | null {
  if (order.status === 'rejected' || order.status === 'cancelled') return null;
  const confirmed = order.status === 'accepted';
  const paid = order.paymentStatus === 'paid';
  const transfer = order.paymentMethod === 'wish' || order.paymentMethod === 'omt';
  const payment: Step = paid
    ? { key: 'paid', state: 'done' }
    : transfer
      ? { key: 'payWaiting', state: confirmed ? 'current' : 'next' }
      : { key: 'payOnDelivery', state: 'next' };
  return [
    { key: 'placed', state: 'done' },
    confirmed ? { key: 'confirmed', state: 'done' } : { key: 'confirmedWaiting', state: 'current' },
    payment,
    { key: 'delivery', state: confirmed && (paid || !transfer) ? 'current' : 'next' },
  ];
}
