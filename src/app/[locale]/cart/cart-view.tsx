'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart-context';
import { priceCart } from '@/lib/cart';
import { format, localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatUsd } from '@/lib/money';
import type { Basket, CatalogProduct } from '@/lib/shop-types';

export function CartView({ locale, t, products, baskets }: { locale: Locale; t: Dictionary; products: CatalogProduct[]; baskets: Basket[] }) {
  const { cart, ready, set, remove } = useCart();
  const priced = priceCart(cart, products, baskets);

  return (
    <div className="container">
      <h1 className="page-title">{t.cart.title}</h1>
      {!ready ? null : priced.lines.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: 18 }}>{t.cart.empty}</p>
          <Link href={`/${locale}`} className="btn btn-primary">{t.cart.keepShopping}</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-lines" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {priced.lines.map((line) => {
              const name = line.nameEn ? localized(locale, line.nameEn, line.nameAr) : t.cart.unavailable;
              const unit = localized(locale, line.unitNameEn, line.unitNameAr);
              const href = `/${locale}/${line.kind === 'basket' ? 'baskets' : 'products'}/${line.slug}`;
              const max = Math.min(99, line.availableUnits);
              return (
                <li key={`${line.kind}:${line.id}`} className="cart-line">
                  <div className="cart-line-name">
                    {line.slug ? <Link href={href}>{name}</Link> : <strong>{name}</strong>}
                    {unit && <span className="small muted">{unit}</span>}
                    {line.slug && !line.available && (
                      <span className="stock stock-low">
                        {line.availableUnits > 0 ? format(t.product.fewLeft, { count: line.availableUnits }) : t.product.soldOut}
                      </span>
                    )}
                  </div>
                  {line.slug && (
                    <div className="stepper" role="group" aria-label={`${t.product.quantity}: ${name}`}>
                      <button type="button" aria-label={t.product.less} disabled={line.quantity <= 1} onClick={() => set(line.kind, line.id, line.quantity - 1)}>−</button>
                      <output aria-live="polite">{line.quantity}</output>
                      <button type="button" aria-label={t.product.more} disabled={line.quantity >= max} onClick={() => set(line.kind, line.id, line.quantity + 1)}>+</button>
                    </div>
                  )}
                  <span className="cart-line-total">{line.available ? formatUsd(line.lineCents) : '—'}</span>
                  <button type="button" className="link-button" onClick={() => remove(line.kind, line.id)} aria-label={`${t.cart.remove}: ${name}`}>
                    {t.cart.remove}
                  </button>
                </li>
              );
            })}
          </ul>
          <aside className="summary" aria-label={t.checkout.summary}>
            <h2>{t.checkout.summary}</h2>
            <div className="summary-row summary-total"><span>{t.cart.subtotal}</span><span>{formatUsd(priced.subtotalCents)}</span></div>
            <p className="small muted">{t.cart.deliveryLater}</p>
            {priced.allAvailable ? (
              <Link href={`/${locale}/checkout`} className="btn btn-primary btn-large btn-block">{t.cart.checkout}</Link>
            ) : (
              <>
                <p className="alert" role="status">{t.errors.SHOP_STOCK}</p>
                <span className="btn btn-primary btn-large btn-block" aria-disabled="true">{t.cart.checkout}</span>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
