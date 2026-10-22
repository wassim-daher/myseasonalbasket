import type { OrderSummary } from './shop-types';

export type StepKey =
  | 'placed' | 'confirmed' | 'confirmedWaiting' | 'paid' | 'payOnDelivery' | 'payWaiting'
  | 'delivery' | 'packed' | 'partlyDelivered' | 'delivered';
export type Step = { key: StepKey; state: 'done' | 'current' | 'next' };
export type DisplayStatus = 'submitted' | 'accepted' | 'packed' | 'partlyDelivered' | 'delivered' | 'rejected' | 'cancelled';

type Tracked = Pick<OrderSummary, 'status' | 'paymentMethod' | 'paymentStatus' | 'tracking'>;

/** The one status shown on the order's badge, following Farm Agent once accepted. */
export function displayStatus(order: Tracked): DisplayStatus {
  if (order.status === 'rejected') return 'rejected';
  if (order.status === 'cancelled' || order.tracking.salesStatus === 'cancelled') return 'cancelled';
  if (order.status === 'submitted') return 'submitted';
  switch (order.tracking.salesStatus) {
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'partially_delivered':
      return 'partlyDelivered';
    case 'prepared':
      return 'packed';
    default:
      return 'accepted';
  }
}

export const isPaid = (order: Tracked) => order.paymentStatus === 'paid' || order.tracking.paidInFull;

/**
 * The steps shown to the shopper for an open order. Transfers (Wish, OMT) are paid
 * before delivery; cash and WhatsApp orders are paid when they arrive. Rejected and
 * cancelled orders have no steps (null).
 */
export function orderSteps(order: Tracked): Step[] | null {
  const status = displayStatus(order);
  if (status === 'rejected' || status === 'cancelled') return null;
  const confirmed = status !== 'submitted';
  const delivered = status === 'delivered';
  const paid = isPaid(order);
  const transfer = order.paymentMethod === 'wish' || order.paymentMethod === 'omt';
  const readyToDeliver = confirmed && (paid || !transfer);

  const delivery: Step =
    delivered ? { key: 'delivered', state: 'done' }
      : status === 'partlyDelivered' ? { key: 'partlyDelivered', state: 'current' }
        : status === 'packed' ? { key: 'packed', state: readyToDeliver ? 'current' : 'next' }
          : { key: 'delivery', state: readyToDeliver ? 'current' : 'next' };
  const payment: Step = paid
    ? { key: 'paid', state: 'done' }
    : transfer
      ? { key: 'payWaiting', state: confirmed ? 'current' : 'next' }
      : { key: 'payOnDelivery', state: delivered ? 'current' : 'next' };

  return [
    { key: 'placed', state: 'done' },
    confirmed ? { key: 'confirmed', state: 'done' } : { key: 'confirmedWaiting', state: 'current' },
    ...(transfer ? [payment, delivery] : [delivery, payment]),
  ];
}
