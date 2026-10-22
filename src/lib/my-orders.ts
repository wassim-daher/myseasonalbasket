// Orders placed from this browser, so the shopper can find and follow them again
// under "My orders". Only order ids are kept: each is a random UUID that works as
// the private link to that order. Up to MAX_KEPT, newest first.

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

/** "web-2026-4" or " WEB 2026 0004 " → "WEB-2026-0004". */
export function normalizeReference(text: string): string {
  const m = text.trim().toUpperCase().match(/^([A-Z]+)[\s-]*(\d{4})[\s-]*(\d{1,6})$/);
  return m ? `${m[1]}-${m[2]}-${m[3].padStart(4, '0')}` : text.trim().toUpperCase();
}

/** The last 8 digits of a phone number, so +961 71 555 222 and 71555222 match. */
export function phoneKey(text: string): string {
  return text.replace(/\D/g, '').slice(-8);
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
