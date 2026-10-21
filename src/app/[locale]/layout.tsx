import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';
import { CartProvider } from '@/components/cart-context';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { dictionary, direction, isLocale } from '@/lib/i18n';
import { getBaskets, getMenu, getSettings } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dictionary(locale);
  return {
    title: { default: t.brand, template: `%s · ${t.brand}` },
    description: t.home.lead,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    alternates: { languages: { en: '/en', ar: '/ar' } },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#3e5a2b', width: 'device-width', initialScale: 1 };

/** The header menu and footer still render if the shop data can't be read. */
async function shell() {
  try {
    const [menu, baskets, settings] = await Promise.all([getMenu(), getBaskets(), getSettings()]);
    return { menu, hasBaskets: baskets.length > 0, whatsappPhone: settings.whatsappPhone };
  } catch (error) {
    console.error('shop shell failed', error);
    return { menu: [], hasBaskets: false, whatsappPhone: '' };
  }
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const { menu, hasBaskets, whatsappPhone } = await shell();
  return (
    <html lang={locale} dir={direction(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- one shared layout per language */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Tajawal:wght@400;500;700&display=swap" />
      </head>
      <body>
        <CartProvider>
          <SiteHeader locale={locale} t={t} menu={menu} hasBaskets={hasBaskets} />
          <main>{children}</main>
          <SiteFooter locale={locale} t={t} menu={menu} whatsappPhone={whatsappPhone} />
        </CartProvider>
      </body>
    </html>
  );
}
