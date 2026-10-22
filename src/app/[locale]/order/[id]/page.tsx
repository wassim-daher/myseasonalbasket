import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dictionary, format, formatDay, isLocale, localized } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import { orderMessage, whatsappLink } from '@/lib/whatsapp';
import { OrderProgress } from '@/components/order-progress';
import { RememberOrder } from '@/components/remember-order';
import { getOrder, getSettings } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).checkout.summary, robots: { index: false } } : {};
}

// The order's id is a random UUID, so only the shopper who placed it has this link.
export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
  if (!order) notFound();

  const total = formatPrice(order.totalUsd);
  const wa = settings.whatsappPhone ? whatsappLink(settings.whatsappPhone, orderMessage(locale, order)) : null;
  const paymentLine =
    order.paymentMethod === 'wish' && settings.wishAccount ? format(t.order.payWish, { total, account: settings.wishAccount })
      : order.paymentMethod === 'omt' && settings.omtAccount ? format(t.order.payOmt, { total, account: settings.omtAccount })
        : order.paymentMethod === 'cod' ? format(t.order.payCod, { total })
          : t.methods[order.paymentMethod].label;

  return (
    <div className="container">
      <div className="confirm">
        <RememberOrder orderId={order.id} />
        <span className="confirm-badge" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h1>{format(t.order.thanks, { name: order.contactName.split(' ')[0] })}</h1>
        <p style={{ fontSize: 18 }}>{format(t.order.received, { reference: order.reference })}</p>
        <span className={`status-pill${order.status === 'rejected' || order.status === 'cancelled' ? ' status-closed' : ''}`}>{t.order.status[order.status]}</span>
        {order.status === 'submitted' && <p className="soft">{t.order.next}</p>}

        <OrderProgress order={order} locale={locale} t={t} />

        {order.paymentMethod === 'whatsapp' && wa && (
          <a href={wa} className="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">{t.order.whatsappCta}</a>
        )}

        <section className="panel" aria-labelledby="order-lines">
          <h2 id="order-lines">{t.checkout.summary}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {order.lines.map((line, i) => (
              <div key={i} className="summary-row">
                <span>{line.quantity} × {line.name}{line.kind === 'product' && line.unitName ? <span className="small muted"> · {line.unitName}</span> : null}</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(line.lineTotalUsd)}</span>
              </div>
            ))}
            <div className="summary-row soft" style={{ borderTop: '1px solid #edf0e6', paddingTop: 10 }}><span>{t.checkout.deliveryFee}</span><span>{formatPrice(order.deliveryFeeUsd)}</span></div>
            <div className="summary-row summary-total"><span>{t.checkout.total}</span><span>{total}</span></div>
          </div>
        </section>

        <section className="panel">
          <h2>{t.order.delivery}</h2>
          <p style={{ marginTop: 8 }}>{formatDay(locale, order.deliveryDate)}, <span dir="ltr">{order.startTime}–{order.endTime}</span></p>
          <p className="soft">{localized(locale, order.zoneNameEn, order.zoneNameAr)} — {order.addressLine}</p>
        </section>

        <section className="panel">
          <h2>{t.order.payment}</h2>
          <p style={{ marginTop: 8 }}>{paymentLine}</p>
        </section>

        <div className="actions">
          {order.paymentMethod !== 'whatsapp' && wa && (
            <a href={wa} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">{t.footer.whatsapp}</a>
          )}
          <Link href={`/${locale}/orders`} className="btn btn-secondary">{t.order.myOrders}</Link>
          <Link href={`/${locale}`} className="btn btn-secondary">{t.order.backHome}</Link>
        </div>
      </div>
    </div>
  );
}
