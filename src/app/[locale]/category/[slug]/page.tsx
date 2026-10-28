import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/product-card';
import { findCategory, inStockFirst, productsIn } from '@/lib/catalog';
import { dictionary, isLocale, localized } from '@/lib/i18n';
import { getCatalog, getMenu } from '@/server/shop';

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const found = findCategory(await getMenu(), slug);
  return found ? { title: localized(locale, found.category.nameEn, found.category.nameAr) } : {};
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const [menu, products] = await Promise.all([getMenu(), getCatalog()]);
  const found = findCategory(menu, slug);
  if (!found) notFound();
  const name = (c: { nameEn: string; nameAr: string }) => localized(locale, c.nameEn, c.nameAr);
  const top = found.parent ?? found.category;
  const siblings = found.parent ? found.parent.children : found.children;
  const items = inStockFirst(productsIn(products, menu, slug));

  return (
    <div className="container" style={{ paddingBottom: 56 }}>
      <div className="page-head">
        <p className="crumbs">
          <Link href={`/${locale}`}>{t.nav.home}</Link> / {found.parent && <><Link href={`/${locale}/category/${found.parent.slug}`}>{name(found.parent)}</Link> / </>}{name(found.category)}
        </p>
        <h1>{name(found.category)}</h1>
        {siblings.length > 0 && (
          <nav className="chips" aria-label={name(top)}>
            <Link href={`/${locale}/category/${top.slug}`} className="chip" aria-current={found.parent ? undefined : 'page'}>{t.shop.showAll}</Link>
            {siblings.map((c) => (
              <Link key={c.id} href={`/${locale}/category/${c.slug}`} className="chip" aria-current={c.slug === slug ? 'page' : undefined}>{name(c)}</Link>
            ))}
          </nav>
        )}
      </div>
      {items.length === 0 ? <p className="muted">{t.shop.emptyCategory}</p> : <ProductGrid products={items} locale={locale} t={t} />}
    </div>
  );
}
