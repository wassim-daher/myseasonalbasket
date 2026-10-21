import Link from 'next/link';
import { Picture } from './picture';
import { QtyControl } from './qty-control';
import { LOW_STOCK } from './stock-label';
import { localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import type { CatalogProduct } from '@/lib/shop-types';

export function ProductCard({ product, locale, t }: { product: CatalogProduct; locale: Locale; t: Dictionary }) {
  const name = localized(locale, product.nameEn, product.nameAr);
  const href = `/${locale}/products/${product.slug}`;
  const soldOut = product.availableUnits <= 0;
  return (
    <article className="product-card">
      <Link href={href} className="card-media" tabIndex={-1} aria-hidden="true">
        <span className="badges">
          {soldOut ? <span className="badge badge-muted">{t.shop.soldBadge}</span>
            : product.availableUnits <= LOW_STOCK ? <span className="badge badge-soft">{t.shop.lowBadge}</span> : null}
          {product.isNew && <span className="badge">{t.shop.newBadge}</span>}
        </span>
        <Picture src={product.imagePath} alt="" seed={product.slug} kind="product" />
      </Link>
      <div className="card-body">
        <h3><Link href={href}>{name}</Link></h3>
        <p className="unit">{localized(locale, product.unitNameEn, product.unitNameAr)}</p>
        <div className="card-foot">
          <span className="price">{formatPrice(product.priceUsd)}</span>
          {!soldOut && <QtyControl kind="product" id={product.id} available={product.availableUnits} name={name} labels={t.product} />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, locale, t }: { products: CatalogProduct[]; locale: Locale; t: Dictionary }) {
  return (
    <div className="product-grid">
      {products.map((p) => <ProductCard key={p.id} product={p} locale={locale} t={t} />)}
    </div>
  );
}
