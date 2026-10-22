'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { accountProblem, addressSchema, loginSchema, passwordChangeSchema, registerSchema, safeNext, type AccountError } from '@/lib/account';
import { isOrderId } from '@/lib/my-orders';
import {
  cancelOrder, changePassword, claimOrders, currentCustomer, register, saveAddress, signIn, signOut, updateName,
} from '@/server/account';

export type AccountResult = { ok: true; next?: string } | { ok: false; error: AccountError };

const guestOrders = (value: unknown) => (Array.isArray(value) ? value.filter(isOrderId).slice(0, 30) : []);

async function attempt(work: () => Promise<AccountResult>): Promise<AccountResult> {
  try {
    return await work();
  } catch (error) {
    console.error('account action failed', error);
    return { ok: false, error: 'unknown' };
  }
}

export async function registerAction(input: unknown, next: unknown, orders: unknown): Promise<AccountResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: accountProblem(parsed.error) };
  return attempt(async () => {
    const result = await register(parsed.data);
    if (result !== 'ok') return { ok: false, error: result === 'taken' ? 'taken' : 'unknown' };
    await claimOrders(guestOrders(orders));
    return { ok: true, next: safeNext(next, parsed.data.locale) };
  });
}

export async function loginAction(input: unknown, locale: string, next: unknown, orders: unknown): Promise<AccountResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: accountProblem(parsed.error) };
  return attempt(async () => {
    const result = await signIn(parsed.data);
    if (result !== 'ok') return { ok: false, error: result === 'locked' ? 'locked' : 'wrong' };
    await claimOrders(guestOrders(orders));
    return { ok: true, next: safeNext(next, locale === 'ar' ? 'ar' : 'en') };
  });
}

export async function logoutAction(locale: string): Promise<void> {
  await signOut();
  redirect(`/${locale === 'ar' ? 'ar' : 'en'}`);
}

export async function changePasswordAction(input: unknown): Promise<AccountResult> {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: accountProblem(parsed.error) };
  return attempt(async () => {
    const result = await changePassword(parsed.data.current, parsed.data.next);
    return result === 'ok' ? { ok: true } : { ok: false, error: result };
  });
}

export async function saveNameAction(name: unknown): Promise<AccountResult> {
  const value = typeof name === 'string' ? name.trim() : '';
  if (value.length < 1 || value.length > 120) return { ok: false, error: 'name' };
  return attempt(async () => {
    const customer = await currentCustomer();
    if (!customer) return { ok: false, error: 'signedOut' };
    await updateName(customer.id, value);
    revalidatePath('/[locale]/account', 'page');
    return { ok: true };
  });
}

export async function saveAddressAction(input: unknown): Promise<AccountResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: accountProblem(parsed.error) };
  return attempt(async () => {
    const customer = await currentCustomer();
    if (!customer) return { ok: false, error: 'signedOut' };
    await saveAddress(customer.id, parsed.data);
    return { ok: true };
  });
}

export async function cancelOrderAction(orderId: unknown): Promise<{ ok: boolean }> {
  if (!isOrderId(orderId)) return { ok: false };
  try {
    const customer = await currentCustomer();
    if (!customer) return { ok: false };
    return { ok: await cancelOrder(customer.id, orderId) };
  } catch (error) {
    console.error('cancel failed', error);
    return { ok: false };
  }
}
