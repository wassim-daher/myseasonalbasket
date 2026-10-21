'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './cart-context';
import type { Dictionary, Locale } from '@/lib/i18n';

export function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--olive)" />
      <path d="M10 19h20l-2.5 10.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5z" fill="var(--ground)" />
      <path d="M14 19c0-4 2.7-7 6-7s6 3 6 7" fill="none" stroke="var(--ground)" strokeWidth="2" />
      <path d="M20 12c1-3 4-4.5 6.5-4-0.5 2.8-3.2 4.6-6.5 4z" fill="var(--leaf)" />
    </svg>
  );
}

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const pathname = usePathname() ?? `/${locale}`;
  const { count, ready } = useCart();
  const other: Locale = locale === 'en' ? 'ar' : 'en';
  const otherPath = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);

  return (
    <header className="site-header">
      <div className="container">
        <Link href={`/${locale}`} className="brand">
          <Logo />
          <span className="brand-name">{t.brand}</span>
        </Link>
        <nav aria-label={t.brand} className="site-nav">
          <Link href={`/${locale}#baskets`}>{t.nav.baskets}</Link>
          <Link href={`/${locale}#products`}>{t.nav.products}</Link>
          <Link href={`/${locale}#how`}>{t.nav.how}</Link>
          <Link href={`/${locale}#delivery`}>{t.nav.delivery}</Link>
        </nav>
        <div className="header-actions">
          <Link href={otherPath} className="lang-switch" hrefLang={other} lang={other}>
            {t.nav.otherLanguage}
          </Link>
          <Link href={`/${locale}/cart`} className="btn btn-primary cart-button" aria-label={`${t.nav.cart} (${ready ? count : 0})`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9h18l-2 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
              <path d="M8 9V7a4 4 0 0 1 8 0v2" />
            </svg>
            <span>{t.nav.cart}</span>
            <span className="cart-count" aria-hidden="true">{ready ? count : 0}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
