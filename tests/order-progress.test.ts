import { describe, expect, it } from 'vitest';
import { displayStatus, orderSteps } from '@/lib/order-progress';
import type { OrderTracking } from '@/lib/shop-types';

const none: OrderTracking = { salesStatus: null, deliveredOn: null, paidInFull: false };
const order = (status: 'submitted' | 'accepted' | 'rejected' | 'cancelled', paymentMethod: 'cod' | 'wish' | 'omt' | 'whatsapp', tracking: Partial<OrderTracking> = {}, paymentStatus: 'pending' | 'paid' = 'pending') =>
  ({ status, paymentMethod, paymentStatus, tracking: { ...none, ...tracking } });
const keys = (o: ReturnType<typeof order>) => orderSteps(o)?.map((s) => `${s.key}:${s.state}`);

describe('order progress', () => {
  it('cash orders: confirm, deliver, then pay', () => {
    expect(keys(order('submitted', 'cod'))).toEqual(['placed:done', 'confirmedWaiting:current', 'delivery:next', 'payOnDelivery:next']);
    expect(keys(order('accepted', 'cod', { salesStatus: 'reserved' }))).toEqual(['placed:done', 'confirmed:done', 'delivery:current', 'payOnDelivery:next']);
    expect(keys(order('accepted', 'cod', { salesStatus: 'prepared' }))).toEqual(['placed:done', 'confirmed:done', 'packed:current', 'payOnDelivery:next']);
    expect(keys(order('accepted', 'cod', { salesStatus: 'delivered', deliveredOn: '2026-10-24' }))).toEqual(['placed:done', 'confirmed:done', 'delivered:done', 'payOnDelivery:current']);
    expect(keys(order('accepted', 'cod', { salesStatus: 'completed', deliveredOn: '2026-10-24', paidInFull: true }))).toEqual(['placed:done', 'confirmed:done', 'delivered:done', 'paid:done']);
  });

  it('transfers: confirm, pay, then deliver', () => {
    expect(keys(order('accepted', 'wish'))).toEqual(['placed:done', 'confirmed:done', 'payWaiting:current', 'delivery:next']);
    expect(keys(order('accepted', 'omt', {}, 'paid'))).toEqual(['placed:done', 'confirmed:done', 'paid:done', 'delivery:current']);
  });

  it('follows Farm Agent on the badge', () => {
    expect(displayStatus(order('accepted', 'cod', { salesStatus: 'partially_delivered' }))).toBe('partlyDelivered');
    expect(displayStatus(order('accepted', 'cod', { salesStatus: 'delivered' }))).toBe('delivered');
    expect(displayStatus(order('accepted', 'cod', { salesStatus: 'cancelled' }))).toBe('cancelled');
    expect(displayStatus(order('submitted', 'cod'))).toBe('submitted');
  });

  it('has no steps for closed orders', () => {
    expect(orderSteps(order('rejected', 'cod'))).toBeNull();
    expect(orderSteps(order('accepted', 'wish', { salesStatus: 'cancelled' }))).toBeNull();
  });
});
