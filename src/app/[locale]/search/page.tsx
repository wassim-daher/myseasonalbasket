import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/product-card';
import { SearchForm } from '@/components/search-form';
import { inStockFirst, searchProducts } from '@/lib/catalog';
import { dictionary, format, isLocale } from '@/lib/i18n';
import { getCatalog } from '@/server/shop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).nav.search, robots: { index: false } } : {};
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? '').trim().slice(0, 80);
  const results = q ? inStockFirst(searchProducts(await getCatalog(), q)) : [];

  return (
    <div className="container" style={{ paddingBottom: 56 }}>
      <div className="page-head">
        <h1>{t.nav.search}</h1>
        <div className="search-panel" style={{ margin: 0, maxWidth: 'none' }}><SearchForm locale={locale} t={t} value={q} /></div>
        {q && <p className="soft" role="status">{results.length ? format(t.shop.resultsFor, { count: results.length, q }) : format(t.shop.noResults, { q })}</p>}
      </div>
      {results.length > 0 && <ProductGrid products={results} locale={locale} t={t} />}
    </div>
  );
}
