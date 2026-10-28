import { notFound } from 'next/navigation';
import { CheckoutForm } from './checkout-form';
import { dictionary, isLocale } from '@/lib/i18n';
import { currentCustomer, defaultAddress } from '@/server/account';
import { getBaskets, getCatalog, getSettings, getZones } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).checkout.title } : {};
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [products, baskets, zones, settings, customer] = await Promise.all([getCatalog(), getBaskets(), getZones(), getSettings(), currentCustomer()]);
  const address = customer ? await defaultAddress(customer.id) : null;
  const account = customer ? { name: customer.name, phone: customer.phone, address } : null;
  return (
    <CheckoutForm
      locale={locale}
      t={dictionary(locale)}
      products={products}
      baskets={baskets}
      zones={zones}
      ordersOpen={settings.ordersOpen}
      paymentMethods={settings.paymentMethods.filter((m) => m !== 'card')}
      account={account}
    />
  );
}
