import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddWithQuantity } from '@/components/add-to-cart';
import { Picture } from '@/components/picture';
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
      <p className="crumbs"><Link href={`/${locale}#baskets`}>{t.product.back}</Link></p>
      <div className="detail">
        <div className="detail-media"><Picture src={basket.imagePath} alt={name} seed={basket.slug} kind="basket" /></div>
        <div className="detail-info">
          <h1>{name}</h1>
          <p className="detail-price">{formatPrice(basket.priceUsd)} <span>{t.product.perBasket}</span></p>
          {description && <p className="soft" style={{ fontSize: 17, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{description}</p>}
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
          <AddWithQuantity kind="basket" id={basket.id} available={basket.availableUnits} labels={t.product} />
        </div>
      </div>
    </div>
  );
}
