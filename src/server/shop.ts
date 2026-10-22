import 'server-only';
import { farmId, pool } from './db';
import type { CheckoutCommand } from '@/lib/checkout';
import type {
  Banner, Basket, CatalogProduct, Category, DeliveryOption, MenuCategory, DeliveryZone, OrderSummary, PaymentMethod, PlacedOrder, ShopSettings,
} from '@/lib/shop-types';

// Everything the store reads or writes goes through these functions. Prices,
// stock and order checks live in the database (Farm Agent's shop_* functions).

const money = (value: unknown) => String(value);

export async function getCatalog(): Promise<CatalogProduct[]> {
  const { rows } = await pool().query(
    `SELECT id, slug, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "categoryId", "imagePath",
            "unitNameEn", "unitNameAr", "priceUsd"::text AS "priceUsd", "availableUnits", featured, "isNew", "comingSoon", "salesRank"
       FROM shop_catalog($1)`,
    [farmId()],
  );
  return rows.map((r) => ({ ...r, priceUsd: money(r.priceUsd) }));
}

/** Published home page slides, in order. */
export async function getBanners(): Promise<Banner[]> {
  const { rows } = await pool().query<Banner>(
    `SELECT id::text, "headlineAr", "titleEn", "titleAr", "ctaEn", "ctaAr", "linkPath", "imagePath", theme
       FROM "ShopBanner" WHERE "farmId"=$1 AND published ORDER BY "sortOrder", "createdAt"`,
    [farmId()],
  );
  return rows;
}

/** Published categories, top level first, each with its sub-categories, in menu order. */
export async function getMenu(): Promise<MenuCategory[]> {
  const { rows } = await pool().query<Category & { sortOrder: number }>(
    `SELECT id, "parentId", slug, "nameEn", "nameAr", highlight, "sortOrder"
       FROM "ShopCategory" WHERE "farmId"=$1 AND published ORDER BY "sortOrder", "nameEn"`,
    [farmId()],
  );
  const strip = ({ id, parentId, slug, nameEn, nameAr, highlight }: Category) => ({ id, parentId, slug, nameEn, nameAr, highlight });
  return rows
    .filter((c) => !c.parentId)
    .map((top) => ({ ...strip(top), children: rows.filter((c) => c.parentId === top.id).map(strip) }));
}

export async function getBaskets(): Promise<Basket[]> {
  const { rows } = await pool().query(
    `SELECT id, slug, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "imagePath",
            "priceUsd"::text AS "priceUsd", frequencies, contents, "availableUnits"
       FROM shop_baskets($1)`,
    [farmId()],
  );
  return rows.map((r) => ({
    ...r,
    priceUsd: money(r.priceUsd),
    contents: (r.contents as Basket['contents']).map((c) => ({ ...c, quantity: String(Number(c.quantity)) })),
  }));
}

export async function getSettings(): Promise<ShopSettings> {
  const { rows } = await pool().query(
    `SELECT "ordersOpen", "paymentMethods", "whatsappPhone", "wishAccount", "omtAccount" FROM "ShopSettings" WHERE "farmId"=$1`,
    [farmId()],
  );
  // No settings row yet: the store shows its catalog but takes no orders.
  return rows[0] ?? { ordersOpen: false, paymentMethods: [], whatsappPhone: '', wishAccount: '', omtAccount: '' };
}

export async function getZones(): Promise<DeliveryZone[]> {
  const { rows } = await pool().query(
    `SELECT id, "nameEn", "nameAr", "feeUsd"::text AS "feeUsd", "minOrderUsd"::text AS "minOrderUsd"
       FROM "ShopDeliveryZone" WHERE "farmId"=$1 AND active ORDER BY "sortOrder", "nameEn"`,
    [farmId()],
  );
  return rows;
}

export async function getDeliveryOptions(zoneId: string): Promise<DeliveryOption[]> {
  const { rows } = await pool().query(
    `SELECT "slotId", to_char("deliveryDate",'YYYY-MM-DD') AS "deliveryDate", "startTime", "endTime", "spotsLeft"
       FROM shop_delivery_options($1,$2)`,
    [farmId(), zoneId],
  );
  return rows;
}

/** Places the order. Throws the database's SHOP_* code when it refuses. */
export async function placeOrder(command: CheckoutCommand, shopCustomerId: string | null = null): Promise<PlacedOrder> {
  const payload = {
    shopCustomerId,
    requestKey: command.requestKey,
    contactName: command.contactName,
    phone: command.phone,
    email: command.email,
    language: command.locale,
    zoneId: command.zoneId,
    slotId: command.slotId,
    deliveryDate: command.deliveryDate,
    addressLine: command.addressLine,
    addressNotes: command.addressNotes,
    paymentMethod: command.paymentMethod,
    notes: command.notes,
    lines: command.lines,
  };
  const { rows } = await pool().query('SELECT shop_place_order($1,$2::jsonb) AS result', [farmId(), JSON.stringify(payload)]);
  const result = rows[0].result as { orderId: string; reference: string; totalUsd: number | string };
  return { orderId: result.orderId, reference: result.reference, totalUsd: money(result.totalUsd) };
}

export async function getOrder(orderId: string): Promise<OrderSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const { rows } = await pool().query(
    `SELECT o.id, o.reference, o.status, o."contactName", o.phone, o.language, z."nameEn" AS "zoneNameEn", z."nameAr" AS "zoneNameAr",
            to_char(o."deliveryDate",'YYYY-MM-DD') AS "deliveryDate", s."startTime", s."endTime", o."addressLine",
            o."paymentMethod", o."paymentStatus", o."shopCustomerId"::text AS "shopCustomerId", to_char(o."createdAt",'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "placedAt", o."subtotalUsd"::text AS "subtotalUsd", o."deliveryFeeUsd"::text AS "deliveryFeeUsd", o."totalUsd"::text AS "totalUsd",
            coalesce((SELECT json_agg(json_build_object('kind',l.kind,'name',l."nameSnapshot",'unitName',l."unitNameSnapshot",
                      'quantity',l.quantity,'lineTotalUsd',l."lineTotalUsd"::text) ORDER BY l.kind DESC, l."nameSnapshot")
                      FROM "ShopOrderLine" l WHERE l."orderId"=o.id),'[]') AS lines
       FROM "ShopOrder" o
       JOIN "ShopDeliveryZone" z ON z.id=o."zoneId"
       JOIN "ShopDeliverySlot" s ON s.id=o."slotId"
      WHERE o.id=$1 AND o."farmId"=$2`,
    [orderId, farmId()],
  );
  if (!rows[0]) return null;
  return { ...rows[0], paymentMethod: rows[0].paymentMethod as PaymentMethod };
}

