import { notFound } from 'next/navigation';
import { CheckoutForm } from './checkout-form';
import { dictionary, isLocale } from '@/lib/i18n';
import { getBaskets, getCatalog, getSettings, getZones } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).checkout.title } : {};
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [products, baskets, zones, settings] = await Promise.all([getCatalog(), getBaskets(), getZones(), getSettings()]);
  return (
    <CheckoutForm
      locale={locale}
      t={dictionary(locale)}
      products={products}
      baskets={baskets}
      zones={zones}
      ordersOpen={settings.ordersOpen}
      paymentMethods={settings.paymentMethods.filter((m) => m !== 'card')}
    />
  );
}
