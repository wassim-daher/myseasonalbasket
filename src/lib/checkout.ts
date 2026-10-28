import { z } from 'zod';
import { MAX_QUANTITY } from './cart';

// What the checkout form sends. This only catches typing mistakes early so the
// shopper gets a clear message; the database checks the order again in full.

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const checkoutSchema = z.object({
  requestKey: uuid,
  locale: z.enum(['en', 'ar']),
  contactName: z.string().trim().min(1, 'name').max(120, 'name'),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s\-().]/g, ''))
    .pipe(z.string().regex(/^\+?[0-9]{6,20}$/, 'phone')),
  email: z.union([z.literal(''), z.string().trim().max(200, 'email').pipe(z.email('email'))]),
  zoneId: uuid,
  slotId: uuid,
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  addressLine: z.string().trim().min(3, 'address').max(500, 'address'),
  addressNotes: z.string().trim().max(500),
  paymentMethod: z.enum(['cod', 'whatsapp', 'wish', 'omt', 'card']),
  notes: z.string().trim().max(1000),
  lines: z
    .array(z.object({ kind: z.enum(['product', 'basket']), id: uuid, quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
    .min(1, 'cart')
    .max(50, 'cart'),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutCommand = z.output<typeof checkoutSchema>;

/** The field-level message key for the first problem, e.g. 'phone'. */
export function firstProblem(error: z.ZodError): string {
  const issue = error.issues[0];
  const known = ['name', 'phone', 'address', 'email', 'cart'];
  return issue && known.includes(issue.message) ? issue.message : 'SHOP_INPUT';
}

/** Errors the database raises on purpose; anything else is unexpected. */
export const shopErrorCodes = [
  'SHOP_CLOSED', 'SHOP_PAYMENT', 'SHOP_ZONE', 'SHOP_SLOT', 'SHOP_SLOT_FULL', 'SHOP_PRODUCT',
  'SHOP_STOCK', 'SHOP_MIN_ORDER', 'SHOP_INPUT', 'SHOP_CUSTOMER',
] as const;
export type ShopErrorCode = (typeof shopErrorCodes)[number];
export const isShopError = (message: unknown): message is ShopErrorCode =>
  typeof message === 'string' && (shopErrorCodes as readonly string[]).includes(message);
