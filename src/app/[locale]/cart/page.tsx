import { notFound } from 'next/navigation';
import { CartView } from './cart-view';
import { dictionary, isLocale } from '@/lib/i18n';
import { getBaskets, getCatalog } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).cart.title } : {};
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [products, baskets] = await Promise.all([getCatalog(), getBaskets()]);
  return <CartView locale={locale} t={dictionary(locale)} products={products} baskets={baskets} />;
}
