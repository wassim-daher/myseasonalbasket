import type { CatalogProduct, MenuCategory } from './shop-types';

/** Finds a category by slug: a top-level one, or a sub-category with its parent. */
export function findCategory(menu: MenuCategory[], slug: string) {
  for (const top of menu) {
    if (top.slug === slug) return { category: top, parent: null, children: top.children };
    const child = top.children.find((c) => c.slug === slug);
    if (child) return { category: child, parent: top, children: [] };
  }
  return null;
}

/** Products in a category, including its sub-categories. */
export function productsIn(products: CatalogProduct[], menu: MenuCategory[], slug: string) {
  const found = findCategory(menu, slug);
  if (!found) return [];
  const ids = new Set([found.category.id, ...found.children.map((c) => c.id)]);
  return products.filter((p) => p.categoryId && ids.has(p.categoryId));
}

/** Lower-cases and strips Arabic diacritics so "زَيت" finds "زيت". */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ̀-ͯ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/** Products whose English or Arabic name or description contains every word searched. */
export function searchProducts(products: CatalogProduct[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const haystack = normalize([p.nameEn, p.nameAr, p.descriptionEn, p.descriptionAr, p.unitNameEn, p.unitNameAr].join(' '));
    return words.every((w) => haystack.includes(w));
  });
}

/** In-stock first, keeping the farm's own order otherwise. */
export function inStockFirst(products: CatalogProduct[]) {
  return [...products].sort((a, b) => Number(b.availableUnits > 0) - Number(a.availableUnits > 0));
}

/**
 * Best sellers for the home page: products ranked by recent sales first, then the
 * farm's featured picks, then anything else in stock, so the row is never empty
 * while the shop is new. Only products that can be bought are shown.
 */
export function bestSellers(products: CatalogProduct[], count: number) {
  const buyable = products.filter((p) => p.availableUnits > 0);
  const ranked = buyable.filter((p) => p.salesRank !== null).sort((a, b) => (a.salesRank ?? 0) - (b.salesRank ?? 0));
  const picked = new Set(ranked.map((p) => p.id));
  const featured = buyable.filter((p) => p.featured && !picked.has(p.id));
  featured.forEach((p) => picked.add(p.id));
  const rest = buyable.filter((p) => !picked.has(p.id));
  return [...ranked, ...featured, ...rest].slice(0, count);
}

/** New products and those coming soon, newest season first. */
export function newThisSeason(products: CatalogProduct[], count: number) {
  return products.filter((p) => p.isNew || p.comingSoon).sort((a, b) => Number(b.availableUnits > 0) - Number(a.availableUnits > 0)).slice(0, count);
}
