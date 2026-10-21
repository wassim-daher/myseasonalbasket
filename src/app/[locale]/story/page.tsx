import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? { title: dictionary(locale).pages.storyTitle } : {};
}

export default async function StoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionary(locale);
  return (
    <div className="container">
      <div className="page-head">
        <p className="crumbs"><Link href={`/${locale}`}>{t.nav.home}</Link> / {t.pages.storyTitle}</p>
        <h1>{t.pages.storyTitle}</h1>
      </div>
      <div className="prose">
        <p>{t.footer.about}</p>
        <p className="muted">{t.pages.storyBody}</p>
      </div>
    </div>
  );
}
