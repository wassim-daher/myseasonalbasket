// Money is handled in whole cents so sums never drift. Prices are shown in USD.

/** "12.50" → 1250. Throws on anything that is not a plain amount. */
export function toCents(amount: string | number): number {
  const text = typeof amount === 'number' ? amount.toFixed(2) : amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error(`Invalid amount: ${amount}`);
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** 1250 → "$12.50" (always Latin digits so prices read the same in both languages). */
export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const fraction = String(abs % 100).padStart(2, '0');
  return `${sign}$${whole}.${fraction}`;
}

export const formatPrice = (amount: string | number) => formatUsd(toCents(amount));
