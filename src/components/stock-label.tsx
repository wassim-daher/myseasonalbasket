import { format, type Dictionary } from '@/lib/i18n';

export const LOW_STOCK = 5;

export function StockLabel({ available, t }: { available: number; t: Dictionary }) {
  if (available <= 0) return <p className="stock stock-out">{t.product.soldOut}</p>;
  if (available <= LOW_STOCK) return <p className="stock stock-low">{format(t.product.fewLeft, { count: available })}</p>;
  return <p className="stock stock-ok">{t.product.inStock}</p>;
}
