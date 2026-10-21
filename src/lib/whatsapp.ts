import { dictionary, format, formatDay, localized, type Locale } from './i18n';
import { formatPrice } from './money';
import type { OrderSummary } from './shop-types';

/** wa.me wants the number in international form, digits only (no +, spaces or leading 00). */
export function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** The order as a WhatsApp message the shopper sends to the farm. */
export function orderMessage(locale: Locale, order: OrderSummary): string {
  const t = dictionary(locale);
  const lines = order.lines.map((line) => {
    const unit = line.kind === 'product' && line.unitName ? ` (${line.unitName})` : '';
    return `• ${line.quantity} × ${line.name}${unit} — ${formatPrice(line.lineTotalUsd)}`;
  });
  return [
    format(t.order.whatsappIntro, { reference: order.reference }),
    ...lines,
    `${t.checkout.deliveryFee}: ${formatPrice(order.deliveryFeeUsd)}`,
    `${t.checkout.total}: ${formatPrice(order.totalUsd)}`,
    '',
    `${t.order.delivery}: ${formatDay(locale, order.deliveryDate)}, ${order.startTime}–${order.endTime}`,
    `${localized(locale, order.zoneNameEn, order.zoneNameAr)} — ${order.addressLine}`,
    `${order.contactName} · ${order.phone}`,
  ].join('\n');
}

export function whatsappLink(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
