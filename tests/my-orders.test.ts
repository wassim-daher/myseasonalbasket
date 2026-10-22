import { describe, expect, it } from 'vitest';
import { MAX_KEPT, parseMyOrders, rememberOrder } from '@/lib/my-orders';

const id = (n: number) => `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;

describe('my orders', () => {
  it('keeps valid order ids only, newest first, without repeats', () => {
    expect(parseMyOrders('not json')).toEqual([]);
    expect(parseMyOrders(JSON.stringify([id(1), 'x', 5, id(1).toUpperCase(), id(2)]))).toEqual([id(1), id(2)]);
    expect(rememberOrder([id(1), id(2)], id(2))).toEqual([id(2), id(1)]);
    expect(rememberOrder([id(1)], 'nope')).toEqual([id(1)]);
  });

  it('keeps at most the latest orders', () => {
    let list: string[] = [];
    for (let i = 0; i < MAX_KEPT + 5; i++) list = rememberOrder(list, id(i));
    expect(list).toHaveLength(MAX_KEPT);
    expect(list[0]).toBe(id(MAX_KEPT + 4));
  });
});
