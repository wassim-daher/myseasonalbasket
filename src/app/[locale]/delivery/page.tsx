import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dictionary, isLocale, localized, type Locale } from '@/lib/i18n';
import { formatPrice, toCents } from '@/lib/money';
import { getDeliveryOptions, getZones } from '@/server/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).pages.deliveryTitle } : {};
}

const weekdayNames: Record<Locale, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

export default async function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  const zones = await getZones();
  // The weekly windows each area has, read from the days still open to order.
  const windows = await Promise.all(zones.map(async (z) => {
    const options = await getDeliveryOptions(z.id);
    const seen = new Map<string, string>();
    for (const o of options) {
      const day = new Date(`${o.deliveryDate}T00:00:00Z`).getUTCDay();
      const key = `${day}|${o.startTime}`;
      if (!seen.has(key)) seen.set(key, `${weekdayNames[locale][day]} ${o.startTime}–${o.endTime}`);
    }
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, label]) => label);
  }));

  return (
    <div className="container">
      <div className="page-head">
        <p className="crumbs"><Link href={`/${locale}`}>{t.nav.home}</Link> / {t.pages.deliveryTitle}</p>
        <h1>{t.pages.deliveryTitle}</h1>
      </div>
      <div className="prose">
        <p>{t.pages.deliveryIntro}</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th scope="col">{t.pages.deliveryArea}</th><th scope="col">{t.pages.deliveryFee}</th><th scope="col">{t.pages.deliveryMin}</th><th scope="col">{t.pages.deliveryDays}</th></tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={z.id}>
                  <th scope="row" style={{ background: 'none' }}>{localized(locale, z.nameEn, z.nameAr)}</th>
                  <td>{formatPrice(z.feeUsd)}</td>
                  <td>{toCents(z.minOrderUsd) > 0 ? formatPrice(z.minOrderUsd) : t.pages.noMinimum}</td>
                  <td dir="auto">{windows[i].length ? windows[i].join(' · ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">{t.pages.deliveryCutoff}</p>
      </div>
    </div>
  );
}
