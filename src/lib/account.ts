import { z } from 'zod';

// Shopper accounts: a mobile number and a password. These checks only catch typing
// mistakes early; the database checks the account again.

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;

/**
 * One form of a mobile number for matching, the same as the database's
 * shop_phone_key(): digits only, without 00 / +961 / leading 0.
 */
export function phoneKey(text: string): string {
  return text.replace(/\D/g, '').replace(/^00/, '').replace(/^961/, '').replace(/^0+/, '');
}

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-().]/g, ''))
  .pipe(z.string().regex(/^\+?[0-9]{6,20}$/, 'phone'))
  .refine((value) => phoneKey(value).length >= 7, 'phone');

const password = z.string().min(MIN_PASSWORD, 'passwordShort').max(MAX_PASSWORD, 'passwordLong');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'name').max(120, 'name'),
  phone,
  password,
  remember: z.boolean(),
  locale: z.enum(['en', 'ar']),
});

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'password').max(MAX_PASSWORD, 'password'),
  remember: z.boolean(),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1, 'password').max(MAX_PASSWORD, 'password'),
  next: password,
});

export const addressSchema = z.object({
  zoneId: z.string().regex(/^[0-9a-f-]{36}$/i, 'zone'),
  line: z.string().trim().min(3, 'address').max(500, 'address'),
  notes: z.string().trim().max(500),
});

/** Days a sign-in lasts: a month on a trusted device, otherwise a day. */
export const sessionDays = (remember: boolean) => (remember ? 30 : 1);

export const accountErrorKeys = [
  'name', 'phone', 'password', 'passwordShort', 'passwordLong', 'zone', 'address',
  'wrong', 'locked', 'taken', 'currentWrong', 'signedOut', 'unknown',
] as const;
export type AccountError = (typeof accountErrorKeys)[number];

export function accountProblem(error: z.ZodError): AccountError {
  const message = error.issues[0]?.message;
  return (accountErrorKeys as readonly string[]).includes(message ?? '') ? (message as AccountError) : 'unknown';
}

/** Only paths inside the store are followed after signing in. */
export function safeNext(next: unknown, locale: string): string {
  const fallback = `/${locale}/account`;
  if (typeof next !== 'string') return fallback;
  return /^\/(en|ar)(\/[a-z0-9/_-]*)?$/i.test(next) ? next : fallback;
}
