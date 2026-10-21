import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/product-card';
import { inStockFirst } from '@/lib/catalog';
import { dictionary, isLocale, localized } from '@/lib/i18n';
import { getCatalog, getMenu } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).shop.allTitle } : {};
}

export default async function AllProducts({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [products, menu] = await Promise.all([getCatalog(), getMenu()]);
  return (
    <div className="container" style={{ paddingBottom: 56 }}>
      <div className="page-head">
        <p className="crumbs"><Link href={`/${locale}`}>{t.nav.home}</Link> / {t.shop.allTitle}</p>
        <h1>{t.shop.allTitle}</h1>
        {menu.length > 0 && (
          <nav className="chips" aria-label={t.footer.categories}>
            {menu.map((c) => <Link key={c.id} href={`/${locale}/category/${c.slug}`} className="chip">{localized(locale, c.nameEn, c.nameAr)}</Link>)}
          </nav>
        )}
      </div>
      {products.length === 0 ? <p className="muted">{t.home.nothingYet}</p> : <ProductGrid products={inStockFirst(products)} locale={locale} t={t} />}
    </div>
  );
}
