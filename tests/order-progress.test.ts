import { describe, expect, it } from 'vitest';
import { orderSteps } from '@/lib/order-progress';

const keys = (o: Parameters<typeof orderSteps>[0]) => orderSteps(o)?.map((s) => `${s.key}:${s.state}`);

describe('order progress', () => {
  it('waits for the farm, then for delivery when paying in cash', () => {
    expect(keys({ status: 'submitted', paymentMethod: 'cod', paymentStatus: 'pending' }))
      .toEqual(['placed:done', 'confirmedWaiting:current', 'payOnDelivery:next', 'delivery:next']);
    expect(keys({ status: 'accepted', paymentMethod: 'cod', paymentStatus: 'pending' }))
      .toEqual(['placed:done', 'confirmed:done', 'payOnDelivery:next', 'delivery:current']);
  });

  it('asks for the transfer once confirmed, then shows it received', () => {
    expect(keys({ status: 'accepted', paymentMethod: 'wish', paymentStatus: 'pending' }))
      .toEqual(['placed:done', 'confirmed:done', 'payWaiting:current', 'delivery:next']);
    expect(keys({ status: 'accepted', paymentMethod: 'omt', paymentStatus: 'paid' }))
      .toEqual(['placed:done', 'confirmed:done', 'paid:done', 'delivery:current']);
  });

  it('has no steps for closed orders', () => {
    expect(orderSteps({ status: 'rejected', paymentMethod: 'cod', paymentStatus: 'pending' })).toBeNull();
    expect(orderSteps({ status: 'cancelled', paymentMethod: 'wish', paymentStatus: 'pending' })).toBeNull();
  });
});
