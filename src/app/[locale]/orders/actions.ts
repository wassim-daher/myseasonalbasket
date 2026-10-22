'use server';

import { normalizeReference, phoneKey } from '@/lib/my-orders';
import { findOrder } from '@/server/shop';

export type FindOrderResult = { ok: true; orderId: string } | { ok: false; error: 'notFound' | 'tryLater' };

/** Looks up an order placed on another device by its reference and mobile number. */
export async function findOrderAction(reference: string, phone: string): Promise<FindOrderResult> {
  const ref = normalizeReference(String(reference ?? '').slice(0, 40));
  const digits = phoneKey(String(phone ?? '').slice(0, 40));
  if (digits.length < 8) return { ok: false, error: 'notFound' };
  try {
    const orderId = await findOrder(ref, digits);
    return orderId ? { ok: true, orderId } : { ok: false, error: 'notFound' };
  } catch (error) {
    console.error('findOrder failed', error);
    return { ok: false, error: 'tryLater' };
  }
}
