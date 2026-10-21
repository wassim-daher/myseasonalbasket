import { describe, expect, it } from 'vitest';
import { bestSellers, findCategory, inStockFirst, newThisSeason, normalize, productsIn, searchProducts } from '@/lib/catalog';
import type { CatalogProduct, MenuCategory } from '@/lib/shop-types';

const product = (id: string, over: Partial<CatalogProduct>): CatalogProduct => ({
  id, slug: id, nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', categoryId: null, imagePath: '',
  unitNameEn: 'kg', unitNameAr: 'كغ', priceUsd: '1.00', availableUnits: 5, featured: false, isNew: false, comingSoon: false, salesRank: null, ...over,
});

const menu: MenuCategory[] = [
  {
    id: 'fv', parentId: null, slug: 'fruits-vegetables', nameEn: 'Fruits & Vegetables', nameAr: 'خضار وفاكهة', highlight: false,
    children: [
      { id: 'veg', parentId: 'fv', slug: 'vegetables', nameEn: 'Vegetables', nameAr: 'خضار', highlight: false },
      { id: 'fruit', parentId: 'fv', slug: 'fruits', nameEn: 'Fruits', nameAr: 'فاكهة', highlight: false },
    ],
  },
  { id: 'pantry', parentId: null, slug: 'pantry', nameEn: 'Pantry', nameAr: 'مونة', highlight: false, children: [] },
];

const products = [
  product('tomato', { nameEn: 'Tomatoes', nameAr: 'بندورة', categoryId: 'veg' }),
  product('fig', { nameEn: 'Figs', nameAr: 'تين', categoryId: 'fruit', availableUnits: 0 }),
  product('oil', { nameEn: 'Extra virgin olive oil', nameAr: 'زيت زيتون بكر', categoryId: 'pantry' }),
  product('loose', { nameEn: 'Loose item', categoryId: null }),
];

describe('catalog', () => {
  it('finds categories and their parent', () => {
    expect(findCategory(menu, 'fruits')?.parent?.slug).toBe('fruits-vegetables');
    expect(findCategory(menu, 'pantry')?.parent).toBeNull();
    expect(findCategory(menu, 'nope')).toBeNull();
  });

  it('lists a top category with its sub-categories', () => {
    expect(productsIn(products, menu, 'fruits-vegetables').map((p) => p.id)).toEqual(['tomato', 'fig']);
    expect(productsIn(products, menu, 'fruits').map((p) => p.id)).toEqual(['fig']);
    expect(productsIn(products, menu, 'nope')).toEqual([]);
  });

  it('searches English and Arabic, ignoring case and diacritics', () => {
    expect(searchProducts(products, 'OLIVE oil').map((p) => p.id)).toEqual(['oil']);
    expect(searchProducts(products, 'زَيت').map((p) => p.id)).toEqual(['oil']);
    expect(searchProducts(products, 'oil tomato')).toEqual([]);
    expect(searchProducts(products, '   ')).toEqual([]);
    expect(normalize('أَهلاً')).toBe('اهلا');
  });

  it('puts what is in stock first', () => {
    expect(inStockFirst(products).at(-1)?.id).toBe('fig');
  });

  it('picks best sellers by rank, then featured, then the rest, never sold out', () => {
    const list = [
      product('a', { featured: true }),
      product('b', { salesRank: 2 }),
      product('c', { salesRank: 1 }),
      product('d', { salesRank: 3, availableUnits: 0 }),
      product('e', {}),
    ];
    expect(bestSellers(list, 4).map((p) => p.id)).toEqual(['c', 'b', 'a', 'e']);
    expect(bestSellers(list, 2).map((p) => p.id)).toEqual(['c', 'b']);
  });

  it('lists new and coming-soon products, buyable ones first', () => {
    const list = [product('soon', { comingSoon: true, availableUnits: 0 }), product('new', { isNew: true }), product('old', {})];
    expect(newThisSeason(list, 6).map((p) => p.id)).toEqual(['new', 'soon']);
  });
});
