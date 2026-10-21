import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BasketIcon, CalendarIcon, TruckIcon } from '@/components/icons';
import { BasketMark, LeafMark, Picture } from '@/components/picture';
import { ProductGrid } from '@/components/product-card';
import { QtyControl } from '@/components/qty-control';
import { SearchForm } from '@/components/search-form';
import { inStockFirst, productsIn } from '@/lib/catalog';
import { dictionary, format, isLocale, localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import type { Basket, CatalogProduct } from '@/lib/shop-types';
import { getBaskets, getCatalog, getMenu, getZones } from '@/server/shop';

// Stock and prices change through the day, so every visit reads them fresh.
export const dynamic = 'force-dynamic';

const PER_SECTION = 8;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [products, baskets, menu, zones] = await Promise.all([getCatalog(), getBaskets(), getMenu(), getZones()]);
  const available = products.filter((p) => p.availableUnits > 0);
  const featured = [...available.filter((p) => p.featured), ...available.filter((p) => !p.featured)].slice(0, 7);
  const latest = inStockFirst(products.filter((p) => p.isNew)).slice(0, PER_SECTION);
  const sections = menu
    .map((c) => ({ category: c, items: inStockFirst(productsIn(products, menu, c.slug)) }))
    .filter((s) => s.items.length > 0);
  const name = (x: { nameEn: string; nameAr: string }) => localized(locale, x.nameEn, x.nameAr);

  return (
    <>
      <section className="banner">
        <div className="container banner-inner">
          <div className="banner-copy">
            <h1>{t.home.title}</h1>
            <p>{t.home.lead}</p>
            <a href={baskets.length ? '#baskets' : '#latest'} className="pill">{t.home.ctaBaskets}</a>
          </div>
          <div className="banner-art"><HeroArt /></div>
        </div>
      </section>

      <div className="search-panel"><SearchForm locale={locale} t={t} /></div>

      {featured.length > 0 && (
        <section className="container" aria-label={t.shop.featured} style={{ paddingBottom: 20 }}>
          <div className="mosaic">
            {featured.map((p, i) => <MosaicTile key={p.id} product={p} index={i} locale={locale} t={t} />)}
          </div>
        </section>
      )}

      {baskets.length > 0 && (
        <section id="baskets" className="section section-band" style={{ marginTop: 28 }}>
          <div className="container">
            <SectionTitle title={t.home.basketsTitle} lead={t.home.basketsLead} />
            <div className="basket-grid">
              {baskets.map((b) => <BasketCard key={b.id} basket={b} locale={locale} t={t} />)}
            </div>
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section id="latest" className="section">
          <div className="container">
            <SectionTitle title={t.shop.latest} />
            <ProductGrid products={latest} locale={locale} t={t} />
            <div className="section-more"><Link href={`/${locale}/products`} className="btn btn-primary">{t.shop.showAll}</Link></div>
          </div>
        </section>
      )}

      {sections.map(({ category, items }, i) => (
        <section key={category.id} id={category.slug} className={i % 2 === 0 ? 'section section-band' : 'section'}>
          <div className="container">
            <SectionTitle title={name(category)} />
            <ProductGrid products={items.slice(0, PER_SECTION)} locale={locale} t={t} />
            <div className="section-more">
              <Link href={`/${locale}/category/${category.slug}`} className="btn btn-primary">{format(t.shop.allProducts, { name: name(category) })}</Link>
            </div>
          </div>
        </section>
      ))}

      {products.length === 0 && baskets.length === 0 && (
        <section className="section"><p className="container muted" style={{ textAlign: 'center' }}>{t.home.nothingYet}</p></section>
      )}

      <section id="how" className="section section-band">
        <div className="container">
          <SectionTitle title={t.nav.how} />
          <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {t.home.how.map((step, i) => (
              <div key={step.title} style={{ background: '#fff', padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: 'var(--brand)' }}>{[<BasketIcon key="b" size={28} />, <CalendarIcon key="c" size={28} />, <TruckIcon key="t" size={28} />][i]}</span>
                <h3 style={{ fontSize: 18 }}>{step.title}</h3>
                <p className="soft">{step.text}</p>
              </div>
            ))}
          </div>
          {zones.length > 0 && (
            <p className="soft" style={{ textAlign: 'center', marginTop: 24 }}>
              {t.home.deliveryTitle}: {zones.map((z) => name(z)).join(' · ')} — <Link href={`/${locale}/delivery`}>{t.nav.deliveryTerms}</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function SectionTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="section-title">
      <LeafMark width="34px" />
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}

/** Tiles: one tall, two wide, then four narrow, like a market's front table. */
function MosaicTile({ product, index, locale, t }: { product: CatalogProduct; index: number; locale: Locale; t: Dictionary }) {
  const shape = index === 0 ? 'big' : index <= 2 ? 'wide' : '';
  const name = localized(locale, product.nameEn, product.nameAr);
  const unit = localized(locale, product.unitNameEn, product.unitNameAr);
  const href = `/${locale}/products/${product.slug}`;
  const art = (
    <div className="tile-art" style={{ aspectRatio: shape === 'wide' ? '1 / 1' : '4 / 3' }}>
      <Picture src={product.imagePath} alt="" seed={product.slug} kind="product" />
    </div>
  );
  return (
    <article className={`mosaic-tile ${shape}`}>
      {shape !== 'wide' && art}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link href={href} className="tile-name">{name} | {unit}</Link>
        <span className="tile-price">{formatPrice(product.priceUsd)}</span>
        <QtyControl kind="product" id={product.id} available={product.availableUnits} name={name} labels={t.product} />
      </div>
      {shape === 'wide' && art}
    </article>
  );
}

function BasketCard({ basket, locale, t }: { basket: Basket; locale: Locale; t: Dictionary }) {
  const name = localized(locale, basket.nameEn, basket.nameAr);
  const href = `/${locale}/baskets/${basket.slug}`;
  const items = basket.contents.length;
  return (
    <article className="basket-card">
      <Link href={href} className="card-media" style={{ background: 'var(--tile-sand)' }} tabIndex={-1} aria-hidden="true">
        {basket.imagePath ? <Picture src={basket.imagePath} alt="" seed={basket.slug} kind="basket" cover /> : <div className="picture"><BasketMark width="34%" /></div>}
        {basket.availableUnits <= 0 && <span className="badge badge-muted">{t.shop.soldBadge}</span>}
      </Link>
      <div className="card-body">
        <h3><Link href={href}>{name}</Link></h3>
        <p className="soft small">{localized(locale, basket.descriptionEn, basket.descriptionAr)}</p>
        <ul className="basket-facts">
          <li><BasketIcon /> {format(t.shop.basketItems, { count: items })}</li>
          <li><CalendarIcon /> {t.shop.basketDay}</li>
          <li><TruckIcon /> {t.shop.basketPay}</li>
        </ul>
        <div className="card-foot">
          <span className="price" style={{ fontSize: 18 }}>{formatPrice(basket.priceUsd)}</span>
          {basket.availableUnits > 0
            ? <QtyControl kind="basket" id={basket.id} available={basket.availableUnits} name={name} labels={t.product} />
            : <span className="stock stock-out">{t.product.soldOut}</span>}
        </div>
      </div>
    </article>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 420 300" width="100%" style={{ maxWidth: 440 }} aria-hidden="true">
      <ellipse cx="210" cy="276" rx="170" ry="12" fill="#b9c7a3" opacity="0.6" />
      <g>
        <circle cx="120" cy="138" r="34" fill="#8fb36a" />
        <circle cx="160" cy="118" r="30" fill="#e0a868" />
        <circle cx="196" cy="140" r="28" fill="#6c2b4a" />
        <path d="M70 150h160l-16 108a10 10 0 0 1-10 8H96a10 10 0 0 1-10-8z" fill="#a8743f" />
        <path d="M80 176h140M84 202h132M88 228h124" stroke="#8a5c2e" strokeWidth="4" />
        <path d="M100 150c0-50 22-82 50-82s50 32 50 82" fill="none" stroke="#7a5128" strokeWidth="7" />
      </g>
      <g>
        <circle cx="282" cy="150" r="30" fill="#d1342b" />
        <circle cx="322" cy="140" r="28" fill="#f2cf7a" />
        <circle cx="352" cy="162" r="24" fill="#b9d38a" />
        <path d="M250 168h130l-12 88a10 10 0 0 1-10 8H272a10 10 0 0 1-10-8z" fill="#3e5a2b" />
        <path d="M258 196h114M262 222h106" stroke="#2b4019" strokeWidth="4" />
        <path d="M300 112c6-22 30-30 48-24-6 18-26 28-48 24z" fill="#3e5a2b" />
      </g>
    </svg>
  );
}
