import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';
import { CartProvider } from '@/components/cart-context';
import { SiteHeader } from '@/components/site-header';
import { dictionary, direction, isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  return (
    <html lang={locale} dir={direction(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- one shared layout per language */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <CartProvider>
          <SiteHeader locale={locale} t={t} />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="container">
              <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{t.brand}</strong>
              <span>{t.footer.location}</span>
              <span>myseasonalbasket.com</span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
