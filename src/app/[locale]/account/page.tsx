import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { format, formatDay, isLocale, dictionary, type Dictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import { displayStatus, isPaid } from '@/lib/order-progress';
import type { AccountOrder } from '@/lib/shop-types';
import { accountOrders, currentCustomer, defaultAddress } from '@/server/account';
import { getZones } from '@/server/shop';
import { AddressForm, LogoutButton, NameForm, PasswordForm } from './account-panels';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).account.title, robots: { index: false } } : {};
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const customer = await currentCustomer();
  if (!customer) redirect(`/${locale}/account/login?next=${encodeURIComponent(`/${locale}/account`)}`);
  const t = dictionary(locale);
  const a = t.account;
  const [orders, address, zones] = await Promise.all([accountOrders(customer.id), defaultAddress(customer.id), getZones()]);

  return (
    <div className="container account">
      <h1 className="page-title">{format(a.hello, { name: customer.name.split(' ')[0] })}</h1>
      <div className="account-layout">
        <section aria-labelledby="my-orders">
          <h2 id="my-orders" className="account-heading">{a.orders}</h2>
          {orders.length === 0 ? (
            <div className="empty-note">
              <p>{a.noOrders}</p>
              <Link href={`/${locale}`} className="btn btn-primary" style={{ marginTop: 12 }}>{a.shopNow}</Link>
            </div>
          ) : (
            <ul className="order-list">
              {orders.map((o) => <OrderRow key={o.id} order={o} locale={locale} t={t} />)}
            </ul>
          )}
        </section>
        <aside className="account-side">
          <section className="panel" aria-labelledby="details">
            <h2 id="details">{a.details}</h2>
            <NameForm t={t} name={customer.name} />
            <p className="small soft" style={{ marginTop: 10 }}><span dir="ltr">{customer.phone}</span> · {a.phoneFixed}</p>
          </section>
          <section className="panel" aria-labelledby="address">
            <h2 id="address">{a.address}</h2>
            <p className="small soft">{address ? a.addressLead : a.noAddress}</p>
            <AddressForm t={t} locale={locale} zones={zones} address={address} />
          </section>
          <section className="panel" aria-labelledby="password">
            <h2 id="password">{a.passwordTitle}</h2>
            <PasswordForm t={t} />
          </section>
          <LogoutButton t={t} locale={locale} />
        </aside>
      </div>
    </div>
  );
}

function OrderRow({ order, locale, t }: { order: AccountOrder; locale: Locale; t: Dictionary }) {
  const a = t.account;
  const status = displayStatus(order);
  const closed = status === 'rejected' || status === 'cancelled';
  return (
    <li className="order-row">
      <div className="order-row-head">
        <strong dir="ltr">{order.reference}</strong>
        <span className={`status-pill${closed ? ' status-closed' : ''}`}>{t.order.status[status]}</span>
        {isPaid(order) && !closed && <span className="status-pill">{t.order.paid}</span>}
      </div>
      <p className="small muted">
        {format(a.placedOn, { date: formatDay(locale, order.placedAt.slice(0, 10)) })} · {order.itemCount === 1 ? a.oneItem : format(a.items, { count: order.itemCount })} · {formatPrice(order.totalUsd)}
      </p>
      {!closed && status !== 'delivered' && (
        <p className="small">{format(a.deliveryOn, { date: formatDay(locale, order.deliveryDate), time: `⁦${order.startTime}–${order.endTime}⁩` })}</p>
      )}
      <Link href={`/${locale}/order/${order.id}`} className="btn btn-secondary order-row-open">{a.open}</Link>
    </li>
  );
}
