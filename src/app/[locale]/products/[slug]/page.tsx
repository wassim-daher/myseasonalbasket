import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Picture } from '@/components/picture';
import { ProductGrid } from '@/components/product-card';
import { QtyControl } from '@/components/qty-control';
import { StockLabel } from '@/components/stock-label';
import { inStockFirst } from '@/lib/catalog';
import { dictionary, isLocale, localized } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import { getCatalog, getMenu } from '@/server/shop';

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
  const [products, menu] = await Promise.all([getCatalog(), getMenu()]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const name = localized(locale, product.nameEn, product.nameAr);
  const description = localized(locale, product.descriptionEn, product.descriptionAr);
  const all = menu.flatMap((c) => [{ ...c, parent: null as null | typeof c }, ...c.children.map((s) => ({ ...s, children: [], parent: c }))]);
  const category = all.find((c) => c.id === product.categoryId);
  const related = category ? inStockFirst(products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id)).slice(0, 4) : [];
  const label = (c: { nameEn: string; nameAr: string }) => localized(locale, c.nameEn, c.nameAr);

  return (
    <div className="container">
      <div className="page-head">
        <p className="crumbs">
          <Link href={`/${locale}`}>{t.nav.home}</Link> /{' '}
          {category?.parent && <><Link href={`/${locale}/category/${category.parent.slug}`}>{label(category.parent)}</Link> / </>}
          {category && <><Link href={`/${locale}/category/${category.slug}`}>{label(category)}</Link> / </>}
          {name}
        </p>
      </div>
      <div className="detail">
        <div className="detail-media"><Picture src={product.imagePath} alt={name} seed={product.slug} kind="product" /></div>
        <div className="detail-info">
          <h1>{name} | {localized(locale, product.unitNameEn, product.unitNameAr)}</h1>
          <p className="detail-price">{formatPrice(product.priceUsd)}</p>
          <StockLabel available={product.availableUnits} t={t} />
          {product.availableUnits > 0 && (
            <div className="buy-row">
              <QtyControl kind="product" id={product.id} available={product.availableUnits} name={name} labels={t.product} large />
              <Link href={`/${locale}/cart`} className="btn btn-primary btn-large">{t.cart.checkout}</Link>
            </div>
          )}
          {description && <p className="soft" style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{description}</p>}
        </div>
      </div>
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-title"><h2>{category ? label(category) : ''}</h2></div>
          <ProductGrid products={related} locale={locale} t={t} />
        </section>
      )}
    </div>
  );
}
