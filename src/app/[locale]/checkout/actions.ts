'use server';

import { checkoutSchema, firstProblem, isShopError } from '@/lib/checkout';
import { currentCustomer, saveAddress } from '@/server/account';
import { placeOrder } from '@/server/shop';

export type PlaceOrderResult =
  | { ok: true; orderId: string; reference: string }
  | { ok: false; error: string };

/** Places the shopper's order. Returns an error key the form translates. */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstProblem(parsed.error) };
  try {
    const customer = await currentCustomer();
    const order = await placeOrder(parsed.data, customer?.id ?? null);
    if (customer) {
      // The address used last is the one filled in next time.
      await saveAddress(customer.id, { zoneId: parsed.data.zoneId, line: parsed.data.addressLine, notes: parsed.data.addressNotes })
        .catch((error) => console.error('saving the address failed', error));
    }
    return { ok: true, orderId: order.orderId, reference: order.reference };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (isShopError(message)) return { ok: false, error: message };
    console.error('placeOrder failed', error);
    return { ok: false, error: 'unknown' };
  }
}
