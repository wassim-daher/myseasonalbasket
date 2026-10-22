// Guest orders placed from this browser. When the shopper signs in, those placed
// with their mobile number are added to their account. Only order ids are kept:
// each is a random UUID that works as the private link to that order.

export const MY_ORDERS_KEY = 'msb-orders-v1';
export const MAX_KEPT = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isOrderId = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

export function parseMyOrders(raw: string | null): string[] {
  try {
    const list = JSON.parse(raw ?? '[]');
    if (!Array.isArray(list)) return [];
    return [...new Set(list.filter(isOrderId).map((id) => id.toLowerCase()))].slice(0, MAX_KEPT);
  } catch {
    return [];
  }
}

export function rememberOrder(list: string[], id: string): string[] {
  if (!isOrderId(id)) return list;
  const key = id.toLowerCase();
  return [key, ...list.filter((x) => x !== key)].slice(0, MAX_KEPT);
}

/** Browser storage helpers; storage can be missing or blocked, so they never throw. */
export function loadMyOrders(): string[] {
  try {
    return parseMyOrders(window.localStorage.getItem(MY_ORDERS_KEY));
  } catch {
    return [];
  }
}

export function saveMyOrder(id: string): string[] {
  const next = rememberOrder(loadMyOrders(), id);
  try {
    window.localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(next));
  } catch {
    // Private windows may refuse storage; the order page link still works.
  }
  return next;
}
