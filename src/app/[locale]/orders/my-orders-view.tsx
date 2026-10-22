'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { format, formatDay, type Dictionary, type Locale } from '@/lib/i18n';
import { loadMyOrders, saveMyOrder } from '@/lib/my-orders';
import { formatPrice } from '@/lib/money';
import type { MyOrder } from '@/lib/shop-types';
import { findOrderAction } from './actions';

type Loaded = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; orders: MyOrder[] };

export function MyOrdersView({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });

  useEffect(() => {
    const ids = loadMyOrders();
    const request: Promise<{ orders: MyOrder[] }> = ids.length === 0
      ? Promise.resolve({ orders: [] })
      : fetch('/api/my-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
    request
      .then((data) => setLoaded({ state: 'ready', orders: data.orders }))
      .catch(() => setLoaded({ state: 'failed' }));
  }, []);

  return (
    <div className="orders-layout">
      <section aria-live="polite">
        <p className="soft">{t.orders.lead}</p>
        {loaded.state === 'loading' && <p className="muted" style={{ marginTop: 16 }}>{t.orders.loading}</p>}
        {loaded.state === 'failed' && <p className="alert" style={{ marginTop: 16 }}>{t.orders.failed}</p>}
        {loaded.state === 'ready' && loaded.orders.length === 0 && <p className="empty-note">{t.orders.empty}</p>}
        {loaded.state === 'ready' && loaded.orders.length > 0 && (
          <ul className="order-list">
            {loaded.orders.map((o) => <OrderRow key={o.id} order={o} locale={locale} t={t} />)}
          </ul>
        )}
      </section>
      <TrackForm locale={locale} t={t} />
    </div>
  );
}

function OrderRow({ order, locale, t }: { order: MyOrder; locale: Locale; t: Dictionary }) {
  const placed = formatDay(locale, order.placedAt.slice(0, 10));
  const closed = order.status === 'rejected' || order.status === 'cancelled';
  return (
    <li className="order-row">
      <div className="order-row-head">
        <strong dir="ltr">{order.reference}</strong>
        <span className={`status-pill${closed ? ' status-closed' : ''}`}>{t.order.status[order.status]}</span>
        {order.paymentStatus === 'paid' && <span className="status-pill">{t.order.paid}</span>}
      </div>
      <p className="small muted">{format(t.orders.placedOn, { date: placed })} · {order.itemCount === 1 ? t.orders.oneItem : format(t.orders.items, { count: order.itemCount })} · {formatPrice(order.totalUsd)}</p>
      {!closed && (
        <p className="small">{format(t.orders.deliveryOn, { date: formatDay(locale, order.deliveryDate), time: `\u2066${order.startTime}–${order.endTime}\u2069` })}</p>
      )}
      <Link href={`/${locale}/order/${order.id}`} className="btn btn-secondary order-row-open">{t.orders.open}</Link>
    </li>
  );
}

function TrackForm({ locale, t }: { locale: Locale; t: Dictionary }) {
  const router = useRouter();
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<'notFound' | 'tryLater' | null>(null);
  const [pending, start] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await findOrderAction(reference, phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saveMyOrder(result.orderId);
      router.push(`/${locale}/order/${result.orderId}`);
    });
  }

  return (
    <section className="panel track-panel" aria-labelledby="track-title">
      <h2 id="track-title">{t.orders.trackTitle}</h2>
      <p className="small soft" style={{ margin: '4px 0 14px' }}>{t.orders.trackLead}</p>
      <form onSubmit={submit} className="track-form">
        <label className="field">{t.orders.reference}
          <input value={reference} onChange={(e) => setReference(e.target.value)} required maxLength={40} dir="ltr" autoCapitalize="characters" placeholder={t.orders.referenceHint} />
        </label>
        <label className="field">{t.orders.phone}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={40} dir="ltr" type="tel" inputMode="tel" autoComplete="tel" />
        </label>
        {error && <p className="alert" role="alert">{t.orders[error]}</p>}
        <button type="submit" className="btn btn-primary" disabled={pending}>{t.orders.trackButton}</button>
      </form>
    </section>
  );
}
