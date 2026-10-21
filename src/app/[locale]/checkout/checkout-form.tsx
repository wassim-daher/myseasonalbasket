'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { placeOrderAction } from './actions';
import { useCart } from '@/components/cart-context';
import { priceCart } from '@/lib/cart';
import { format, formatDay, localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatUsd, toCents } from '@/lib/money';
import type { Basket, CatalogProduct, DeliveryOption, DeliveryZone, PaymentMethod } from '@/lib/shop-types';

const DETAILS_KEY = 'msb-details-v1';

type Details = { contactName: string; phone: string; email: string; zoneId: string; addressLine: string; addressNotes: string };
const blankDetails: Details = { contactName: '', phone: '', email: '', zoneId: '', addressLine: '', addressNotes: '' };

function loadDetails(): Details {
  try {
    const raw = JSON.parse(window.localStorage.getItem(DETAILS_KEY) ?? '{}') as Partial<Details>;
    const pick = (v: unknown) => (typeof v === 'string' ? v.slice(0, 500) : '');
    return { contactName: pick(raw.contactName), phone: pick(raw.phone), email: pick(raw.email), zoneId: pick(raw.zoneId), addressLine: pick(raw.addressLine), addressNotes: pick(raw.addressNotes) };
  } catch {
    return blankDetails;
  }
}

function saveDetails(details: Details) {
  try {
    window.localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  } catch {
    // Storage blocked: the shopper simply types their details next time.
  }
}

type Props = {
  locale: Locale;
  t: Dictionary;
  products: CatalogProduct[];
  baskets: Basket[];
  zones: DeliveryZone[];
  ordersOpen: boolean;
  paymentMethods: PaymentMethod[];
};

export function CheckoutForm({ locale, t, products, baskets, zones, ordersOpen, paymentMethods }: Props) {
  const router = useRouter();
  const { cart, ready, clear } = useCart();
  const priced = priceCart(cart, products, baskets);
  const [details, setDetails] = useState<Details>(blankDetails);
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState<PaymentMethod | ''>(paymentMethods[0] ?? '');
  const [notes, setNotes] = useState('');
  const [options, setOptions] = useState<DeliveryOption[] | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  // One key per checkout: a retry after a dropped connection returns the same order.
  const [requestKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    // Fill in the details this shopper used last time (kept only in their browser).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetails((current) => ({ ...current, ...loadDetails() }));
  }, []);

  const zone = zones.find((z) => z.id === details.zoneId);

  useEffect(() => {
    if (!zone) return;
    let cancelled = false;
    fetch(`/api/delivery-options?zone=${zone.id}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ options: DeliveryOption[] }>)
      .then((data) => { if (!cancelled) setOptions(data.options); })
      .catch(() => { if (!cancelled) setOptions([]); });
    return () => { cancelled = true; };
  }, [zone]);

  const visibleOptions = zone ? options : null;
  const slotKey = (o: DeliveryOption) => `${o.slotId}|${o.deliveryDate}`;
  const chosen = visibleOptions?.find((o) => slotKey(o) === slot);
  const feeCents = zone ? toCents(zone.feeUsd) : 0;
  const minCents = zone ? toCents(zone.minOrderUsd) : 0;
  const belowMin = Boolean(zone) && priced.subtotalCents < minCents;
  const totalCents = priced.subtotalCents + feeCents;

  const update = (field: keyof Details) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setDetails((d) => ({ ...d, [field]: value }));
    if (field === 'zoneId') { setSlot(''); setOptions(null); }
  };

  const errorText = useMemo(() => {
    if (!error) return '';
    const messages = t.errors as Record<string, string>;
    return messages[error] ?? t.errors.unknown;
  }, [error, t]);

  if (!ready) return <div className="container"><h1 className="page-title">{t.checkout.title}</h1></div>;

  if (priced.lines.length === 0) {
    return (
      <div className="container">
        <h1 className="page-title">{t.checkout.title}</h1>
        <div className="empty">
          <p style={{ fontSize: 18 }}>{t.cart.empty}</p>
          <Link href={`/${locale}`} className="btn btn-primary">{t.cart.keepShopping}</Link>
        </div>
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!priced.allAvailable) { setError('SHOP_STOCK'); return; }
    if (!zone) { setError('SHOP_ZONE'); return; }
    if (!chosen) { setError('SHOP_SLOT'); return; }
    if (!payment) { setError('SHOP_PAYMENT'); return; }
    startTransition(async () => {
      const result = await placeOrderAction({
        requestKey,
        locale,
        contactName: details.contactName,
        phone: details.phone,
        email: details.email,
        zoneId: zone.id,
        slotId: chosen.slotId,
        deliveryDate: chosen.deliveryDate,
        addressLine: details.addressLine,
        addressNotes: details.addressNotes,
        paymentMethod: payment,
        notes,
        lines: cart.lines,
      });
      if (!result.ok) {
        setError(result.error);
        if (result.error === 'SHOP_SLOT' || result.error === 'SHOP_SLOT_FULL') { setSlot(''); setOptions(null); }
        return;
      }
      saveDetails(details);
      clear();
      router.push(`/${locale}/order/${result.orderId}`);
    });
  };

  return (
    <div className="container">
      <h1 className="page-title">{t.checkout.title}</h1>
      {!ordersOpen && <p className="alert" role="status" style={{ marginBottom: 20 }}>{t.checkout.closed}</p>}
      <div className="cart-layout">
        <form className="form" onSubmit={submit} noValidate>
          <fieldset className="form-section">
            <legend>{t.checkout.details}</legend>
            <div className="fields">
              <label className="field">{t.checkout.name}
                <input type="text" name="name" autoComplete="name" required maxLength={120} value={details.contactName} onChange={update('contactName')} aria-invalid={error === 'name'} />
              </label>
              <label className="field">{t.checkout.phone}
                <input type="tel" name="phone" autoComplete="tel" inputMode="tel" required placeholder="+961 70 123 456" dir="ltr" maxLength={24} value={details.phone} onChange={update('phone')} aria-invalid={error === 'phone'} />
              </label>
              <label className="field">{t.checkout.email}
                <input type="email" name="email" autoComplete="email" dir="ltr" maxLength={200} value={details.email} onChange={update('email')} aria-invalid={error === 'email'} />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{t.checkout.delivery}</legend>
            <label className="field">{t.checkout.zone}
              <select name="zone" required value={details.zoneId} onChange={update('zoneId')}>
                <option value="">{t.checkout.chooseZone}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {localized(locale, z.nameEn, z.nameAr)} — {format(t.home.deliveryFee, { fee: formatUsd(toCents(z.feeUsd)) })}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">{t.checkout.address}
              <input type="text" name="address" autoComplete="street-address" required maxLength={500} placeholder={t.checkout.addressHint} value={details.addressLine} onChange={update('addressLine')} aria-invalid={error === 'address'} />
            </label>
            <label className="field">{t.checkout.addressNotes}
              <input type="text" name="addressNotes" maxLength={500} value={details.addressNotes} onChange={update('addressNotes')} />
            </label>
            {zone && (
              <div role="radiogroup" aria-label={t.checkout.day}>
                <p style={{ fontWeight: 500, marginBottom: 8 }}>{t.checkout.day}</p>
                {visibleOptions === null ? (
                  <p className="muted small">…</p>
                ) : visibleOptions.length === 0 ? (
                  <p className="muted">{t.checkout.noDays}</p>
                ) : (
                  <div className="choices">
                    {visibleOptions.map((o) => (
                      <label key={slotKey(o)} className="choice">
                        <input type="radio" name="slot" value={slotKey(o)} checked={slot === slotKey(o)} onChange={() => setSlot(slotKey(o))} />
                        <span className="choice-text">
                          <strong>{formatDay(locale, o.deliveryDate)}</strong>
                          <span className="small soft" dir="ltr">{o.startTime}–{o.endTime}</span>
                          {o.spotsLeft !== null && o.spotsLeft <= 3 && <span className="small stock-low">{format(t.checkout.spotsLeft, { count: o.spotsLeft })}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="form-section">
            <legend>{t.checkout.payment}</legend>
            <div className="choices-list" role="radiogroup" aria-label={t.checkout.payment}>
              {paymentMethods.map((m) => (
                <label key={m} className="choice">
                  <input type="radio" name="payment" value={m} checked={payment === m} onChange={() => setPayment(m)} />
                  <span className="choice-dot" aria-hidden="true" />
                  <span className="choice-text">
                    <strong>{t.methods[m].label}</strong>
                    <span className="small muted">{t.methods[m].note}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="field">{t.checkout.notes}
              <textarea name="notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </fieldset>

          {errorText && <p className="alert" role="alert">{errorText}</p>}

          <button type="submit" className="btn btn-primary btn-large btn-block" disabled={pending || !ordersOpen || belowMin || !priced.allAvailable}>
            {pending ? t.checkout.placing : payment === 'whatsapp' ? t.checkout.placeWhatsapp : t.checkout.place}
          </button>
          <p className="small muted">{t.checkout.confirmNote}</p>
        </form>

        <aside className="summary" aria-label={t.checkout.summary}>
          <h2>{t.checkout.summary}</h2>
          {priced.lines.map((line) => (
            <div key={`${line.kind}:${line.id}`} className="summary-row">
              <span>
                {line.quantity} × {line.nameEn ? localized(locale, line.nameEn, line.nameAr) : t.cart.unavailable}
                {line.unitNameEn && <span className="small muted"> · {localized(locale, line.unitNameEn, line.unitNameAr)}</span>}
              </span>
              <span style={{ fontWeight: 600 }}>{line.available ? formatUsd(line.lineCents) : '—'}</span>
            </div>
          ))}
          <div className="summary-row soft" style={{ borderTop: '1px solid #edf0e6', paddingTop: 12 }}>
            <span>{t.checkout.deliveryFee}</span>
            <span>{zone ? formatUsd(feeCents) : '—'}</span>
          </div>
          <div className="summary-row summary-total"><span>{t.checkout.total}</span><span>{formatUsd(totalCents)}</span></div>
          {belowMin && <p className="alert small">{format(t.checkout.minOrder, { min: formatUsd(minCents) })}</p>}
          <Link href={`/${locale}/cart`} className="small">{t.cart.title}</Link>
        </aside>
      </div>
    </div>
  );
}
