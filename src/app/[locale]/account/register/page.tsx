import { notFound, redirect } from 'next/navigation';
import { safeNext } from '@/lib/account';
import { dictionary, isLocale } from '@/lib/i18n';
import { whatsappLink } from '@/lib/whatsapp';
import { currentCustomer } from '@/server/account';
import { getSettings } from '@/server/shop';
import { AuthForm } from '../auth-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).account.registerTitle, robots: { index: false } } : {};
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  const target = next ? safeNext(next, locale) : '';
  if (await currentCustomer()) redirect(target || `/${locale}/account`);
  const settings = await getSettings().catch(() => null);
  const forgot = settings?.whatsappPhone
    ? whatsappLink(settings.whatsappPhone, locale === 'ar' ? 'مرحباً، نسيت كلمة المرور لحسابي على سلّتي الموسمية.' : 'Hello, I forgot the password of my My Seasonal Basket account.')
    : null;
  return (
    <div className="container">
      <AuthForm mode="register" locale={locale} t={dictionary(locale)} next={target} forgotHref={forgot} />
    </div>
  );
}
