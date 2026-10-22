import { describe, expect, it } from 'vitest';
import { checkoutSchema, firstProblem, isShopError } from '@/lib/checkout';
import { dictionary, format, formatDay } from '@/lib/i18n';
import { formatPrice, formatUsd, toCents } from '@/lib/money';
import { orderMessage, whatsappLink, whatsappNumber } from '@/lib/whatsapp';
import type { OrderSummary } from '@/lib/shop-types';

const uuid = '11111111-1111-4111-8111-111111111111';
const valid = {
  requestKey: uuid, locale: 'en', contactName: ' Rana ', phone: '+961 70-123 456', email: '', zoneId: uuid, slotId: uuid,
  deliveryDate: '2026-10-24', addressLine: 'Main road, building 4', addressNotes: '', paymentMethod: 'cod', notes: '',
  lines: [{ kind: 'product', id: uuid, quantity: 2 }],
};

describe('money', () => {
  it('works in exact cents', () => {
    expect(toCents('12.5')).toBe(1250);
    expect(toCents('0.10')).toBe(10);
    expect(toCents(3)).toBe(300);
    expect(() => toCents('1.234')).toThrow();
    expect(formatUsd(123456)).toBe('$1,234.56');
    expect(formatPrice('7')).toBe('$7.00');
  });
});

describe('checkout input', () => {
  it('accepts a valid order and tidies the phone number', () => {
    const parsed = checkoutSchema.parse(valid);
    expect(parsed.phone).toBe('+96170123456');
    expect(parsed.contactName).toBe('Rana');
  });
  it('names the field that needs fixing', () => {
    expect(firstProblem(checkoutSchema.safeParse({ ...valid, phone: 'call me' }).error!)).toBe('phone');
    expect(firstProblem(checkoutSchema.safeParse({ ...valid, contactName: '  ' }).error!)).toBe('name');
    expect(firstProblem(checkoutSchema.safeParse({ ...valid, email: 'x@' }).error!)).toBe('email');
    expect(firstProblem(checkoutSchema.safeParse({ ...valid, lines: [] }).error!)).toBe('cart');
    expect(checkoutSchema.safeParse({ ...valid, lines: [{ kind: 'product', id: uuid, quantity: 100 }] }).success).toBe(false);
  });
  it('recognises only the database’s own refusal codes', () => {
    expect(isShopError('SHOP_STOCK')).toBe(true);
    expect(isShopError('relation "x" does not exist')).toBe(false);
  });
});

describe('languages', () => {
  it('has every English message in Arabic too', () => {
    const keys = (o: object, prefix = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    expect(keys(dictionary('ar')).sort()).toEqual(keys(dictionary('en')).sort());
  });
  it('fills placeholders and names delivery days', () => {
    expect(format('Only {count} left', { count: 3 })).toBe('Only 3 left');
    expect(formatDay('en', '2026-10-24')).toBe('Saturday 24 Oct');
    expect(formatDay('ar', '2026-10-24').startsWith('السبت 24')).toBe(true);
  });
});

describe('whatsapp', () => {
  const order: OrderSummary = {
    id: uuid, reference: 'WEB-2026-0001', status: 'submitted', contactName: 'Rana', phone: '+96170123456', language: 'en',
    zoneNameEn: 'Jounieh', zoneNameAr: 'جونية', deliveryDate: '2026-10-24', startTime: '10:00', endTime: '13:00',
    addressLine: 'Main road', paymentMethod: 'whatsapp', paymentStatus: 'pending', placedAt: '2026-10-22T08:00:00Z', subtotalUsd: '25.00', deliveryFeeUsd: '3.00', totalUsd: '28.00',
    lines: [{ kind: 'product', name: 'Olive oil', unitName: '1 L bottle', quantity: 2, lineTotalUsd: '25.00' }],
  };
  it('builds a wa.me link with the order', () => {
    expect(whatsappNumber('+961 70 000 000')).toBe('96170000000');
    expect(whatsappNumber('0096170000000')).toBe('96170000000');
    expect(whatsappNumber('123')).toBeNull();
    const message = orderMessage('en', order);
    expect(message).toContain('WEB-2026-0001');
    expect(message).toContain('2 × Olive oil (1 L bottle) — $25.00');
    expect(message).toContain('Total: $28.00');
    expect(whatsappLink('+961 70 000 000', message)).toMatch(/^https:\/\/wa\.me\/96170000000\?text=/);
  });
});
