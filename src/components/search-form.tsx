import { SearchIcon } from './icons';
import type { Dictionary, Locale } from '@/lib/i18n';

/** A plain GET form, so search works even before the page's script loads. */
export function SearchForm({ locale, t, value = '' }: { locale: Locale; t: Dictionary; value?: string }) {
  return (
    <form className="search-form" action={`/${locale}/search`} method="get" role="search">
      <label htmlFor="q" className="visually-hidden">{t.shop.searchPlaceholder}</label>
      <input id="q" name="q" type="search" placeholder={t.shop.searchPlaceholder} defaultValue={value} maxLength={80} />
      <button type="submit"><SearchIcon size={20} /> {t.shop.searchButton}</button>
    </form>
  );
}
