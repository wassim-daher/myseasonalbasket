import { describe, expect, it } from 'vitest';
import { accountProblem, loginSchema, phoneKey, registerSchema, safeNext } from '@/lib/account';

describe('shopper accounts', () => {
  it('matches mobile numbers however they are typed, like the database', () => {
    for (const typed of ['+961 71 555 333', '0096171555333', '71555333', '071 555 333']) expect(phoneKey(typed)).toBe('71555333');
    expect(phoneKey('03 123 456')).toBe('3123456');
    expect(phoneKey('+9613123456')).toBe('3123456');
  });

  it('checks the sign-up form', () => {
    const ok = { name: 'Maya', phone: '+961 71 555 333', password: 'olive-tree', remember: true, locale: 'en' };
    expect(registerSchema.parse(ok).phone).toBe('+96171555333');
    const short = registerSchema.safeParse({ ...ok, password: 'short' });
    expect(!short.success && accountProblem(short.error)).toBe('passwordShort');
    const phone = registerSchema.safeParse({ ...ok, phone: '12345' });
    expect(!phone.success && accountProblem(phone.error)).toBe('phone');
    expect(loginSchema.safeParse({ phone: '71555333', password: '', remember: false }).success).toBe(false);
  });

  it('only returns to pages inside the store after signing in', () => {
    expect(safeNext('/en/checkout', 'en')).toBe('/en/checkout');
    expect(safeNext('https://evil.example', 'en')).toBe('/en/account');
    expect(safeNext('//evil.example', 'ar')).toBe('/ar/account');
  });
});

describe('password hashing', async () => {
  const { hashPassword, verifyPassword, newSessionToken, hashToken } = await import('@/server/passwords');
  it('stores a salted scrypt hash the database accepts and verifies it', async () => {
    const stored = await hashPassword('olive-tree');
    expect(stored).toMatch(/^scrypt\$[0-9]+\$[0-9]+\$[0-9]+\$[A-Za-z0-9_-]{16,64}\$[A-Za-z0-9_-]{40,128}$/);
    expect(stored).not.toBe(await hashPassword('olive-tree'));
    expect(await verifyPassword('olive-tree', stored)).toBe(true);
    expect(await verifyPassword('olive-Tree', stored)).toBe(false);
    expect(await verifyPassword('olive-tree', null)).toBe(false);
  });
  it('keeps only a hash of the session token', () => {
    const { token, tokenHash } = newSessionToken();
    expect(token).toHaveLength(43);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(tokenHash);
  });
});
