import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddWithQuantity } from '@/components/add-to-cart';
import { Picture } from '@/components/picture';
import { StockLabel } from '@/components/stock-label';
import { dictionary, isLocale, localized } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import { getCatalog } from '@/server/shop';

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = (await getCatalog()).find((p) => p.slug === slug);
  return product ? { title: localized(locale, product.nameEn, product.nameAr) } : {};
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const product = (await getCatalog()).find((p) => p.slug === slug);
  if (!product) notFound();
  const name = localized(locale, product.nameEn, product.nameAr);
  const description = localized(locale, product.descriptionEn, product.descriptionAr);

  return (
    <div className="container">
      <p className="crumbs"><Link href={`/${locale}#products`}>{t.product.back}</Link></p>
      <div className="detail">
        <div className="detail-media"><Picture src={product.imagePath} alt={name} seed={product.slug} kind="product" /></div>
        <div className="detail-info">
          <h1>{name}</h1>
          <p className="detail-price">{formatPrice(product.priceUsd)} <span>· {localized(locale, product.unitNameEn, product.unitNameAr)}</span></p>
          {description && <p className="soft" style={{ fontSize: 17, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{description}</p>}
          <StockLabel available={product.availableUnits} t={t} />
          <AddWithQuantity kind="product" id={product.id} available={product.availableUnits} labels={t.product} />
        </div>
      </div>
    </div>
  );
}
