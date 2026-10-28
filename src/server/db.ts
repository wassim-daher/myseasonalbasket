import 'server-only';
import pg from 'pg';
import { normalizePem } from '@/lib/pem';

// One small pool per server instance, as the restricted shop_runtime role.
// That role can only read the shop tables and call the shop_* functions.

const globalPool = globalThis as unknown as { shopPool?: pg.Pool };

function firstWord(value: string | undefined) {
  return value?.trim().split(/\s+/)[0] ?? '';
}

export function pool(): pg.Pool {
  // Only the address itself: a value pasted with the next printed line still works.
  const connectionString = firstWord(process.env.SHOP_DATABASE_URL);
  if (!connectionString) throw new Error('SHOP_DATABASE_NOT_CONFIGURED');
  const ca = process.env.SHOP_DATABASE_CA_CERT;
  return (globalPool.shopPool ??= new pg.Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ...(ca ? { ssl: { ca: normalizePem(ca), rejectUnauthorized: true } } : {}),
  }));
}

export function farmId(): string {
  const id = firstWord(process.env.SHOP_FARM_ID);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('SHOP_FARM_NOT_CONFIGURED');
  return id;
}

export const isConfigured = () => Boolean(firstWord(process.env.SHOP_DATABASE_URL) && firstWord(process.env.SHOP_FARM_ID));
