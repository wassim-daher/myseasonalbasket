import Link from 'next/link';
import { Picture } from './picture';
import { QtyControl } from './qty-control';
import { LOW_STOCK } from './stock-label';
import { localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import type { CatalogProduct } from '@/lib/shop-types';

/** Ranks up to this count earn the "Best seller" label. */
export const BEST_SELLER_RANKS = 6;

const tints = ['var(--tile-grey)', 'var(--tile-sand)', 'var(--tile-sage)'];

export function ProductCard({ product, locale, t, tinted = false, index = 0 }: { product: CatalogProduct; locale: Locale; t: Dictionary; tinted?: boolean; index?: number }) {
  const name = localized(locale, product.nameEn, product.nameAr);
  const unit = localized(locale, product.unitNameEn, product.unitNameAr);
  const href = `/${locale}/products/${product.slug}`;
  const soldOut = product.availableUnits <= 0;
  const best = product.salesRank !== null && product.salesRank <= BEST_SELLER_RANKS;
  return (
    <article className="product-card">
      <Link href={href} className="card-media" tabIndex={-1} aria-hidden="true" style={tinted ? { background: tints[index % tints.length] } : undefined}>
        <span className="badges">
          {best && !soldOut && <span className="badge badge-brand">{t.shop.bestBadge}</span>}
          {soldOut && product.comingSoon && <span className="badge badge-soft">{t.shop.soonBadge}</span>}
          {soldOut && !product.comingSoon && <span className="badge badge-muted">{t.shop.soldBadge}</span>}
          {!soldOut && product.availableUnits <= LOW_STOCK && <span className="badge badge-soft">{t.shop.lowBadge}</span>}
          {product.isNew && <span className="badge">{t.shop.newBadge}</span>}
        </span>
        <Picture src={product.imagePath} alt="" seed={product.slug} kind="product" />
      </Link>
      <div className="card-body">
        <h3><Link href={href}>{name} | {unit}</Link></h3>
        <p className="origin">{t.shop.origin}</p>
        <div className="card-foot">
          <span className="price">{formatPrice(product.priceUsd)}</span>
          {!soldOut && <QtyControl kind="product" id={product.id} available={product.availableUnits} name={name} labels={t.product} />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, locale, t, tinted = false }: { products: CatalogProduct[]; locale: Locale; t: Dictionary; tinted?: boolean }) {
  return (
    <div className="product-grid">
      {products.map((p, i) => <ProductCard key={p.id} product={p} locale={locale} t={t} tinted={tinted} index={i} />)}
    </div>
  );
}
