import Link from 'next/link';
import { WhatsAppIcon } from './icons';
import { localized, type Dictionary, type Locale } from '@/lib/i18n';
import type { MenuCategory } from '@/lib/shop-types';
import { whatsappLink } from '@/lib/whatsapp';

export function SiteFooter({ locale, t, menu, whatsappPhone }: { locale: Locale; t: Dictionary; menu: MenuCategory[]; whatsappPhone: string }) {
  const wa = whatsappPhone ? whatsappLink(whatsappPhone, '') : null;
  return (
    <footer className="site-footer">
      <div className="footer-strip">
        <div className="container">
          <div>
            <strong>{t.shop.newsTitle}</strong>
            <span className="small muted">{wa ? t.shop.newsLead : t.pages.deliveryCutoff}</span>
          </div>
          {wa
            ? <a href={wa} className="btn btn-primary" target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={20} /> {t.shop.newsButton}</a>
            : <Link href={`/${locale}/delivery`} className="btn btn-primary">{t.nav.deliveryTerms}</Link>}
        </div>
      </div>
      <div className="container footer-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>{t.brand}</span>
          <p>{t.footer.about}</p>
        </div>
        <div>
          <h2>{t.footer.categories}</h2>
          <ul>
            {menu.slice(0, 8).map((c) => <li key={c.id}><Link href={`/${locale}/category/${c.slug}`}>{localized(locale, c.nameEn, c.nameAr)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2>{t.footer.quickLinks}</h2>
          <ul>
            <li><Link href={`/${locale}/story`}>{t.nav.story}</Link></li>
            <li><Link href={`/${locale}/delivery`}>{t.nav.deliveryTerms}</Link></li>
            <li><Link href={`/${locale}/contact`}>{t.nav.contact}</Link></li>
            <li><Link href={`/${locale}/account`}>{t.nav.account}</Link></li>
            <li><Link href={`/${locale}/cart`}>{t.nav.cart}</Link></li>
          </ul>
        </div>
        <div>
          <h2>{t.footer.reachUs}</h2>
          <ul>
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer">{t.footer.whatsapp}</a></li>}
            {whatsappPhone && <li><a href={`tel:${whatsappPhone.replace(/[^\d+]/g, '')}`} dir="ltr">{whatsappPhone}</a></li>}
            <li><span className="small muted">{t.footer.location}</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} {t.brand}. {t.footer.rights}</span>
          <span>myseasonalbasket.com</span>
        </div>
      </div>
      {wa && (
        <a href={wa} className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label={t.shop.whatsappFloat}>
          <WhatsAppIcon />
        </a>
      )}
    </footer>
  );
}
