import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddButton } from '@/components/add-to-cart';
import { Picture } from '@/components/picture';
import { StockLabel } from '@/components/stock-label';
import { dictionary, format, isLocale, localized } from '@/lib/i18n';
import { formatPrice, toCents } from '@/lib/money';
import { getBaskets, getCatalog, getZones } from '@/server/shop';

// Stock and prices change through the day, so every visit reads them fresh.
export const dynamic = 'force-dynamic';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [products, baskets, zones] = await Promise.all([getCatalog(), getBaskets(), getZones()]);
  const labels = { ...t.product };

  return (
    <>
      <div className="container">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{t.home.eyebrow}</span>
            <h1>{t.home.title}</h1>
            <p className="hero-lead">{t.home.lead}</p>
            <div className="actions">
              <a href="#baskets" className="btn btn-primary btn-large">{t.home.ctaBaskets}</a>
              <a href="#products" className="btn btn-secondary btn-large">{t.home.ctaProducts}</a>
            </div>
            <p className="small muted">{t.home.payNote}</p>
          </div>
          <div className="hero-art">
            <HeroArt />
          </div>
        </section>
      </div>

      <section id="baskets" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>{t.home.basketsTitle}</h2>
              <p>{t.home.basketsLead}</p>
            </div>
          </div>
          {baskets.length === 0 ? (
            <p className="muted">{t.home.nothingYet}</p>
          ) : (
            <div className="grid-baskets">
              {baskets.map((b) => {
                const name = localized(locale, b.nameEn, b.nameAr);
                return (
                  <article key={b.id} className="card">
                    <Picture src={b.imagePath} alt={name} seed={b.slug} kind="basket" wide />
                    <div className="card-body">
                      <div className="card-foot" style={{ marginTop: 0, paddingTop: 0 }}>
                        <h3 className="card-title"><Link href={`/${locale}/baskets/${b.slug}`}>{name}</Link></h3>
                        <span className="price">{formatPrice(b.priceUsd)}</span>
                      </div>
                      <p className="soft">{localized(locale, b.descriptionEn, b.descriptionAr)}</p>
                      <StockLabel available={b.availableUnits} t={t} />
                      <div className="card-foot">
                        <Link href={`/${locale}/baskets/${b.slug}`} className="btn btn-secondary">{t.product.inside}</Link>
                        <AddButton kind="basket" id={b.id} available={b.availableUnits} labels={labels} name={name} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="products" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>{t.home.productsTitle}</h2>
              <p>{t.home.productsLead}</p>
            </div>
          </div>
          {products.length === 0 ? (
            <p className="muted">{t.home.nothingYet}</p>
          ) : (
            <div className="grid-products">
              {products.map((p) => {
                const name = localized(locale, p.nameEn, p.nameAr);
                return (
                  <article key={p.id} className="card product-card">
                    <Picture src={p.imagePath} alt={name} seed={p.slug} kind="product" />
                    <div className="card-body">
                      <h3 className="card-title"><Link href={`/${locale}/products/${p.slug}`}>{name}</Link></h3>
                      <p className="small muted">{localized(locale, p.unitNameEn, p.unitNameAr)}</p>
                      <StockLabel available={p.availableUnits} t={t} />
                      <div className="card-foot">
                        <span className="price">{formatPrice(p.priceUsd)}</span>
                        <AddButton kind="product" id={p.id} available={p.availableUnits} labels={labels} name={name} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="how" className="band" style={{ marginTop: 40 }}>
        <div className="container steps">
          {t.home.how.map((step, i) => (
            <div key={step.title} className="step">
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {zones.length > 0 && (
        <section id="delivery" className="section">
          <div className="container">
            <div className="section-head"><h2>{t.home.deliveryTitle}</h2></div>
            <ul className="zones" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {zones.map((z) => (
                <li key={z.id} className="zone-chip">
                  <strong>{localized(locale, z.nameEn, z.nameAr)}</strong>
                  <span className="muted"> · {format(t.home.deliveryFee, { fee: formatPrice(z.feeUsd) })}
                    {toCents(z.minOrderUsd) > 0 ? ` · ${format(t.home.deliveryMin, { min: formatPrice(z.minOrderUsd) })}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 400 320" width="88%" role="img" aria-label="">
      <ellipse cx="200" cy="292" rx="150" ry="14" fill="#c4d3ad" />
      <circle cx="132" cy="120" r="46" fill="#b9d38a" />
      <circle cx="196" cy="104" r="40" fill="#e0a868" />
      <circle cx="258" cy="124" r="44" fill="#8fb36a" />
      <circle cx="170" cy="150" r="30" fill="#d9774a" />
      <circle cx="234" cy="156" r="28" fill="#f2cf7a" />
      <path d="M180 66c6-22 30-30 48-24-6 18-26 28-48 24z" fill="#3e5a2b" />
      <path d="M70 160h260l-24 112a12 12 0 0 1-12 9H106a12 12 0 0 1-12-9z" fill="#3e5a2b" />
      <path d="M90 196h220M98 232h204" stroke="#f4f6ef" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
      <path d="M120 160c0-50 36-86 80-86s80 36 80 86" fill="none" stroke="#2b4019" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
