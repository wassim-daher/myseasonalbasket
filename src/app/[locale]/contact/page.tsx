import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WhatsAppIcon } from '@/components/icons';
import { dictionary, isLocale } from '@/lib/i18n';
import { whatsappLink } from '@/lib/whatsapp';
import { getSettings } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).pages.contactTitle } : {};
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const { whatsappPhone } = await getSettings();
  const wa = whatsappPhone ? whatsappLink(whatsappPhone, '') : null;
  return (
    <div className="container">
      <div className="page-head">
        <p className="crumbs"><Link href={`/${locale}`}>{t.nav.home}</Link> / {t.pages.contactTitle}</p>
        <h1>{t.pages.contactTitle}</h1>
      </div>
      <div className="prose">
        <p>{t.pages.contactIntro}</p>
        {wa && (
          <div className="actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <a href={wa} className="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={22} /> {t.pages.contactWhatsapp}</a>
            <a href={`tel:${whatsappPhone.replace(/[^\d+]/g, '')}`} dir="ltr" style={{ fontSize: 18 }}>{whatsappPhone}</a>
          </div>
        )}
        <p className="muted">{t.footer.location}</p>
      </div>
    </div>
  );
}
