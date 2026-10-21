'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart-context';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from './icons';
import { format, localized, type Dictionary, type Locale } from '@/lib/i18n';
import type { MenuCategory } from '@/lib/shop-types';

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 18h24l-3 13a2.5 2.5 0 0 1-2.4 2H13.4a2.5 2.5 0 0 1-2.4-2z" fill="currentColor" />
      <path d="M13 18c0-4.5 3.1-8 7-8s7 3.5 7 8" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 10c1.2-3.6 4.6-5.2 7.6-4.6-.6 3.2-3.8 5.2-7.6 4.6z" fill="#d1342b" />
      <path d="M12 23h16M13 27.5h14" stroke="#fff" strokeWidth="1.6" opacity="0.55" />
    </svg>
  );
}

type Props = { locale: Locale; t: Dictionary; menu: MenuCategory[]; hasBaskets: boolean };

/**
 * One header row: the ☰ button, the logo in the middle, search and cart. The whole
 * menu (categories, info pages, language) lives in the drawer the ☰ button opens.
 */
export function SiteHeader({ locale, t, menu, hasBaskets }: Props) {
  const pathname = usePathname() ?? `/${locale}`;
  const { count, ready } = useCart();
  const [drawer, setDrawer] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const other: Locale = locale === 'en' ? 'ar' : 'en';
  const otherPath = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);
  const name = (c: { nameEn: string; nameAr: string }) => localized(locale, c.nameEn, c.nameAr);

  const close = () => { setDrawer(false); toggleRef.current?.focus(); };

  // Close the menu when the page changes or Escape is pressed; stop the page scrolling behind it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawer(false);
  }, [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawer]);

  const shopCategories = menu.filter((c) => !c.highlight);
  const highlighted = menu.filter((c) => c.highlight);
  const cartLabel = `${t.nav.cart} (${ready ? count : 0})`;

  return (
    <header className="site-header">
      <div className="container header-row">
        <div className="header-start">
          <button ref={toggleRef} type="button" className="menu-button" aria-label={t.nav.openMenu} aria-expanded={drawer} aria-controls="site-menu" onClick={() => setDrawer(true)}>
            <MenuIcon size={26} />
          </button>
        </div>
        <Link href={`/${locale}`} className="brand" aria-label={t.brand}>
          <span className="brand-name"><LogoMark />{t.brand}</span>
          <span className="brand-tag">{t.home.eyebrow}</span>
        </Link>
        <div className="header-end">
          <Link href={`/${locale}/search`} className="icon-button" aria-label={t.nav.search}><SearchIcon /></Link>
          <Link href={`/${locale}/cart`} className="icon-button" aria-label={cartLabel}>
            <CartIcon />
            {ready && count > 0 && <span className="icon-badge" aria-hidden="true">{count}</span>}
          </Link>
        </div>
      </div>

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={close} aria-hidden="true" />
          <div id="site-menu" className="drawer" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
            <div className="drawer-head">
              <strong>{t.nav.menu}</strong>
              <button type="button" className="icon-button" aria-label={t.nav.closeMenu} onClick={close} autoFocus><CloseIcon /></button>
            </div>
            <form className="drawer-search" action={`/${locale}/search`} method="get" role="search">
              <label htmlFor="menu-q" className="visually-hidden">{t.shop.searchPlaceholder}</label>
              <input id="menu-q" name="q" type="search" placeholder={t.shop.searchPlaceholder} maxLength={80} />
              <button type="submit" aria-label={t.shop.searchButton}><SearchIcon size={20} /></button>
            </form>
            <nav aria-label={t.nav.products}>
              <ul>
                {hasBaskets && <li><Link className="drawer-strong" href={`/${locale}#baskets`} onClick={() => setDrawer(false)}>{t.nav.plans}</Link></li>}
                {shopCategories.map((c) => (
                  <li key={c.id}>
                    {c.children.length === 0 ? (
                      <Link href={`/${locale}/category/${c.slug}`}>{name(c)}</Link>
                    ) : (
                      <details>
                        <summary>{name(c)}<span className="sign" aria-hidden="true" /></summary>
                        <ul>
                          {c.children.map((s) => <li key={s.id}><Link href={`/${locale}/category/${s.slug}`}>{name(s)}</Link></li>)}
                          <li><Link className="drawer-all" href={`/${locale}/category/${c.slug}`}>{format(t.nav.allIn, { name: name(c) })}</Link></li>
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
                {highlighted.map((c) => (
                  <li key={c.id}><Link className="drawer-strong drawer-accent" href={`/${locale}/category/${c.slug}`}>{name(c)}</Link></li>
                ))}
              </ul>
            </nav>
            <div className="drawer-links">
              <Link href={`/${locale}`}>{t.nav.home}</Link>
              <Link href={`/${locale}/products`}>{t.shop.allTitle}</Link>
              <Link href={`/${locale}/delivery`}>{t.nav.deliveryTerms}</Link>
              <Link href={`/${locale}/story`}>{t.nav.story}</Link>
              <Link href={`/${locale}/contact`}>{t.nav.contact}</Link>
              <Link href={otherPath} hrefLang={other} lang={other} className="drawer-lang">{t.nav.otherLanguage}</Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
