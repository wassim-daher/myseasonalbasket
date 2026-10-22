import 'server-only';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

// Passwords are stored as scrypt$N$r$p$salt$hash (base64url). Farm Agent writes the
// same format when staff set a temporary password.

const N = 16384, R = 8, P = 1, KEY = 64;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password.normalize('NFKC'), salt, KEY, { N: n, r, p, maxmem: 128 * n * r * 2 }, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const parts = (stored ?? '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    // Same work as a real check, so timing doesn't tell which mobiles have accounts.
    await scrypt(password, randomBytes(16), N, R, P);
    return false;
  }
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every(Number.isInteger) || n > 1 << 17 || r > 16 || p > 4) return false;
  const expected = Buffer.from(parts[5], 'base64url');
  const actual = await scrypt(password, Buffer.from(parts[4], 'base64url'), n, r, p);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** A new random session token and the hash the database keeps of it. */
export function newSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
