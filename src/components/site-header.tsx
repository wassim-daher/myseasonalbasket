'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart-context';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from './icons';
import { format, localized, type Dictionary, type Locale } from '@/lib/i18n';
import type { MenuCategory } from '@/lib/shop-types';

export function Logo({ t }: { t: Dictionary }) {
  return (
    <>
      <span className="brand-name">
        <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M8 18h24l-3 13a2.5 2.5 0 0 1-2.4 2H13.4a2.5 2.5 0 0 1-2.4-2z" fill="currentColor" />
          <path d="M13 18c0-4.5 3.1-8 7-8s7 3.5 7 8" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M20 10c1.2-3.6 4.6-5.2 7.6-4.6-.6 3.2-3.8 5.2-7.6 4.6z" fill="#d1342b" />
          <path d="M12 23h16M13 27.5h14" stroke="#fff" strokeWidth="1.6" opacity="0.55" />
        </svg>
        {t.brand}
      </span>
      <span className="brand-tag">{t.home.eyebrow}</span>
    </>
  );
}

type Props = { locale: Locale; t: Dictionary; menu: MenuCategory[]; hasBaskets: boolean };

export function SiteHeader({ locale, t, menu, hasBaskets }: Props) {
  const pathname = usePathname() ?? `/${locale}`;
  const { count, ready } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const other: Locale = locale === 'en' ? 'ar' : 'en';
  const otherPath = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);
  const name = (c: { nameEn: string; nameAr: string }) => localized(locale, c.nameEn, c.nameAr);
  const current = (href: string) => (pathname === href ? 'page' : undefined);

  // Close menus when the page changes, on Escape, or on a click elsewhere.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(null);
    setDrawer(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(null); setDrawer(false); } };
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  const topLinks = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/delivery`, label: t.nav.deliveryTerms },
    { href: `/${locale}/story`, label: t.nav.story },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];
  const cartLabel = `${t.nav.cart} (${ready ? count : 0})`;

  return (
    <header className="site-header">
      <div className="container header-top">
        <Link href={`/${locale}`} className="brand" aria-label={t.brand}>
          <Logo t={t} />
        </Link>
        <nav className="top-links" aria-label={t.nav.home}>
          {topLinks.map((l) => <Link key={l.href} href={l.href} aria-current={current(l.href)}>{l.label}</Link>)}
        </nav>
        <div className="icon-links">
          <Link href={otherPath} className="lang-link lang-desktop" hrefLang={other} lang={other}>{t.nav.otherLanguage}</Link>
          <Link href={`/${locale}/search`} className="icon-button" aria-label={t.nav.search}><SearchIcon /></Link>
          <Link href={`/${locale}/cart`} className="icon-button" aria-label={cartLabel}>
            <CartIcon />
            {ready && count > 0 && <span className="icon-badge" aria-hidden="true">{count}</span>}
          </Link>
          <button type="button" className="icon-button menu-toggle" aria-label={t.nav.menu} aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <MenuIcon />
          </button>
        </div>
      </div>

      <nav className="container category-bar" aria-label={t.nav.products}>
        <ul className="category-menu" ref={menuRef}>
          {hasBaskets && (
            <li className="baskets-link"><Link href={`/${locale}#baskets`}>{t.nav.baskets}</Link></li>
          )}
          {menu.map((c) => (
            <li key={c.id} className={c.highlight ? 'highlight' : undefined}
              onMouseEnter={() => c.children.length && setOpen(c.id)} onMouseLeave={() => setOpen((o) => (o === c.id ? null : o))}>
              {c.children.length === 0 ? (
                <Link href={`/${locale}/category/${c.slug}`} aria-current={current(`/${locale}/category/${c.slug}`)}>{name(c)}</Link>
              ) : (
                <>
                  <button type="button" aria-expanded={open === c.id} aria-controls={`menu-${c.slug}`} onClick={() => setOpen(open === c.id ? null : c.id)}>
                    {name(c)} <span className="caret" aria-hidden="true" />
                  </button>
                  <ul id={`menu-${c.slug}`} className={open === c.id ? 'dropdown open' : 'dropdown'}>
                    {c.children.map((s) => <li key={s.id}><Link href={`/${locale}/category/${s.slug}`}>{name(s)}</Link></li>)}
                    <li><Link className="dropdown-all" href={`/${locale}/category/${c.slug}`}>{format(t.nav.allIn, { name: name(c) })}</Link></li>
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />
          <div className="drawer" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
            <div className="drawer-head">
              <strong>{t.nav.menu}</strong>
              <button type="button" className="icon-button" aria-label={t.nav.closeMenu} onClick={() => setDrawer(false)} autoFocus><CloseIcon /></button>
            </div>
            <nav aria-label={t.nav.products}>
              <ul>
                {hasBaskets && <li><Link href={`/${locale}#baskets`} onClick={() => setDrawer(false)} style={{ color: 'var(--brand)' }}>{t.nav.baskets}</Link></li>}
                {menu.map((c) => (
                  <li key={c.id} className={c.highlight ? 'highlight' : undefined}>
                    {c.children.length === 0 ? (
                      <Link href={`/${locale}/category/${c.slug}`}>{name(c)}</Link>
                    ) : (
                      <details>
                        <summary>{name(c)} <span className="caret" aria-hidden="true" /></summary>
                        <ul>
                          {c.children.map((s) => <li key={s.id}><Link href={`/${locale}/category/${s.slug}`}>{name(s)}</Link></li>)}
                          <li><Link href={`/${locale}/category/${c.slug}`}>{format(t.nav.allIn, { name: name(c) })}</Link></li>
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="drawer-links">
              {topLinks.slice(1).map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              <Link href={otherPath} hrefLang={other} lang={other} style={{ fontWeight: 500, color: 'var(--brand)' }}>{t.nav.otherLanguage}</Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
