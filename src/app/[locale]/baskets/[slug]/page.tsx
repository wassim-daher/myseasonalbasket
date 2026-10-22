import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BasketMark, Picture } from '@/components/picture';
import { QtyControl } from '@/components/qty-control';
import { StockLabel } from '@/components/stock-label';
import { dictionary, isLocale, localized } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import { getBaskets } from '@/server/shop';

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const basket = (await getBaskets()).find((b) => b.slug === slug);
  return basket ? { title: localized(locale, basket.nameEn, basket.nameAr) } : {};
}

export default async function BasketPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const basket = (await getBaskets()).find((b) => b.slug === slug);
  if (!basket) notFound();
  const name = localized(locale, basket.nameEn, basket.nameAr);
  const description = localized(locale, basket.descriptionEn, basket.descriptionAr);

  return (
    <div className="container">
      <div className="page-head">
        <p className="crumbs"><Link href={`/${locale}`}>{t.nav.home}</Link> / <Link href={`/${locale}#baskets`}>{t.nav.baskets}</Link> / {name}</p>
      </div>
      <div className="detail">
        <div className="detail-media" style={{ background: 'var(--tile-sand)' }}>
          {basket.imagePath ? <Picture src={basket.imagePath} alt={name} seed={basket.slug} kind="basket" cover /> : <div className="picture" role="img" aria-label={name}><BasketMark width="46%" /></div>}
        </div>
        <div className="detail-info">
          <h1>{name}</h1>
          <p className="detail-price">{formatPrice(basket.priceUsd)} <span>{t.product.perBasket}</span></p>
          {description && <p className="soft" style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{description}</p>}
          <section className="panel" aria-labelledby="inside">
            <h2 id="inside">{t.product.inside}</h2>
            <p className="small muted">{t.product.insideNote}</p>
            <ul className="contents">
              {basket.contents.map((c, i) => (
                <li key={`${c.nameEn}-${i}`}>
                  <span>{localized(locale, c.nameEn, c.nameAr)}</span>
                  <span className="muted">{c.quantity} {localized(locale, c.unitNameEn, c.unitNameAr)}</span>
                </li>
              ))}
            </ul>
          </section>
          <StockLabel available={basket.availableUnits} t={t} />
          {basket.availableUnits > 0 && (
            <div className="buy-row">
              <QtyControl kind="basket" id={basket.id} available={basket.availableUnits} name={name} labels={t.product} large />
              <Link href={`/${locale}/cart`} className="btn btn-primary btn-large">{t.cart.checkout}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
