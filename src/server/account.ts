import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { farmId, pool } from './db';
import { hashPassword, hashToken, newSessionToken, verifyPassword } from './passwords';
import { phoneKey, sessionDays } from '@/lib/account';
import type { AccountAddress, AccountOrder, Customer } from '@/lib/shop-types';

// Signed-in shoppers. The browser holds a random token in an http-only cookie; the
// database keeps only its SHA-256 (ShopSession) and is reached through the shop_*
// account functions, so the website never reads or writes sessions directly.

export const SESSION_COOKIE = 'msb_session';

async function setSessionCookie(token: string, remember: boolean) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: sessionDays(true) * 24 * 60 * 60 } : {}),
  });
}

async function sessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

/** The signed-in shopper for this request, or null. */
export const currentCustomer = cache(async (): Promise<Customer | null> => {
  const token = await sessionToken();
  if (!token) return null;
  try {
    const { rows } = await pool().query<Customer>('SELECT id::text, name, phone, language FROM shop_session_customer($1,$2)', [farmId(), hashToken(token)]);
    return rows[0] ?? null;
  } catch (error) {
    console.error('session lookup failed', error);
    return null;
  }
});

export type SignInResult = 'ok' | 'wrong' | 'locked' | 'taken';

export async function register(input: { name: string; phone: string; password: string; remember: boolean; locale: string }): Promise<SignInResult> {
  const { token, tokenHash } = newSessionToken();
  const command = {
    name: input.name, phone: input.phone, language: input.locale, passwordHash: await hashPassword(input.password),
    tokenHash, days: sessionDays(input.remember),
  };
  try {
    await pool().query('SELECT shop_register($1,$2::jsonb)', [farmId(), JSON.stringify(command)]);
  } catch (error) {
    if (error instanceof Error && error.message === 'SHOP_PHONE_TAKEN') return 'taken';
    throw error;
  }
  await setSessionCookie(token, input.remember);
  return 'ok';
}

export async function signIn(input: { phone: string; password: string; remember: boolean }): Promise<SignInResult> {
  const { rows } = await pool().query<{ id: string; passwordHash: string | null; locked: boolean }>(
    `SELECT id::text, "passwordHash", coalesce("lockedUntil">now(),false) AS locked
       FROM "ShopCustomer" WHERE "farmId"=$1 AND "phoneKey"=$2`,
    [farmId(), phoneKey(input.phone)],
  );
  const row = rows[0];
  if (row?.locked) return 'locked';
  const ok = await verifyPassword(input.password, row?.passwordHash ?? null);
  if (!row || !row.passwordHash) return 'wrong';
  const { token, tokenHash } = newSessionToken();
  const result = await pool().query<{ result: SignInResult }>('SELECT shop_login_record($1,$2,$3,$4,$5) AS result', [
    farmId(), row.id, ok, ok ? tokenHash : null, ok ? sessionDays(input.remember) : null,
  ]);
  const outcome = result.rows[0].result;
  if (outcome === 'ok') await setSessionCookie(token, input.remember);
  return outcome;
}

export async function signOut(): Promise<void> {
  const token = await sessionToken();
  if (token) await pool().query('SELECT shop_logout($1,$2)', [farmId(), hashToken(token)]).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
}

/** 'ok', 'currentWrong' or 'signedOut'. Other devices are signed out. */
export async function changePassword(current: string, next: string): Promise<'ok' | 'currentWrong' | 'signedOut'> {
  const token = await sessionToken();
  const customer = await currentCustomer();
  if (!token || !customer) return 'signedOut';
  const { rows } = await pool().query<{ passwordHash: string | null }>('SELECT "passwordHash" FROM "ShopCustomer" WHERE id=$1 AND "farmId"=$2', [customer.id, farmId()]);
  if (!(await verifyPassword(current, rows[0]?.passwordHash ?? null))) return 'currentWrong';
  await pool().query('SELECT shop_change_password($1,$2,$3)', [farmId(), hashToken(token), await hashPassword(next)]);
  return 'ok';
}

/** Adds this browser's guest orders placed with the shopper's mobile to the account. */
export async function claimOrders(orderIds: string[]): Promise<number> {
  const token = await sessionToken();
  if (!token || orderIds.length === 0) return 0;
  const { rows } = await pool().query<{ added: number }>('SELECT shop_claim_orders($1,$2,$3::uuid[]) AS added', [farmId(), hashToken(token), orderIds.slice(0, 30)]);
  return rows[0]?.added ?? 0;
}

export async function updateName(customerId: string, name: string): Promise<void> {
  await pool().query('UPDATE "ShopCustomer" SET name=$3, "updatedAt"=now() WHERE id=$1 AND "farmId"=$2', [customerId, farmId(), name]);
}

export async function accountOrders(customerId: string): Promise<AccountOrder[]> {
  const { rows } = await pool().query(
    `SELECT o.id, o.reference, o.status, o."paymentStatus", o."paymentMethod",
            to_char(o."deliveryDate",'YYYY-MM-DD') AS "deliveryDate", s."startTime", s."endTime",
            o."totalUsd"::text AS "totalUsd", to_char(o."createdAt",'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "placedAt",
            (SELECT coalesce(sum(l.quantity),0)::int FROM "ShopOrderLine" l WHERE l."orderId"=o.id) AS "itemCount"
       FROM "ShopOrder" o JOIN "ShopDeliverySlot" s ON s.id=o."slotId"
      WHERE o."farmId"=$1 AND o."shopCustomerId"=$2
      ORDER BY o."createdAt" DESC LIMIT 100`,
    [farmId(), customerId],
  );
  return rows as AccountOrder[];
}

export async function defaultAddress(customerId: string): Promise<AccountAddress | null> {
  const { rows } = await pool().query<AccountAddress>(
    `SELECT "zoneId"::text, line, notes FROM "ShopAddress" WHERE "farmId"=$1 AND "shopCustomerId"=$2 ORDER BY "isDefault" DESC, "createdAt" DESC LIMIT 1`,
    [farmId(), customerId],
  );
  return rows[0] ?? null;
}

/** Keeps one saved delivery address per shopper, replaced each time it changes. */
export async function saveAddress(customerId: string, address: AccountAddress): Promise<void> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM "ShopAddress" WHERE "farmId"=$1 AND "shopCustomerId"=$2', [farmId(), customerId]);
    await client.query(
      `INSERT INTO "ShopAddress" (id,"farmId","shopCustomerId","zoneId",line,notes,"isDefault") VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,true)`,
      [farmId(), customerId, address.zoneId, address.line, address.notes],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Cancels the shopper's own order while the farm hasn't handled it yet. */
export async function cancelOrder(customerId: string, orderId: string): Promise<boolean> {
  try {
    await pool().query('SELECT shop_cancel_order($1,$2,$3)', [farmId(), orderId, customerId]);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'SHOP_ORDER_LOCKED') return false;
    throw error;
  }
}
