import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Banner, type Slide } from '@/components/banner';
import { BasketIcon, CalendarIcon, TruckIcon } from '@/components/icons';
import { BasketMark, LeafMark, Picture } from '@/components/picture';
import { ProductGrid } from '@/components/product-card';
import { SearchForm } from '@/components/search-form';
import { bestSellers, newThisSeason } from '@/lib/catalog';
import { dictionary, format, isLocale, localized, type Dictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/money';
import type { Banner as BannerRow, Basket } from '@/lib/shop-types';
import { getBanners, getBaskets, getCatalog, getMenu } from '@/server/shop';

// Stock, prices and best sellers change through the day, so every visit reads them fresh.
export const dynamic = 'force-dynamic';

const ROW = 6;

/** Slides from Farm Agent, or the built-in ones until the farm publishes its own. */
function slidesFor(locale: Locale, t: Dictionary, rows: BannerRow[], hasBaskets: boolean): Slide[] {
  if (rows.length > 0) {
    return rows.map((b) => ({
      key: b.id,
      headlineAr: b.headlineAr,
      title: localized(locale, b.titleEn, b.titleAr),
      cta: localized(locale, b.ctaEn, b.ctaAr),
      href: b.linkPath ? `/${locale}${b.linkPath}` : `/${locale}`,
      imagePath: b.imagePath,
      theme: b.theme,
    }));
  }
  const links = [`/${locale}/products`, hasBaskets ? `/${locale}#baskets` : `/${locale}/products`, `/${locale}/products`];
  return t.shop.slides.map((s, i) => ({ key: `default-${i}`, headlineAr: s.headlineAr, title: s.title, cta: s.cta, href: links[i], imagePath: '', theme: s.theme as Slide['theme'] }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [products, baskets, menu, banners] = await Promise.all([getCatalog(), getBaskets(), getMenu(), getBanners()]);
  const best = bestSellers(products, ROW);
  const fresh = newThisSeason(products, ROW);
  const name = (x: { nameEn: string; nameAr: string }) => localized(locale, x.nameEn, x.nameAr);
  const tileColours = ['sage', 'sand', 'grey'];

  return (
    <>
      <Banner
        slides={slidesFor(locale, t, banners, baskets.length > 0)}
        locale={locale}
        labels={{ prev: t.shop.prevSlide, next: t.shop.nextSlide, slide: t.shop.slide, region: t.home.eyebrow }}
      />

      <div className="search-panel"><SearchForm locale={locale} t={t} /></div>

      {best.length > 0 && (
        <section className="section" aria-labelledby="best">
          <div className="container">
            <SectionTitle id="best" title={t.shop.bestTitle} lead={t.shop.bestLead} />
            <ProductGrid products={best} locale={locale} t={t} tinted />
            <div className="section-more"><Link href={`/${locale}/products`} className="btn btn-primary">{t.shop.showAll}</Link></div>
          </div>
        </section>
      )}

      {baskets.length > 0 && (
        <section id="baskets" className="section section-band" aria-labelledby="plans">
          <div className="container">
            <SectionTitle id="plans" title={t.shop.plansTitle} lead={t.home.basketsLead} />
            <div className="basket-grid">
              {baskets.map((b, i) => <BasketCard key={b.id} basket={b} locale={locale} t={t} badge={i === 0 ? t.shop.planPopular : t.shop.planTry} />)}
            </div>
          </div>
        </section>
      )}

      {menu.length > 0 && (
        <section className="section" aria-labelledby="cats" style={{ paddingBottom: 12 }}>
          <div className="container">
            <SectionTitle id="cats" title={t.shop.categoriesTitle} />
            <div className="category-tiles">
              {menu.map((c, i) => (
                <Link key={c.id} href={`/${locale}/category/${c.slug}`} className={`category-tile tile-${c.highlight ? 'offer' : tileColours[i % tileColours.length]}`}>
                  <LeafMark width="40px" />
                  <span>{name(c)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {fresh.length > 0 && (
        <section className="section" aria-labelledby="latest">
          <div className="container">
            <SectionTitle id="latest" title={t.shop.latest} />
            <ProductGrid products={fresh} locale={locale} t={t} />
            <div className="section-more"><Link href={`/${locale}/products`} className="btn btn-primary">{t.shop.showAll}</Link></div>
          </div>
        </section>
      )}

      {products.length === 0 && baskets.length === 0 && (
        <section className="section"><p className="container muted" style={{ textAlign: 'center' }}>{t.home.nothingYet}</p></section>
      )}
    </>
  );
}

function SectionTitle({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="section-title">
      <svg width="36" height="36" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 88C50 60 58 30 86 14c4 30-8 60-36 74z" fill="var(--brand)" />
        <path d="M50 88C48 64 36 44 14 36c-2 26 12 46 36 52z" fill="var(--accent)" />
      </svg>
      <h2 id={id}>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}

function BasketCard({ basket, locale, t, badge }: { basket: Basket; locale: Locale; t: Dictionary; badge: string }) {
  const name = localized(locale, basket.nameEn, basket.nameAr);
  const href = `/${locale}/baskets/${basket.slug}`;
  const soldOut = basket.availableUnits <= 0;
  return (
    <article className="basket-card">
      <Link href={href} className="card-media" tabIndex={-1} aria-hidden="true">
        {basket.imagePath ? <Picture src={basket.imagePath} alt="" seed={basket.slug} kind="basket" cover /> : <div className="picture"><BasketMark width="34%" /></div>}
        <span className={soldOut ? 'badge badge-muted' : 'badge'}>{soldOut ? t.shop.soldBadge : badge}</span>
      </Link>
      <div className="card-body">
        <h3><Link href={href}>{name}</Link></h3>
        <p className="muted small">{localized(locale, basket.descriptionEn, basket.descriptionAr)}</p>
        <ul className="basket-facts">
          <li><BasketIcon /> {format(t.shop.basketItems, { count: basket.contents.length })}</li>
          <li><CalendarIcon /> {t.shop.basketDay}</li>
          <li><TruckIcon /> {t.shop.basketPay}</li>
        </ul>
        <div className="card-foot">
          <span className="price" style={{ fontSize: 18 }}>{formatPrice(basket.priceUsd)}</span>
          <Link href={href} className="btn btn-primary">{t.shop.planOrder}</Link>
        </div>
      </div>
    </article>
  );
}
