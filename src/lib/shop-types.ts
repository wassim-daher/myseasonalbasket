// Shapes of what the farm database returns to the store (see Farm Agent's
// migration 202610210001_online_shop). Money arrives as strings to keep cents exact.

export type PaymentMethod = 'cod' | 'whatsapp' | 'wish' | 'omt' | 'card';

export type CatalogProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  categoryId: string | null;
  imagePath: string;
  unitNameEn: string;
  unitNameAr: string;
  priceUsd: string;
  availableUnits: number;
  featured: boolean;
  isNew: boolean;
  comingSoon: boolean;
  /** 1 = best seller over the last 90 days; null when it hasn't sold yet. */
  salesRank: number | null;
};

export type Banner = {
  id: string;
  headlineAr: string;
  titleEn: string;
  titleAr: string;
  ctaEn: string;
  ctaAr: string;
  linkPath: string;
  imagePath: string;
  theme: 'olive' | 'earth' | 'leaf';
};

export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  nameEn: string;
  nameAr: string;
  highlight: boolean;
};

/** A top-level menu entry with its sub-categories. */
export type MenuCategory = Category & { children: Category[] };

export type BasketContent = { nameEn: string; nameAr: string; quantity: string; unitNameEn: string; unitNameAr: string };

export type Basket = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imagePath: string;
  priceUsd: string;
  frequencies: string[];
  contents: BasketContent[];
  availableUnits: number;
};

export type DeliveryZone = { id: string; nameEn: string; nameAr: string; feeUsd: string; minOrderUsd: string };

export type DeliveryOption = { slotId: string; deliveryDate: string; startTime: string; endTime: string; spotsLeft: number | null };

export type ShopSettings = {
  ordersOpen: boolean;
  paymentMethods: PaymentMethod[];
  whatsappPhone: string;
  wishAccount: string;
  omtAccount: string;
};

export type PlacedOrder = { orderId: string; reference: string; totalUsd: string };

export type OrderSummary = {
  id: string;
  reference: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'cancelled';
  contactName: string;
  phone: string;
  language: string;
  zoneNameEn: string;
  zoneNameAr: string;
  deliveryDate: string;
  startTime: string;
  endTime: string;
  addressLine: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid';
  /** The account the order belongs to, or null for a guest order. */
  shopCustomerId: string | null;
  /** When the order was placed (ISO timestamp). */
  placedAt: string;
  subtotalUsd: string;
  deliveryFeeUsd: string;
  totalUsd: string;
  lines: { kind: 'product' | 'basket'; name: string; unitName: string; quantity: number; lineTotalUsd: string }[];
};

/** One order in the shopper's account. */
export type AccountOrder = Pick<OrderSummary, 'id' | 'reference' | 'status' | 'paymentStatus' | 'paymentMethod' | 'deliveryDate' | 'startTime' | 'endTime' | 'totalUsd' | 'placedAt'> & {
  itemCount: number;
};

/** A signed-in shopper. */
export type Customer = { id: string; name: string; phone: string; language: string };

/** The shopper's saved delivery address. */
export type AccountAddress = { zoneId: string; line: string; notes: string };
