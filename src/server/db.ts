import 'server-only';
import pg from 'pg';

// One small pool per server instance, as the restricted shop_runtime role.
// That role can only read the shop tables and call the shop_* functions.

const globalPool = globalThis as unknown as { shopPool?: pg.Pool };

function normalizePem(value: string) {
  return value.replace(/\\n/g, '\n').trim();
}

export function pool(): pg.Pool {
  const connectionString = process.env.SHOP_DATABASE_URL;
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
  const id = process.env.SHOP_FARM_ID;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('SHOP_FARM_NOT_CONFIGURED');
  return id;
}

export const isConfigured = () => Boolean(process.env.SHOP_DATABASE_URL && process.env.SHOP_FARM_ID);
