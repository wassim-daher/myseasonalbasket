import { notFound } from 'next/navigation';
import { dictionary, isLocale } from '@/lib/i18n';
import { MyOrdersView } from './my-orders-view';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).orders.title, robots: { index: false } } : {};
}

export default async function MyOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  return (
    <div className="container">
      <h1 className="page-title">{t.orders.title}</h1>
      <MyOrdersView locale={locale} t={t} />
    </div>
  );
}
